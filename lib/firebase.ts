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
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

WebBrowser.maybeCompleteAuthSession();

export const googleProvider = new GoogleAuthProvider();

const WEB_CLIENT_ID = '99041784463-2l9jdn499hrvi0jsuqdictiqeqcr300d.apps.googleusercontent.com';

export const configureGoogleSignin = () => {
  // no-op
};



export const signInWithGoogle = async () => {
  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  // Expo hosted auth proxy (https 필요 - Google OAuth 호환)
  const redirectUri = 'https://auth.expo.io/@gret24/iceiq';

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${WEB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=id_token` +
    `&scope=openid%20profile%20email` +
    `&nonce=${hashedNonce}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success') {
    throw new Error('Google 로그인이 취소되었습니다.');
  }

  // URL에서 id_token 추출
  const params = new URLSearchParams(result.url.split('#')[1] || result.url.split('?')[1] || '');
  const idToken = params.get('id_token');

  if (!idToken) {
    throw new Error('Google 인증 토큰을 받지 못했습니다.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
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
