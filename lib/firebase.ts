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
  signInWithCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';

export const googleProvider = new GoogleAuthProvider();

const WEB_CLIENT_ID = '99041784463-2l9jdn499hrvi0jsuqdictiqeqcr300d.apps.googleusercontent.com';

// 앱 시작 시 1회 호출 (네이티브 Google 로그인 비활성화 - 웹 팝업만 사용)
export const configureGoogleSignin = () => {
  // Google Sign-in native module removed - using web popup only
};

export const signInWithGoogle = async () => {
  // 웹 팝업 방식 (Android/iOS 모두 동일하게 처리)
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
