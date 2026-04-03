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
      <Text style={styles.sectionTitle}>빠른 메뉴</Text>
      <View style={styles.quickActions}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/stats')}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickLabel}>내 스탯</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/learn')}>
          <Text style={styles.quickIcon}>📚</Text>
          <Text style={styles.quickLabel}>학습 계속하기</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/lessons')}>
          <Text style={styles.quickIcon}>🎬</Text>
          <Text style={styles.quickLabel}>영상 레슨</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(player)')}>
          <Text style={styles.quickIcon}>🎯</Text>
          <Text style={styles.quickLabel}>분석</Text>
        </Pressable>
      </View>

      {/* Recent highlight */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>최근 하이라이트</Text>
        <Text style={styles.cardDesc}>경기 영상을 업로드하면 하이라이트를 볼 수 있어요</Text>
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
          <Text style={styles.welcome}>코치 {firstName} 📋</Text>
          <Text style={styles.subtitle}>팀을 관리하고 전술을 세워보세요</Text>
        </View>
      </View>

      {/* AI recommendations */}
      <View style={[styles.card, { borderColor: '#34C75955' }]}>
        <Text style={styles.cardLabel}>AI 추천</Text>
        <Text style={styles.cardTitle}>뉴트럴존 전환을 개선하세요</Text>
        <Text style={styles.cardDesc}>
          최근 3경기 분석: 68%의 존 진입이 급했습니다. 뉴트럴존 트랩 전술을 복습하세요.
        </Text>
        <Pressable style={[styles.actionBtn, { backgroundColor: '#34C75922', borderColor: '#34C75955' }]}
          onPress={() => router.push('/(tabs)/learn')}>
          <Text style={[styles.actionBtnText, { color: '#34C759' }]}>전술 보기 →</Text>
        </Pressable>
      </View>

      {/* Upload Game - 코치 핵심 기능 */}
      <Pressable style={[styles.uploadBtn, { borderColor: '#34C759' }]}
        onPress={() => router.push('/(tabs)/analysis')}>
        <Text style={styles.uploadBtnIcon}>📹</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.uploadBtnTitle, { color: '#34C759' }]}>경기 영상 업로드</Text>
          <Text style={styles.uploadBtnSub}>YouTube URL 또는 갤러리에서 영상 선택</Text>
        </View>
        <Text style={{ color: '#34C759', fontSize: 18 }}>→</Text>
      </Pressable>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>빠른 메뉴</Text>
      <View style={styles.quickActions}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(team)')}>
          <Text style={styles.quickIcon}>🏟️</Text>
          <Text style={styles.quickLabel}>팀 분석</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(player)')}>
          <Text style={styles.quickIcon}>🏒</Text>
          <Text style={styles.quickLabel}>선수 스탯</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/learn')}>
          <Text style={styles.quickIcon}>🧠</Text>
          <Text style={styles.quickLabel}>전술 보드</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/analysis')}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickLabel}>경기 분석</Text>
        </Pressable>
      </View>

      {/* Player summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>선수 요약</Text>
        <Text style={styles.cardDesc}>이번 주 활약 선수</Text>
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
          <Text style={styles.welcome}>팀 대시보드 🏟️</Text>
          <Text style={styles.subtitle}>시즌 개요 및 팀 활동</Text>
        </View>
      </View>

      {/* Season stats */}
      <View style={[styles.card, { borderColor: '#AF52DE55' }]}>
        <Text style={styles.cardLabel}>시즌 전적</Text>
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

      {/* Upload Game - 팀 업로드 */}
      <Pressable style={[styles.uploadBtn, { borderColor: '#AF52DE' }]}
        onPress={() => router.push('/(tabs)/analysis')}>
        <Text style={styles.uploadBtnIcon}>📹</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.uploadBtnTitle, { color: '#AF52DE' }]}>경기 영상 업로드</Text>
          <Text style={styles.uploadBtnSub}>YouTube URL 또는 갤러리에서 영상 선택</Text>
        </View>
        <Text style={{ color: '#AF52DE', fontSize: 18 }}>→</Text>
      </Pressable>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>빠른 메뉴</Text>
      <View style={styles.quickActions}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/team')}>
          <Text style={styles.quickIcon}>👥</Text>
          <Text style={styles.quickLabel}>팀 관리</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(team)')}>
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickLabel}>팀 분석</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/learn')}>
          <Text style={styles.quickIcon}>🧠</Text>
          <Text style={styles.quickLabel}>전술</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.quickIcon}>⚙️</Text>
          <Text style={styles.quickLabel}>설정</Text>
        </Pressable>
      </View>

      {/* Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>최근 활동</Text>
        <Text style={styles.cardDesc}>분석 및 드로잉을 팀과 공유하세요.</Text>
        <Pressable style={[styles.actionBtn, { backgroundColor: '#AF52DE22', borderColor: '#AF52DE55' }]}
          onPress={() => router.push('/(tabs)/team')}>
          <Text style={[styles.actionBtnText, { color: '#AF52DE' }]}>팀 피드 보기 →</Text>
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
        <Text style={styles.welcome}>환영합니다, {firstName}</Text>
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
  uploadBtn: {
    backgroundColor: '#1A1A2E', borderRadius: 14, borderWidth: 1,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  uploadBtnIcon: { fontSize: 28 },
  uploadBtnTitle: { fontSize: 15, fontWeight: '700' },
  uploadBtnSub: { fontSize: 12, color: '#888', marginTop: 2 },
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
