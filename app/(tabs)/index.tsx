import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, Radius, Fonts } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

// ─── IQ Score Ring ────────────────────────────────────────────────────────────
function IQRing({ score }: { score: number }) {
  const SIZE = 160;
  const R = 68;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - score / 100);
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* SVG-like ring via View circles */}
      <View style={iqStyles.ringBg} />
      <View style={[iqStyles.ringFill, {
        borderColor: Colors.accent,
        // simulate arc via border trick — simplified visual
        opacity: score / 100,
      }]} />
      <View style={iqStyles.center}>
        <Text style={iqStyles.scoreNum}>{score}</Text>
        <Text style={iqStyles.scoreLabel}>IQ SCORE</Text>
      </View>
      {/* Glow */}
      <View style={iqStyles.glow} />
    </View>
  );
}

const iqStyles = StyleSheet.create({
  ringBg: { position: 'absolute', width: 144, height: 144, borderRadius: 72, borderWidth: 2, borderColor: Colors.cardHighest },
  ringFill: { position: 'absolute', width: 144, height: 144, borderRadius: 72, borderWidth: 6 },
  center: { position: 'absolute', alignItems: 'center' },
  scoreNum: { fontFamily: Fonts.headlineBold, fontSize: 52, color: Colors.text },
  scoreLabel: { fontFamily: Fonts.headline, fontSize: 9, letterSpacing: 3, color: Colors.accentLight, textTransform: 'uppercase' },
  glow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.accentGlow },
});

