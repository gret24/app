import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

// ─── Player Home ─────────────────────────────────────────────────────────────
function PlayerHome({ firstName }: { firstName: string }) {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcome}>Hey, {firstName} 🏒</Text>
          <Text style={styles.subtitle}>Track your performance & skill growth</Text>
        </View>
      </View>

      {/* Game IQ card */}
      <View style={[styles.card, { borderColor: '#00D4FF55' }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>GAME IQ</Text>
          <Text style={[styles.cardValue, { color: '#00D4FF' }]}>72</Text>
        </View>
        <Text style={styles.cardDesc}>Advanced — Top 28% of players</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '72%', backgroundColor: '#00D4FF' }]} />
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/stats')}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickLabel}>My Stats</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/learn')}>
          <Text style={styles.quickIcon}>📚</Text>
          <Text style={styles.quickLabel}>Continue Learning</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/lessons')}>
          <Text style={styles.quickIcon}>🎬</Text>
          <Text style={styles.quickLabel}>Video Lessons</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(player)')}>
          <Text style={styles.quickIcon}>🎯</Text>
          <Text style={styles.quickLabel}>Analysis</Text>
        </Pressable>
      </View>

      {/* Recent highlight */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Highlight</Text>
        <Text style={styles.cardDesc}>Upload a game to see your highlight reel</Text>
        <Pressable style={[styles.actionBtn, { backgroundColor: '#00D4FF22', borderColor: '#00D4FF55' }]}
          onPress={() => router.push('/(player)')}>
          <Text style={[styles.actionBtnText, { color: '#00D4FF' }]}>Analyze a Game →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Coach Home ───────────────────────────────────────────────────────────────
function CoachHome({ firstName }: { firstName: string }) {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcome}>Coach {firstName} 📋</Text>
          <Text style={styles.subtitle}>Manage your team &amp; build winning tactics</Text>
        </View>
      </View>

      {/* AI recommendations */}
      <View style={[styles.card, { borderColor: '#34C75955' }]}>
        <Text style={styles.cardLabel}>AI RECOMMENDATIONS</Text>
        <Text style={styles.cardTitle}>Improve your neutral zone transition</Text>
        <Text style={styles.cardDesc}>
          Based on last 3 games: 68% of zone entries were rushed. Review Neutral Zone Trap tactics.
        </Text>
        <Pressable style={[styles.actionBtn, { backgroundColor: '#34C75922', borderColor: '#34C75955' }]}
          onPress={() => router.push('/(tabs)/learn')}>
          <Text style={[styles.actionBtnText, { color: '#34C759' }]}>View Tactics →</Text>
        </Pressable>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(team)')}>
          <Text style={styles.quickIcon}>🏟️</Text>
          <Text style={styles.quickLabel}>Team Analysis</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(player)')}>
          <Text style={styles.quickIcon}>🏒</Text>
          <Text style={styles.quickLabel}>Player Stats</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/learn')}>
          <Text style={styles.quickIcon}>🧠</Text>
          <Text style={styles.quickLabel}>Tactics Board</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/analysis')}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickLabel}>Game Analysis</Text>
        </Pressable>
      </View>

      {/* Player summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Player Summary</Text>
        <Text style={styles.cardDesc}>Top performers this week</Text>
        {['#13 — 22 min ice time', '#21 — 3 zone entries', '#7 — Top speed 32 km/h'].map(p => (
          <View key={p} style={styles.playerSummaryRow}>
            <Text style={styles.playerSummaryDot}>•</Text>
            <Text style={styles.playerSummaryText}>{p}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Team Home ────────────────────────────────────────────────────────────────
function TeamHome({ firstName }: { firstName: string }) {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcome}>Team Dashboard 🏟️</Text>
          <Text style={styles.subtitle}>Season overview &amp; team activity</Text>
        </View>
      </View>

      {/* Season stats */}
      <View style={[styles.card, { borderColor: '#AF52DE55' }]}>
        <Text style={styles.cardLabel}>SEASON RECORD</Text>
        <View style={styles.seasonRow}>
          <View style={styles.seasonStat}>
            <Text style={[styles.seasonVal, { color: '#34C759' }]}>8</Text>
            <Text style={styles.seasonLabel}>W</Text>
          </View>
          <View style={styles.seasonStat}>
            <Text style={[styles.seasonVal, { color: '#FF3B30' }]}>4</Text>
            <Text style={styles.seasonLabel}>L</Text>
          </View>
          <View style={styles.seasonStat}>
            <Text style={[styles.seasonVal, { color: '#FFD700' }]}>2</Text>
            <Text style={styles.seasonLabel}>T</Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/team')}>
          <Text style={styles.quickIcon}>👥</Text>
          <Text style={styles.quickLabel}>Manage Team</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(team)')}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickLabel}>Team Analysis</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/learn')}>
          <Text style={styles.quickIcon}>🧠</Text>
          <Text style={styles.quickLabel}>Tactics</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.quickIcon}>⚙️</Text>
          <Text style={styles.quickLabel}>Settings</Text>
        </Pressable>
      </View>

      {/* Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <Text style={styles.cardDesc}>Share analyses and drawings with your team.</Text>
        <Pressable style={[styles.actionBtn, { backgroundColor: '#AF52DE22', borderColor: '#AF52DE55' }]}
          onPress={() => router.push('/(tabs)/team')}>
          <Text style={[styles.actionBtnText, { color: '#AF52DE' }]}>View Team Feed →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Default Home (no role) ───────────────────────────────────────────────────
function DefaultHome({ firstName }: { firstName: string }) {
  const router = useRouter();
  return (
    <View style={styles.defaultContent}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {firstName}</Text>
        <Text style={styles.subtitle}>Select an analysis mode to get started</Text>
      </View>

      <View style={styles.cards}>
        <Pressable
          style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
          onPress={() => router.push('/(player)')}
        >
          <Text style={styles.modeIcon}>🏒</Text>
          <Text style={styles.modeTitle}>Player Analysis</Text>
          <Text style={styles.modeDesc}>Individual player ice time, highlights &amp; shifts</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
          onPress={() => router.push('/(team)')}
        >
          <Text style={styles.modeIcon}>🏟️</Text>
          <Text style={styles.modeTitle}>Team Analysis</Text>
          <Text style={styles.modeDesc}>Full roster stats, line combinations &amp; zone coverage</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, userRole } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? 'Player';

  return (
    <View style={styles.root}>
      {userRole === 'player' && <PlayerHome firstName={firstName} />}
      {userRole === 'coach'  && <CoachHome  firstName={firstName} />}
      {userRole === 'team'   && <TeamHome   firstName={firstName} />}
      {!userRole             && <DefaultHome firstName={firstName} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingTop: 72, paddingBottom: 40, gap: 16 },
  welcomeRow: { marginBottom: 4 },
  welcome: { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.subtext, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.subtext, letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, borderWidth: 1.5, borderColor: Colors.border, gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: Colors.subtext, letterSpacing: 1 },
  cardValue: { fontSize: 32, fontWeight: '800' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 13, color: Colors.subtext, lineHeight: 18 },
  progressBarBg: {
    height: 6, borderRadius: 3,
    backgroundColor: Colors.input, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  quickActions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  quickBtn: {
    width: '47%', backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  actionBtn: {
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  playerSummaryRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  playerSummaryDot: { fontSize: 14, color: Colors.accent },
  playerSummaryText: { fontSize: 13, color: Colors.subtext },
  seasonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  seasonStat: { alignItems: 'center', gap: 2 },
  seasonVal: { fontSize: 40, fontWeight: '800' },
  seasonLabel: { fontSize: 13, color: Colors.subtext, fontWeight: '600' },
  // Default home styles
  defaultContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    justifyContent: 'center',
    gap: 40,
  },
  header: { gap: 8 },
  cards: { gap: 16 },
  modeCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 28,
    borderWidth: 2, borderColor: Colors.accent + '55', gap: 10, width: '100%',
  },
  modeCardPressed: { opacity: 0.75, borderColor: Colors.accent },
  modeIcon: { fontSize: 44 },
  modeTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  modeDesc: { fontSize: 14, color: Colors.subtext, lineHeight: 20 },
});
