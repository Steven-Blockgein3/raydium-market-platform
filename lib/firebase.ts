import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCg3mbKXV8zp635_sxV5z2SMmm3QGMKXuk",
  authDomain: "market-maker-ca188.firebaseapp.com",
  projectId: "market-maker-ca188",
  storageBucket: "market-maker-ca188.appspot.com",
  messagingSenderId: "783382340654",
  appId: "1:783382340654:web:efe4332c833ccb7b206bbf",
  measurementId: "G-JWYTWKH8CH"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { db, auth, analytics };