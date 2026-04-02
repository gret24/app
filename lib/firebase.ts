import { initializeApp, getApps } from 'firebase/app';
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

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
};
