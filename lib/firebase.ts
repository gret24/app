import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBy3HGldQ8ft-lk0fDbJWNSkEtAhKeI_ko",
  authDomain: "iceiq-web.firebaseapp.com",
  projectId: "iceiq-web",
  storageBucket: "iceiq-web.firebasestorage.app",
  messagingSenderId: "99041784463",
  appId: "1:99041784463:web:31f4ca5ac88ea894f876fa"
};

// 중복 초기화 방지
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
};
