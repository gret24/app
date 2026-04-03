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
  signInWithCredential,
} from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

export const googleProvider = new GoogleAuthProvider();

const WEB_CLIENT_ID = '99041784463-2l9jdn499hrvi0jsuqdictiqeqcr300d.apps.googleusercontent.com';

export const configureGoogleSignin = () => {
  // no-op: using expo-auth-session
};

export const signInWithGoogle = async () => {
  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  const redirectUri = AuthSession.makeRedirectUri();

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const request = new AuthSession.AuthRequest({
    clientId: WEB_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    extraParams: { nonce: hashedNonce },
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.id_token) {
    throw new Error('Google 로그인이 취소되었습니다.');
  }

  const credential = GoogleAuthProvider.credential(result.params.id_token);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user;
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
};
