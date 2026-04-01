import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      {/* 로고 영역 */}
      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoSymbol}>🏒</Text>
        </View>
        <Text style={styles.logoText}>IceIQ</Text>
        <Text style={styles.tagline}>AI-Powered Hockey Analysis</Text>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.btnText}>Get Started</Text>
        </Pressable>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.bg,
    justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 80,
  },
  logoArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  logoIcon: {
    width: 96, height: 96, borderRadius: 24,
    backgroundColor: Colors.card,
    borderWidth: 2, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  logoSymbol: { fontSize: 48 },
  logoText: { fontSize: 40, fontWeight: '800', color: Colors.text, letterSpacing: 2 },
  tagline: { fontSize: 16, color: Colors.accent, letterSpacing: 1 },
  bottom: { width: '100%', paddingHorizontal: 32, alignItems: 'center', gap: 16 },
  btn: {
    width: '100%', height: 52, borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { fontSize: 18, fontWeight: '700', color: Colors.bg },
  version: { fontSize: 12, color: Colors.subtext },
});
