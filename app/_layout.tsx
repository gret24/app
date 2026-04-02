import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { configureGoogleSignin } from '../lib/firebase';

// 앱 시작 시 Google 로그인 초기화
configureGoogleSignin();
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { RosterProvider } from '../contexts/RosterContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
    <RosterProvider>
    <AuthProvider>
      <SubscriptionProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionProvider>
    </AuthProvider>
    </RosterProvider>
    </LanguageProvider>
  );
}
