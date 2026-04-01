import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [team, setTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirm) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name, team);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('가입 실패', e.message || '다시 시도해주세요.');
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
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join IceIQ and analyze your game</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Name', value: name, set: setName, placeholder: 'John Doe', type: 'default' },
            { label: 'Email', value: email, set: setEmail, placeholder: 'you@example.com', type: 'email-address' },
            { label: 'Password', value: password, set: setPassword, placeholder: '••••••••', secure: true },
            { label: 'Confirm Password', value: confirm, set: setConfirm, placeholder: '••••••••', secure: true },
            { label: 'Team Name (optional)', value: team, set: setTeam, placeholder: 'e.g. Ice Hawks', type: 'default' },
          ].map((field) => (
            <View key={field.label} style={styles.fieldGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.set}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.subtext}
                secureTextEntry={field.secure}
                keyboardType={(field.type as any) || 'default'}
                autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                autoCorrect={false}
              />
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [styles.btn, (pressed || loading) && { opacity: 0.8 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.linkText}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, padding: 28, paddingTop: 60 },
  header: { marginBottom: 32, gap: 6 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.subtext },
  form: { gap: 14 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, color: Colors.subtext, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    height: 52, borderRadius: 12,
    backgroundColor: Colors.input, paddingHorizontal: 16,
    color: Colors.text, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  btn: {
    height: 52, borderRadius: 12, marginTop: 8,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: Colors.subtext, fontSize: 14 },
  linkText: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
});
