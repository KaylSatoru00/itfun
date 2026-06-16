// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnnl1ZKESvQUOjwk1CG_g_nG33reGtTUU",
  authDomain: "itfun-d75c1.firebaseapp.com",
  projectId: "itfun-d75c1",
  storageBucket: "itfun-d75c1.firebasestorage.app",
  messagingSenderId: "547714079819",
  appId: "1:547714079819:web:3dcd5af9ed4f3b35bbc1ce"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);