import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { createUserProfile } from '../api/userService';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from '../lib/firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, team?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Firebase Auth 상태 변화 감지
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        // 로그인 시 Firestore lastLoginAt 업데이트
        try { await createUserProfile(firebaseUser.uid, firebaseUser.email ?? '', firebaseUser.displayName ?? ''); } catch (_) {}
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!email || !password) throw new Error('이메일과 비밀번호를 입력해주세요');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string, team?: string) => {
    if (!email || !password || !name) throw new Error('필수 항목을 입력해주세요');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Firestore에 사용자 프로필 생성
    try { await createUserProfile(cred.user.uid, email, name); } catch (_) {}
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const sendPasswordReset = async (email: string) => {
    if (!email) throw new Error('이메일을 입력해주세요');
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      signIn, signUp, signOut, sendPasswordReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
