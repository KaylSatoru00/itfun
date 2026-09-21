import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useUser } from './user_context';

// Bumabalot sa mga chapter pages (student-chapter-N). Sinusuri kung naka-
// unlock na ang module na ito batay sa `studentProgress/{uid}` sa
// Firestore — kaparehong field (`modules[moduleId].unlocked`) na ginagamit
// ng student_modules.jsx para sa display. Ito ang humaharang mismo sa
// route-level sa direct-URL bypass (hal. pagpapalit lang ng
// `/student-chapter-3` papuntang `/student-chapter-4` sa address bar),
// dahil ang dating "Route Protection" na useEffect sa student_modules.jsx
// ay naka-scope lang doon sa component na iyon — kailanman hindi ito
// tumatakbo kapag ibang route/component (tulad ng Chapter4) na ang
// naka-mount, kaya hindi talaga naharang ang direct navigation.
export default function ProtectedModuleRoute({ children, moduleNum }) {
  const { user, authLoading } = useUser();
  const [unlocked, setUnlocked] = useState(moduleNum === 1);
  const [checking, setChecking] = useState(moduleNum !== 1);

  useEffect(() => {
    if (moduleNum === 1) return; // laging bukas ang unang module
    if (!user?.uid) return;

    const progressRef = doc(db, 'studentProgress', user.uid);
    // `includeMetadataChanges: true` + `fromCache` check: kaparehong
    // dahilan ng student_modules.jsx — huwag ituring na "locked" agad ang
    // isang cached-but-empty snapshot bago pa man makumpleto ang totoong
    // server round-trip.
    const unsub = onSnapshot(progressRef, { includeMetadataChanges: true }, (snap) => {
      if (!snap.exists()) {
        if (snap.metadata.fromCache) return;
        setUnlocked(false);
        setChecking(false);
        return;
      }

      const mData = (snap.data().modules || {})[`module${moduleNum}`] || {};
      setUnlocked(mData.unlocked ?? false);
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

  if (!unlocked) {
    return <Navigate to="/learning-modules" replace />;
  }

  return children;
}