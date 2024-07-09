import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../../path/to/serviceAccountKey.json';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

export function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as ServiceAccount),
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
    });
  }
}

export { admin };
