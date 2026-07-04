// user_context.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const UserContext = createContext(null);

// Kada ganitong dami ng millisegundo, ire-refresh ng may-aktibong session
// ang `lastActiveAt` niya sa Firestore — ito ang "heartbeat" na ginagamit
// ng student_login.jsx/faculty_login.jsx para malaman kung "fresh" (aktibong
// ginagamit) o "stale" (na-close ang browser nang hindi nag-logout) na ang
// isang naka-claim nang session.
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    // restore from localStorage on first load
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // check faculty first, then students
      let snap = await getDoc(doc(db, 'faculty', firebaseUser.uid));
      if (!snap.exists()) {
        snap = await getDoc(doc(db, 'students', firebaseUser.uid));
      }
      if (snap.exists()) {
        const userData = { uid: firebaseUser.uid, ...snap.data() };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } else {
      setUser(null);
      localStorage.removeItem('user');
    }
  });

  return () => unsubscribe();
}, []);

  // ── Session heartbeat ──
  // Habang naka-login (may `user`), regular na ire-refresh ang `lastActiveAt`
  // ng account niya sa Firestore. Ginagamit ito ng login pages para
  // malaman kung "fresh" pa (occupied) o "stale" na (pwede nang i-claim
  // ulit ng bagong login attempt) ang isang session — hal. kung na-close
  // lang ng dating user ang browser nang hindi nag-Logout.
  useEffect(() => {
    if (!user?.uid) return;

    const collectionName = user.role === 'faculty' ? 'faculty' : 'students';
    const sendHeartbeat = () => {
      setDoc(doc(db, collectionName, user.uid), {
        lastActiveAt: serverTimestamp(),
      }, { merge: true }).catch((err) => {
        console.error('Heartbeat update failed:', err);
      });
    };

    sendHeartbeat(); // agad mag-refresh sa unang mount, hindi hihintayin ang unang interval
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [user?.uid, user?.role]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}