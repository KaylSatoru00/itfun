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
// account.
//
// Ang `browserSessionPersistence` ay naka-scope sa `sessionStorage`, na
// TAB-ISOLATED by design — kaya independent na ang Firebase Auth identity
// ng bawat tab.
//
// ── `authReady` (race-condition guard) ──
// Ang `setPersistence()` ay ASYNCHRONOUS. Kung basta na lang tayong tumawag
// dito nang hindi hinihintay (fire-and-forget), may maliit na window kung
// saan ang Firebase SDK mismo ay maaaring mag-atempt na mag-hydrate ng
// `currentUser` gamit ang DEFAULT persistence (IndexedDB, shared sa buong
// browser) BAGO pa man matapos ma-apply ang session-scoped persistence na
// 'to — lalo na sa mga REFRESH, kung saan sabay-sabay tumatakbo ang
// module re-init (kasama ang onAuthStateChanged subscription sa
// user_context.jsx) at itong setPersistence() call. Kung may naiwang
// leftover na Firebase Auth entry sa shared IndexedDB (hal. mula sa
// mga naunang tab/session bago pa na-apply ang fix na ito), posibleng
// ma-hydrate muna nito ang MALING account sa panandaliang sandaling 'yon.
//
// Ini-export natin ang Promise na 'to para maaaring i-`await` muna ng
// `user_context.jsx` bago ito sumubscribe sa `onAuthStateChanged` —
// sinisiguradong naka-set na ang session-scoped persistence bago pa man
// magsimulang mag-restore ng session ang app sa kahit anong page load
// (kasama ang refresh).
export const authReady = setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.error('Failed to set Firebase Auth persistence:', err);
});