// user_context.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const UserContext = createContext(null);

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

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}