// ─── Player Home — Kinetic Edge ───────────────────────────────────────────────
function PlayerHome({ firstName }: { firstName: string }) {
  const router = useRouter();

  const quickActions = [
    { icon: '📊', label: '데이터 분석', route: '/(tabs)/stats' as const },
    { icon: '🗺️', label: '히트맵', route: '/(player)' as const },
    { icon: '🎬', label: '경기 분석', route: '/(tabs)/analysis' as const },
    { icon: '📈', label: '성장 지표', route: '/(tabs)/growth' as const },
  ];

  return (
    <ScrollView style={homeStyles.root} contentContainerStyle={homeStyles.content} showsVerticalScrollIndicator={false}>

      {/* ── Game IQ Card ── */}
      <View style={homeStyles.iqCard}>
        {/* Left */}
        <View style={homeStyles.iqLeft}>
          <Text style={homeStyles.iqMeta}>INTELLIGENCE METRIC</Text>
          <Text style={homeStyles.iqTitle}>Game IQ Score</Text>
          <View style={homeStyles.iqBadge}>
            <Text style={homeStyles.iqBadgeText}>📈 +4.2% SINCE LAST GAME</Text>
          </View>
        </View>
        {/* Right: ring */}
        <IQRing score={88} />
        {/* Ambient glow */}
        <View style={homeStyles.iqGlow} />
        {/* Left accent border */}
        <View style={homeStyles.iqAccentBar} />
      </View>

      {/* ── Quick Actions ── */}
      <View style={homeStyles.quickGrid}>
        {quickActions.map((a) => (
          <Pressable key={a.label} style={homeStyles.quickCard}
            onPress={() => router.push(a.route)}
            android_ripple={{ color: Colors.accentGlow }}>
            <View style={homeStyles.quickIconBox}>
              <Text style={{ fontSize: 22 }}>{a.icon}</Text>
            </View>
            <Text style={homeStyles.quickLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Upcoming Match ── */}
      <LinearGradient
        colors={['rgba(0,212,255,0.08)', 'rgba(0,212,255,0.02)']}
        style={homeStyles.matchCard}
      >
        <Text style={homeStyles.matchMeta}>NEXT MATCH</Text>
        <View style={homeStyles.matchRow}>
          <View style={homeStyles.matchTeam}>
            <View style={homeStyles.teamBadge}><Text style={{ fontSize: 24 }}>🛡️</Text></View>
            <Text style={homeStyles.teamName}>G. KINETIC</Text>
          </View>
          <View style={homeStyles.matchCenter}>
            <Text style={homeStyles.vsText}>VS</Text>
            <Text style={homeStyles.matchDate}>SEP 24 · 19:30</Text>
          </View>
          <View style={homeStyles.matchTeam}>
            <View style={[homeStyles.teamBadge, { borderColor: Colors.error + '44' }]}>
              <Text style={{ fontSize: 24 }}>❄️</Text>
            </View>
            <Text style={homeStyles.teamName}>TITANS FC</Text>
          </View>
        </View>
        <Pressable style={homeStyles.strategyBtn} onPress={() => router.push('/(tabs)/scouting')}>
          <Text style={homeStyles.strategyBtnText}>STRATEGY BRIEF →</Text>
        </Pressable>
      </LinearGradient>

      {/* ── Recent Highlight ── */}
      <View style={homeStyles.highlightCard}>
        <View style={homeStyles.highlightInner}>
          <LinearGradient
            colors={['#0E0E13', '#1B1B20']}
            style={homeStyles.highlightBg}
          >
            <View style={homeStyles.liveChip}>
              <View style={homeStyles.liveDot} />
              <Text style={homeStyles.liveText}>LIVE TRACKING ENABLED</Text>
            </View>
          </LinearGradient>
          <View style={homeStyles.highlightOverlay}>
            <View style={homeStyles.highlightBottom}>
              <View>
                <View style={homeStyles.newBadge}><Text style={homeStyles.newBadgeText}>NEW RELEASE</Text></View>
                <Text style={homeStyles.highlightTitle}>최근 하이라이트</Text>
                <Text style={homeStyles.highlightSub}>Game Week 14: Precision passing analysis</Text>
              </View>
              <Pressable style={homeStyles.playBtn} onPress={() => router.push('/(player)')}>
                <Text style={{ color: Colors.accent, fontSize: 28 }}>▶</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const homeStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 72, paddingBottom: 24, gap: Spacing.lg },

  // IQ Card
  iqCard: {
    backgroundColor: 'rgba(53,52,58,0.4)',
    borderRadius: Radius.lg, padding: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: 'rgba(168,232,255,0.1)',
    overflow: 'hidden', position: 'relative', minHeight: 200,
    borderLeftWidth: 4, borderLeftColor: Colors.accent,
  },
  iqLeft: { flex: 1, gap: 6 },
  iqMeta: { fontFamily: Fonts.headline, fontSize: 9, letterSpacing: 3, color: Colors.accentLight + '99', textTransform: 'uppercase' },
  iqTitle: { fontFamily: Fonts.headlineBold, fontSize: 20, color: Colors.text },
  iqBadge: { backgroundColor: Colors.accentGlow, borderRadius: Radius.md, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 4 },
  iqBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentLight, letterSpacing: 0.5 },
  iqGlow: { position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.accentGlow },
  iqAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: Colors.accent, borderRadius: Radius.sm },

  // Quick grid
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickCard: {
    width: '47.5%', backgroundColor: 'rgba(53,52,58,0.4)',
    borderRadius: Radius.lg, padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: 'rgba(168,232,255,0.1)',
    gap: Spacing.lg, minHeight: 110, justifyContent: 'space-between',
  },
  quickIconBox: { backgroundColor: Colors.cardHighest, width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.text },

  // Match card
  matchCard: { borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.lg },
  matchMeta: { fontFamily: Fonts.headline, fontSize: 9, letterSpacing: 3, color: Colors.accentLight + '99', textTransform: 'uppercase' },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeam: { alignItems: 'center', gap: 6 },
  teamBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.accentLight + '33', alignItems: 'center', justifyContent: 'center' },
  teamName: { fontFamily: Fonts.headline, fontSize: 9, letterSpacing: 2, color: Colors.accentLight + '66', textTransform: 'uppercase' },
  matchCenter: { alignItems: 'center', gap: 4 },
  vsText: { fontFamily: Fonts.headlineBold, fontSize: 20, color: Colors.cardHighest },
  matchDate: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accent, backgroundColor: Colors.accentGlow, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.xl },
  strategyBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  strategyBtnText: { fontFamily: Fonts.headlineBold, fontSize: 12, color: '#003642', letterSpacing: 2.5 },

  // Highlight
  highlightCard: { borderRadius: Radius.lg, overflow: 'hidden', height: 200 },
  highlightInner: { flex: 1 },
  highlightBg: { position: 'absolute', inset: 0, width: '100%', height: '100%' } as any,
  liveChip: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(53,52,58,0.4)', borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 5, borderTopWidth: 1, borderTopColor: 'rgba(168,232,255,0.1)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  liveText: { fontFamily: Fonts.headline, fontSize: 8, letterSpacing: 2, color: Colors.text, textTransform: 'uppercase' },
  highlightOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.xl, backgroundColor: 'rgba(19,19,24,0.6)' },
  highlightBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  newBadge: { backgroundColor: Colors.accent, borderRadius: Radius.xl, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  newBadgeText: { fontFamily: Fonts.headline, fontSize: 8, color: '#003642', letterSpacing: 2, fontWeight: '700' },
  highlightTitle: { fontFamily: Fonts.headlineBold, fontSize: 20, color: Colors.text },
  highlightSub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.subtext },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,212,255,0.2)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.5)', alignItems: 'center', justifyContent: 'center' },
});

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
