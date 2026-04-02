import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const firstName = user?.displayName?.split(' ')[0] ?? 'Player';

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome, {firstName}</Text>
          <Text style={styles.subtitle}>Select an analysis mode to get started</Text>
        </View>

        {/* Mode Cards */}
        <View style={styles.cards}>
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push('/(player)')}
          >
            <Text style={styles.cardIcon}>🏒</Text>
            <Text style={styles.cardTitle}>Player Analysis</Text>
            <Text style={styles.cardDesc}>
              Individual player ice time, highlights &amp; shifts
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push('/(team)')}
          >
            <Text style={styles.cardIcon}>🏟️</Text>
            <Text style={styles.cardTitle}>Team Analysis</Text>
            <Text style={styles.cardDesc}>
              Full roster stats, line combinations &amp; zone coverage
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    justifyContent: 'center',
    gap: 40,
  },
  header: {
    gap: 8,
  },
  welcome: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.subtext,
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    borderWidth: 2,
    borderColor: Colors.accent + '55',
    gap: 10,
    width: '100%',
  },
  cardPressed: {
    opacity: 0.75,
    borderColor: Colors.accent,
  },
  cardIcon: {
    fontSize: 44,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.subtext,
    lineHeight: 20,
  },
});
