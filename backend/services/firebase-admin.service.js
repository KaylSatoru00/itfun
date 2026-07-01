import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ Missing FIREBASE_SERVICE_ACCOUNT environment variable');
} else if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  initializeApp({
    credential: cert(serviceAccount),
  });

  console.log('🔥 Firebase Admin initialized');
}

export const adminAuth = getAuth();