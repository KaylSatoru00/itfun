// user_context.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const UserContext = createContext(null);

const HEARTBEAT_INTERVAL_MS = 30 * 1000;

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // ── Auth loading state ──
  // `true` habang hindi pa nagre-resolve ang UNANG onAuthStateChanged
  // callback. Kailangan ito ng ProtectedRoute/RedirectIfAuthed para hindi
  // sila mag-redirect nang basta-basta base sa `user === null` — dahil
  // posibleng `null` pa lang siya dahil hindi pa tapos mag-check si
  // Firebase, hindi dahil talagang naka-logout na. Kapag walang ganitong
  // flag, ito yung common cause ng "nag-flash/nabalik sa login kahit
  // naka-login pa naman" na bug.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
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
          } else {
            // May Firebase auth session pero walang matching Firestore doc
            // (edge case: nabura sa Firestore, o hindi pa na-provision).
            // Huwag mag-assume ng role — i-clear na lang para hindi sila
            // makapasok sa mga protected route gamit ang stale localStorage data.
            setUser(null);
            localStorage.removeItem('user');
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── Session heartbeat ──
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

    sendHeartbeat();
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [user?.uid, user?.role]);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}