// useModuleProgress.js
// Provides module unlock status for the whole app.
// Place in src/hooks/ or src/.
//
// This hook reads the top-level modules map from Firestore and initialises
// module1 as unlocked for new students.

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../user_context';

/**
 * Returns the module unlock/completion status map.
 * { module1: { unlocked: true, completed: false }, module2: { unlocked: false, ... }, ... }
 *
 * Also initialises a brand-new student's progress document if it doesn't exist yet.
 */
export function useModuleProgress() {
  const { user } = useUser();
  const [moduleStatus, setModuleStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const docRef = doc(db, 'studentProgress', user.uid);

    getDoc(docRef).then(async (snap) => {
      if (!snap.exists()) {
        // ── Brand-new student: initialise module1 as unlocked, rest locked ──
        const initial = { studentId: user.uid, modules: {} };
        for (let i = 1; i <= 9; i++) {
          initial.modules[`module${i}`] = {
            unlocked: i === 1,
            completed: false,
            lessons: {},
          };
        }
        await setDoc(docRef, initial);
        setModuleStatus(initial.modules);
      } else {
        const data = snap.data();
        // Merge in any missing module keys (e.g. student existed before this system)
        const stored = data.modules ?? {};
        const merged = { ...stored };
        for (let i = 1; i <= 9; i++) {
          const key = `module${i}`;
          if (!merged[key]) {
            merged[key] = { unlocked: i === 1, completed: false, lessons: {} };
          }
        }
        // Make sure module1 is always unlocked
        merged.module1 = { ...merged.module1, unlocked: true };
        setModuleStatus(merged);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('useModuleProgress: Failed to load', err);
      setLoading(false);
    });
  }, [user?.uid]);

  return { moduleStatus, loading };
}