import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';

// The service account key is stored as a JSON string in an environment
// variable (e.g. in Railway's Variables tab), since we can't easily
// upload a raw .json file to most hosting platforms.
//
// To get this value:
// 1. Firebase Console -> Project Settings -> Service Accounts
// 2. Click "Generate new private key" -> downloads a .json file
// 3. Copy the ENTIRE contents of that file
// 4. Paste it as the value of FIREBASE_SERVICE_ACCOUNT in Railway's
//    environment variables (as a single-line JSON string)
//
// Kailangan din ng `databaseURL` (hiwalay sa service account JSON) para
// gumana ang RTDB Admin SDK — ito yung URL na makikita mo sa itaas ng
// Realtime Database tab sa Firebase Console (hal.
// https://itfun-d75c1-default-rtdb.firebaseio.com). I-set bilang
// FIREBASE_DATABASE_URL sa Railway env vars; may hardcoded fallback dito
// bilang safety net kung sakaling makalimutang i-set 'yon.

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ Missing FIREBASE_SERVICE_ACCOUNT environment variable');
} else if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://itfun-d75c1-default-rtdb.firebaseio.com',
  });

  console.log('🔥 Firebase Admin initialized');
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const adminRtdb = getDatabase();