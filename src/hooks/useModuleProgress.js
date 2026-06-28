// useModuleProgress.js
// Provides module unlock status for the whole app.
// This hook reads the top-level modules map from Firestore and initialises
// module1 as unlocked for new students.

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../user_context';

// ── Module definitions (must match the ones in useProgressTracker and faculty_class) ──
const MODULE_DEFINITIONS = {
  module1: {
    displayName: 'Introduction to Computers and History of Computers',
    lessons: ['lesson1', 'lesson2', 'lesson3'],
    totalLessons: 3,
  },
  module2: {
    displayName: 'Language & Types of Computers with Their Uses',
    lessons: ['lesson1', 'lesson2', 'lesson3', 'lesson4'],
    totalLessons: 4,
  },
  module3: {
    displayName: 'Number System & Conversions',
    lessons: ['lesson1', 'lesson2'],
    totalLessons: 2,
  },
  module4: {
    displayName: 'Hardware Components, Input and Output Devices & Basic PC-Building',
    lessons: ['parts', 'iodevices'],
    totalLessons: 2,
  },
  module5: {
    displayName: 'Types of Software',
    lessons: ['software'],
    totalLessons: 1,
  },
  module6: {
    displayName: 'Networking Fundamentals',
    lessons: ['characteristics', 'internet', 'areas'],
    totalLessons: 3,
  },
  module7: {
    displayName: 'Microsoft Office Applications',
    lessons: ['intro', 'powerpoint', 'word', 'excel'],
    totalLessons: 4,
  },
  module8: {
    displayName: 'Application of Computers in Different Fields',
    lessons: ['applications'],
    totalLessons: 1,
  },
  module9: {
    displayName: 'Keyboarding',
    lessons: ['keyboarding'],
    totalLessons: 1,
  },
};

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

    // ── Use onSnapshot for real-time updates ──
    const unsub = onSnapshot(docRef, async (snap) => {
      if (!snap.exists()) {
        // ── Brand-new student: initialise module1 as unlocked, rest locked ──
        const initial = { studentId: user.uid, modules: {} };
        for (let i = 1; i <= 9; i++) {
          const moduleKey = `module${i}`;
          initial.modules[moduleKey] = {
            unlocked: i === 1,  // Only module1 is unlocked initially
            completed: false,
            lessons: {},
          };
        }
        await setDoc(docRef, initial);
        setModuleStatus(initial.modules);
        setLoading(false);
        return;
      }

      const data = snap.data();
      const stored = data.modules ?? {};
      const merged = { ...stored };

      // ── Ensure all modules exist with proper unlock/completion status ──
      for (let i = 1; i <= 9; i++) {
        const key = `module${i}`;
        if (!merged[key]) {
          merged[key] = { 
            unlocked: i === 1, 
            completed: false, 
            lessons: {} 
          };
        }
      }

      // ── IMPORTANT: Recalculate module completion and unlock status ──
      // This ensures that if there's any inconsistency in Firestore, it gets fixed
      const moduleKeys = ['module1', 'module2', 'module3', 'module4', 'module5', 'module6', 'module7', 'module8', 'module9'];
      
      let needsUpdate = false;
      
      for (let i = 0; i < moduleKeys.length; i++) {
        const currentKey = moduleKeys[i];
        const currentModule = merged[currentKey] || { unlocked: false, completed: false, lessons: {} };
        const moduleDef = MODULE_DEFINITIONS[currentKey];
        
        if (!moduleDef) continue;
        
        // ── Check if ALL expected lessons are complete ──
        const lessons = currentModule.lessons || {};
        const expectedLessons = moduleDef.lessons;
        let allLessonsComplete = true;
        
        for (const lessonKey of expectedLessons) {
          const lessonData = lessons[lessonKey];
          if (!lessonData || !lessonData.completed) {
            allLessonsComplete = false;
            break;
          }
        }
        
        // ── If module should be completed but isn't, fix it ──
        if (allLessonsComplete && expectedLessons.length > 0 && !currentModule.completed) {
          merged[currentKey] = { ...currentModule, completed: true };
          needsUpdate = true;
        }
        
        // ── If module should NOT be completed but is, fix it ──
        if ((!allLessonsComplete || expectedLessons.length === 0) && currentModule.completed) {
          merged[currentKey] = { ...currentModule, completed: false };
          needsUpdate = true;
        }
      }
      
      // ── Now handle unlock status: strict sequential unlocking ──
      for (let i = 0; i < moduleKeys.length; i++) {
        const currentKey = moduleKeys[i];
        const currentModule = merged[currentKey];
        
        if (i === 0) {
          // Module 1 is always unlocked
          if (currentModule.unlocked !== true) {
            merged[currentKey] = { ...currentModule, unlocked: true };
            needsUpdate = true;
          }
        } else {
          // For modules 2-9: unlocked only if previous module is COMPLETED
          const prevKey = moduleKeys[i - 1];
          const prevModule = merged[prevKey];
          const shouldBeUnlocked = prevModule && prevModule.completed === true;
          
          if (currentModule.unlocked !== shouldBeUnlocked) {
            merged[currentKey] = { ...currentModule, unlocked: shouldBeUnlocked };
            needsUpdate = true;
          }
        }
      }
      
      // ── If we fixed any inconsistencies, save back to Firestore ──
      if (needsUpdate) {
        await setDoc(docRef, { studentId: user.uid, modules: merged }, { merge: true });
      }
      
      setModuleStatus(merged);
      setLoading(false);
    }, (error) => {
      console.error('useModuleProgress: Error listening to progress', error);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  return { moduleStatus, loading };
}