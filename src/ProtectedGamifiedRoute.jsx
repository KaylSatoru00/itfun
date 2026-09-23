import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useUser } from './user_context';

// Bumabalot sa mga gamified minigame pages (gamified-N). Naiiba ito sa
// ProtectedModuleRoute: hindi lang "unlocked" ang kondisyon dito — kailangang
// KUMPLETO (100%) ang LAHAT ng lessons sa module na iyon, dahil ganito rin
// ang kondisyon ng "START GAME" button sa mismong chapter page (`sN.jsx`:
// `allLessonsComplete = Object.values(progress).every(p => p >= 100)`).
//
// Ang totoong source of truth dito ay `modules[moduleKey].completed` sa
// `studentProgress/{uid}` — sinasagot mismo ito ng useProgressTracker.js
// tuwing may na-track na interaction (hindi lang paminsan-minsan/recalculated
// ng ibang hook), kaya self-updating ito nang hindi umaasa sa ibang
// component/page na naka-mount muna.
export default function ProtectedGamifiedRoute({ children, moduleNum }) {
  const { user, authLoading } = useUser();
  const [complete, setComplete] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const moduleKey = `module${moduleNum}`;
    const progressRef = doc(db, 'studentProgress', user.uid);
    // `includeMetadataChanges: true` + `fromCache` check: parehong dahilan
    // ng ProtectedModuleRoute — huwag ituring na "hindi pa complete" agad
    // ang isang cached-but-empty snapshot bago pa man makumpleto ang totoong
    // server round-trip.
    const unsub = onSnapshot(progressRef, { includeMetadataChanges: true }, (snap) => {
      if (!snap.exists()) {
        if (snap.metadata.fromCache) return;
        setComplete(false);
        setChecking(false);
        return;
      }

      const mData = (snap.data().modules || {})[moduleKey] || {};
      setComplete(mData.completed === true);
      setChecking(false);
    });

    return () => unsub();
  }, [user?.uid, moduleNum]);

  if (authLoading || checking) {
    return null;
  }

  if (!user?.uid) {
    return <Navigate to="/student-login" replace />;
  }

  if (!complete) {
    return <Navigate to="/learning-modules" replace />;
  }

  return children;
}