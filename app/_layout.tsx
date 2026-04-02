import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
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
