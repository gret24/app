import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <SubscriptionProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}
