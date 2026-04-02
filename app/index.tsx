import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { Colors } from '../constants/Colors';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { lang, setLang } = useLang();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>

      {/* 언어 선택 (우상단) */}
      <View style={styles.langRow}>
        <Pressable
          style={[styles.langBtn, lang === 'ko' && styles.langBtnActive]}
          onPress={() => setLang('ko')}
        >
          <Text style={[styles.langText, lang === 'ko' && styles.langTextActive]}>🇰🇷 한국어</Text>
        </Pressable>
        <Pressable
          style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
          onPress={() => setLang('en')}
        >
          <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>🇺🇸 EN</Text>
        </Pressable>
      </View>

      {/* 로고 영역 */}
      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoSymbol}>🏒</Text>
        </View>
        <Text style={styles.logoText}>IceIQ</Text>
        <Text style={styles.tagline}>
          {lang === 'ko' ? 'AI 하키 분석 플랫폼' : 'AI-Powered Hockey Analysis'}
        </Text>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.btnText}>
            {lang === 'ko' ? '시작하기' : 'Get Started'}
          </Text>
        </Pressable>
        <Text style={styles.version}>v1.0.0</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32,
  },
  langRow: {
    flexDirection: 'row', gap: 8, alignSelf: 'flex-end', marginBottom: 'auto' as any,
  },
  langBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  langBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  langText: { fontSize: 13, color: Colors.subtext, fontWeight: '600' },
  langTextActive: { color: Colors.accent },
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
  bottom: { width: '100%', alignItems: 'center', gap: 16 },
  btn: {
    width: '100%', height: 52, borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { fontSize: 18, fontWeight: '700', color: Colors.bg },
  version: { fontSize: 12, color: Colors.subtext },
});
