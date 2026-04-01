import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface User {
  uid: string;
  email: string;
  displayName?: string;
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
    // 앱 시작 시 저장된 토큰 확인
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const userData = await SecureStore.getItemAsync('user_data');
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error('토큰 로드 실패:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // TODO: Firebase Auth 연동 시 아래 함수들 교체
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock 로그인 (Firebase 연동 전)
      await new Promise(resolve => setTimeout(resolve, 800));
      if (!email || !password) throw new Error('이메일과 비밀번호를 입력해주세요');
      
      const mockUser: User = { uid: 'mock-uid-123', email, displayName: email.split('@')[0] };
      const mockToken = 'mock-token-' + Date.now();
      
      await SecureStore.setItemAsync('auth_token', mockToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(mockUser));
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, team?: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (!email || !password || !name) throw new Error('필수 항목을 입력해주세요');
      
      const mockUser: User = { uid: 'mock-uid-new', email, displayName: name };
      const mockToken = 'mock-token-' + Date.now();
      
      await SecureStore.setItemAsync('auth_token', mockToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(mockUser));
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
    setUser(null);
  };

  const sendPasswordReset = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (!email) throw new Error('이메일을 입력해주세요');
    // TODO: Firebase auth.sendPasswordResetEmail(email)
    console.log('Reset email sent to:', email);
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
