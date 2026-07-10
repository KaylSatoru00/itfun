// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBnnl1ZKESvQUOjwk1CG_g_nG33reGtTUU",
  authDomain: "itfun-d75c1.firebaseapp.com",
  projectId: "itfun-d75c1",
  storageBucket: "itfun-d75c1.firebasestorage.app",
  messagingSenderId: "547714079819",
  appId: "1:547714079819:web:3dcd5af9ed4f3b35bbc1ce",
  databaseURL: "https://itfun-d75c1-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// ── Per-tab auth persistence ──
// Default ng Firebase Auth ay `browserLocalPersistence` (IndexedDB) — ito ay
// SHARED sa BUONG BROWSER, hindi per-tab. Kaya kapag nag-login ng ibang
// account ang Tab 2, na-o-overwrite ang shared na `currentUser`, at
// nafi-fire ang onAuthStateChanged sa Tab 1 gamit na ang bagong (maling)
// account — dahilan kung bakit "nalo-logout" si Tab 1 kahit hindi naman
// niya account ang ginamit.
//
// Ang `browserSessionPersistence` ay naka-scope sa `sessionStorage`, na
// TAB-ISOLATED by design (hindi ito nagbo-broadcast sa ibang tabs) —
// kaya independent na ang Firebase Auth identity ng bawat tab. Tugma rin
// ito sa existing na `itfun_sessionId` mo sa sessionStorage, na tab-scoped
// na rin.
//
// KRITIKAL: kailangan itong ma-set NANG SYNCHRONOUS SA MODULE LOAD, bago
// pa man ma-mount ang UserProvider (user_context.jsx) at bago pa man
// tumakbo ang unang onAuthStateChanged listener nito — kung hindi,
// posibleng may race condition sa unang restore attempt sa page load.
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.error('Failed to set Firebase Auth persistence:', err);
});