// useProgressTracker.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../user_context';

export function useProgressTracker(moduleKey, lessonKey, totalItems) {
  const { user } = useUser();
  const [completedItems, setCompletedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef(null);
  // Remove pendingRef - not needed anymore

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

        lessons[lessonKey] = {
          totalItems,
          completedItems: completedArray,
          progress: progressPct,
          completed: isLessonComplete,
        };

        const updatedLessons = { ...lessons };
        const allLessonsComplete = Object.values(updatedLessons).every(
          (l) => l.completed === true
        );

        const updatedModuleData = {
          ...moduleData,
          lessons: updatedLessons,
          completed: allLessonsComplete,
        };

        const updatedModules = { ...modules, [moduleKey]: updatedModuleData };

        if (allLessonsComplete) {
          const moduleNum = parseInt(moduleKey.replace('module', ''), 10);
          const nextModuleKey = `module${moduleNum + 1}`;
          if (nextModuleKey in (existing.modules ?? {}) || moduleNum < 9) {
            const nextModule = updatedModules[nextModuleKey] ?? { completed: false, lessons: {} };
            updatedModules[nextModuleKey] = { ...nextModule, unlocked: true };
          }
        }

        await setDoc(
          docRef,
          { studentId: user.uid, modules: updatedModules },
          { merge: true }
        );
      } catch (err) {
        console.error('useProgressTracker: Failed to save progress', err);
      }
    }, 600);
  }, [user, docRef, moduleKey, lessonKey, totalItems]);

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