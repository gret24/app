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

// 앱 시작 시 1회 호출
export const configureGoogleSignin = () => {
  if (Platform.OS !== 'web') {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    } catch (_) {}
  }
};

export const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    // 웹: 팝업 방식
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } else {
    // 네이티브 앱: GoogleSignin 방식
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  }
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
};
