import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user?.displayName || 'Player'} 🏒</Text>
      <Text style={styles.sub}>IceIQ Analysis Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <Text style={styles.cardText}>Video analysis, highlights, and player stats</Text>
      </View>
      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: 28, paddingTop: 80, gap: 16 },
  welcome: { fontSize: 26, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 15, color: Colors.subtext },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: Colors.border, marginTop: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.accent, marginBottom: 6 },
  cardText: { fontSize: 14, color: Colors.subtext },
  signOutBtn: {
    marginTop: 'auto', height: 48, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  signOutText: { color: Colors.subtext, fontSize: 15 },
});
