// useProgressTracker.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../user_context';

export function useProgressTracker(moduleKey, lessonKey, totalItems) {
  const { user } = useUser();
  const [completedItems, setCompletedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef(null);

  const docRef = user ? doc(db, 'studentProgress', user.uid) : null;

  // Load saved progress on mount
  useEffect(() => {
    if (!user || !docRef) { setLoading(false); return; }

    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const saved = data?.modules?.[moduleKey]?.lessons?.[lessonKey]?.completedItems ?? [];
        setCompletedItems(new Set(saved));
      }
      setLoading(false);
    }).catch((err) => {
      console.error('useProgressTracker: Failed to load progress', err);
      setLoading(false);
    });
  }, [user?.uid, moduleKey, lessonKey]);

  // ── Debounced Firestore save ──
  const scheduleSave = useCallback((nextSet) => {
    if (!user || !docRef) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const completedArray = Array.from(nextSet);
        const progressPct =
          totalItems > 0
            ? Math.round((completedArray.length / totalItems) * 10000) / 100
            : 0;
        const isLessonComplete = completedArray.length >= totalItems && totalItems > 0;

        const snap = await getDoc(docRef);
        const existing = snap.exists() ? snap.data() : {};
        const modules = existing.modules ?? {};
        const moduleData = modules[moduleKey] ?? { unlocked: moduleKey === 'module1', completed: false, lessons: {} };
        const lessons = moduleData.lessons ?? {};

        // Update the specific lesson
        lessons[lessonKey] = {
          totalItems,
          completedItems: completedArray,
          progress: progressPct,
          completed: isLessonComplete,
        };

        const updatedLessons = { ...lessons };

        // ── CRITICAL FIX: Determine if ALL lessons in this module are complete ──
        // Get the module definition to know how many lessons this module should have
        const moduleDef = getModuleDefinition(moduleKey);
        if (!moduleDef) {
          console.error(`No module definition found for ${moduleKey}`);
          return;
        }

        // Check if ALL expected lessons exist and are complete
        let allLessonsComplete = true;
        const expectedLessonKeys = moduleDef.lessons;
        
        for (const expectedKey of expectedLessonKeys) {
          const lessonData = updatedLessons[expectedKey];
          // If ANY expected lesson is missing or not complete, module is NOT complete
          if (!lessonData || !lessonData.completed) {
            allLessonsComplete = false;
            break;
          }
        }

        // Also ensure no extra lessons are required - we only check expected ones
        // If there are no lessons defined for the module, it's not complete

        const updatedModuleData = {
          ...moduleData,
          lessons: updatedLessons,
          completed: allLessonsComplete,
          // IMPORTANT: Only mark as completed if ALL lessons are complete
          // DO NOT set unlocked here - that's handled by the module unlock logic
        };

        const updatedModules = { ...modules, [moduleKey]: updatedModuleData };

        // ── UNLOCK NEXT MODULE ONLY IF CURRENT MODULE IS COMPLETED ──
        if (allLessonsComplete) {
          const moduleNum = parseInt(moduleKey.replace('module', ''), 10);
          const nextModuleKey = `module${moduleNum + 1}`;
          
          // Only unlock if there is a next module (module9 has no next)
          if (moduleNum < 9) {
            // Check if next module exists in the data, if not create it
            const nextModule = updatedModules[nextModuleKey] ?? { 
              unlocked: false, 
              completed: false, 
              lessons: {} 
            };
            // Only set unlocked to true - DO NOT set completed
            updatedModules[nextModuleKey] = { 
              ...nextModule, 
              unlocked: true 
            };
          }
        }

        // ── IMPORTANT: If module is NOT complete, ensure next module stays locked ──
        if (!allLessonsComplete) {
          const moduleNum = parseInt(moduleKey.replace('module', ''), 10);
          const nextModuleKey = `module${moduleNum + 1}`;
          if (moduleNum < 9 && updatedModules[nextModuleKey]) {
            // Force next module to remain locked
            updatedModules[nextModuleKey] = {
              ...updatedModules[nextModuleKey],
              unlocked: false
            };
          }
        }

        // Save to Firestore
        await setDoc(
          docRef,
          { studentId: user.uid, modules: updatedModules },
          { merge: true }
        );
      } catch (err) {
        console.error('useProgressTracker: Failed to save progress', err);
      }
    }, 600);
  }, [user, docRef, moduleKey, totalItems]);

  // ── Track a first interaction ──
  const trackInteraction = useCallback((itemId) => {
    setCompletedItems((prev) => {
      if (prev.has(itemId)) return prev;
      const next = new Set(prev);
      next.add(itemId);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const progress =
    totalItems > 0
      ? Math.round((completedItems.size / totalItems) * 10000) / 100
      : 0;

  return { completedItems, progress, trackInteraction, loading };
}

// ── Helper function to get module definition ──
function getModuleDefinition(moduleKey) {
  // This must match the MODULE_DEFINITIONS in faculty_class.jsx
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

  return MODULE_DEFINITIONS[moduleKey] || null;
}