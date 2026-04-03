import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithGoogle } from '../../lib/firebase';
import { Colors } from '../../constants/Colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keepLogin, setKeepLogin] = useState(true);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Welcome back to IceIQ</Text>
        </View>

        {/* 폼 */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.subtext}
              secureTextEntry
            />
          </View>

          {/* 로그인 유지 + 비밀번호 찾기 */}
          <View style={styles.rememberRow}>
            <Pressable style={styles.checkRow} onPress={() => setKeepLogin(v => !v)}>
              <View style={[styles.checkbox, keepLogin && styles.checkboxOn]}>
                {keepLogin && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>로그인 유지</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>비밀번호 찾기</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, (pressed || loading) && { opacity: 0.8 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>or</Text>
            <View style={styles.divLine} />
          </View>

          {/* Google 로그인 - Firebase Console 설정 후 활성화 예정 */}
          {/* <Pressable
            style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.8 }]}
            onPress={async () => {
              try {
                await signInWithGoogle();
                router.replace('/(tabs)');
              } catch (e: any) {
                Alert.alert('Google 로그인 실패', e.message);
              }
            }}
          >
            <Text style={styles.googleText}>🔵  Continue with Google</Text>
          </Pressable> */}
        </View>

        {/* 하단 링크 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  header: { marginBottom: 36, gap: 6 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.subtext },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, color: Colors.subtext, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    height: 52, borderRadius: 12,
    backgroundColor: Colors.input,
    paddingHorizontal: 16,
    color: Colors.text, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center' },
  checkboxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { fontSize: 12, color: Colors.bg, fontWeight: '800' },
  rememberText: { fontSize: 13, color: Colors.subtext },
  forgotText: { color: Colors.accent, fontSize: 13 },
  btn: {
    height: 52, borderRadius: 12, marginTop: 8,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { color: Colors.subtext, fontSize: 13 },
  googleBtn: {
    height: 52, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
  },
  googleText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: Colors.subtext, fontSize: 14 },
  linkText: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
});
