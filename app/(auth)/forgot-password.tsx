import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { sendPasswordReset } = useAuth();
  const router = useRouter();

  const handleReset = async () => {
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e: any) {
      Alert.alert('오류', e.message || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>비밀번호 재설정</Text>
          <Text style={styles.subtitle}>
            이메일을 입력하세요
          </Text>
        </View>

        {sent ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>이메일 전송 완료!</Text>
            <Text style={styles.successText}>
              받은 편지함에서 비밀번호 재설정 링크를 확인하세요.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>이메일</Text>
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

            <Pressable
              style={({ pressed }) => [styles.btn, (pressed || loading) && { opacity: 0.8 }]}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? '전송 중...' : '재설정 메일 보내기'}
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← 로그인으로 돌아가기</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: 28, justifyContent: 'center', gap: 32 },
  header: { alignItems: 'center', gap: 12 },
  icon: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.subtext, textAlign: 'center', lineHeight: 22 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, color: Colors.subtext, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    height: 52, borderRadius: 12,
    backgroundColor: Colors.input, paddingHorizontal: 16,
    color: Colors.text, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  btn: {
    height: 52, borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
  successCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 28,
    alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.accent + '44',
  },
  successIcon: { fontSize: 40 },
  successTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  successText: { fontSize: 14, color: Colors.subtext, textAlign: 'center' },
  backBtn: { alignSelf: 'center' },
  backText: { color: Colors.accent, fontSize: 15, fontWeight: '600' },
});
