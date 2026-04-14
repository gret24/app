/**
 * IceIQ — Scouting Report Screen
 * Kinetic Edge Design System
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert,
} from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Weakness {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface Recommendation {
  priority: number;
  phase: string;
  tactic: string;
  description: string;
  key_players: string[];
}

interface ScoutingReport {
  opponent_name: string;
  generated_at: string;
  opponent_summary: {
    primary_formation: string;
    forecheck_intensity_pct: number;
    breakout_frequency_pct: number;
    transition_rate_pct: number;
    weaknesses: Weakness[];
    weaknesses_count: number;
  };
  strategy: {
    overall_trend?: string;
    matchup_advantage: {
      overall: string;
      exploitable_weaknesses: number;
      our_avg_speed_kmh: number;
      notes: string;
    };
    recommendations: Recommendation[];
  };
  report: {
    generated_by: string;
    ai_analysis?: string;
    summary?: string;
    coaching_notes?: string[];
  };
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REPORT: ScoutingReport = {
  opponent_name: 'Lopez',
  generated_at: new Date().toISOString(),
  opponent_summary: {
    primary_formation: 'UNKNOWN',
    forecheck_intensity_pct: 12,
    breakout_frequency_pct: 35,
    transition_rate_pct: 42,
    weaknesses_count: 2,
    weaknesses: [
      { type: 'passive_forecheck', description: '포체킹이 소극적 — 뉴트럴존에서 빠른 전환 공략 가능', severity: 'high' },
      { type: 'breakout_dependent', description: '브레이크아웃 의존도 높음 — 포체킹으로 턴오버 유도', severity: 'high' },
    ],
  },
  strategy: {
    matchup_advantage: {
      overall: '높음',
      exploitable_weaknesses: 2,
      our_avg_speed_kmh: 6.2,
      notes: '상대 고위험 약점 2개, 중위험 0개 발견',
    },
    recommendations: [
      {
        priority: 1, phase: '공격', tactic: '적극적 포체킹',
        description: '1-2-2 포체킹으로 상대 브레이크아웃을 차단하세요.',
        key_players: ['#28', '#11'],
      },
      {
        priority: 1, phase: '수비', tactic: '브레이크아웃 차단',
        description: '뉴트럴존 트랩으로 턴오버를 유도하세요.',
        key_players: ['#47', '#36'],
      },
    ],
  },
  report: {
    generated_by: 'claude-haiku-4-5',
    ai_analysis: `Lopez는 수비적으로 소극적인 팀입니다. 포체킹 강도 12%로 매우 낮아 뉴트럴존에서의 빠른 전환 기회가 풍부하며, 브레이크아웃 의존도(35%)가 높아 우리의 체계적인 압박으로 턴오버 유도가 가능합니다.

[공격] 1-2-2 포체킹 시스템: #28, #11을 전방 배치, 상대 브레이크아웃 원천 차단
[수비] 뉴트럴존 트랩: NZ 진입 시 2-3명 즉각 응축, 턴오버 유도
[포지션] 슬롯 점유 유지: #61, #25 slot_presence 활용, 상대 DZ 체류 제약

주의: 포체킹 과몰입 시 배후 공간 노출 위험 → 항상 2명 커버 유지`,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}<Text style={styles.statUnit}>{unit}</Text></Text>
    </View>
  );
}

function WeaknessRow({ w }: { w: Weakness }) {
  const isHigh = w.severity === 'high';
  return (
    <View style={styles.weaknessRow}>
      <View style={[styles.severityDot, { backgroundColor: isHigh ? Colors.error : Colors.warning }]} />
      <Text style={styles.weaknessText}>{w.description}</Text>
    </View>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <View style={styles.recCard}>
      <View style={styles.recHeader}>
        <View style={styles.recPhaseChip}>
          <Text style={styles.recPhaseText}>{rec.phase}</Text>
        </View>
        <Text style={styles.recTactic}>{rec.tactic}</Text>
      </View>
      <Text style={styles.recDesc}>{rec.description}</Text>
      {rec.key_players.length > 0 && (
        <View style={styles.recPlayers}>
          {rec.key_players.map((p, i) => (
            <View key={i} style={styles.playerChip}>
              <Text style={styles.playerChipText}>{p}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScoutingScreen() {
  const [report, setReport] = useState<ScoutingReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 API — fetch('/api/scouting?opponent=Lopez')
    setTimeout(() => {
      setReport(MOCK_REPORT);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadingText}>스카우팅 리포트 생성 중...</Text>
      </View>
    );
  }
  if (!report) return null;

  const adv = report.strategy.matchup_advantage;
  const advColor = adv.overall === '높음' ? Colors.success : adv.overall === '보통' ? Colors.warning : Colors.error;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerMeta}>SCOUTING REPORT</Text>
        <Text style={styles.headerTitle}>vs. {report.opponent_name}</Text>
        <Text style={styles.headerDate}>{new Date(report.generated_at).toLocaleDateString('ko-KR')}</Text>
      </View>

      {/* ── Matchup Advantage Card ── */}
      <LinearGradient
        colors={['rgba(0,212,255,0.18)', 'rgba(0,212,255,0.04)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.advantageCard}
      >
        <View>
          <Text style={styles.advantageLabel}>MATCHUP ADVANTAGE</Text>
          <Text style={[styles.advantageValue, { color: advColor }]}>{adv.overall}</Text>
          <Text style={styles.advantageNote}>{adv.notes}</Text>
        </View>
        <View style={styles.advantageRight}>
          <Text style={styles.advantageSpeedLabel}>우리 팀 평균</Text>
          <Text style={styles.advantageSpeed}>{adv.our_avg_speed_kmh}</Text>
          <Text style={styles.advantageSpeedUnit}>km/h</Text>
        </View>
      </LinearGradient>

      {/* ── Opponent Stats ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>상대팀 분석</Text>
        <View style={styles.statRow}>
          <StatPill label="포체킹" value={report.opponent_summary.forecheck_intensity_pct} unit="%" />
          <StatPill label="브레이크아웃" value={report.opponent_summary.breakout_frequency_pct} unit="%" />
          <StatPill label="전환률" value={report.opponent_summary.transition_rate_pct} unit="%" />
        </View>
        <View style={styles.formationRow}>
          <Text style={styles.formationLabel}>주 포메이션</Text>
          <Text style={styles.formationValue}>{report.opponent_summary.primary_formation}</Text>
        </View>
      </View>

      {/* ── Weaknesses ── */}
      {report.opponent_summary.weaknesses.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>약점 {report.opponent_summary.weaknesses_count}개</Text>
          {report.opponent_summary.weaknesses.map((w, i) => (
            <WeaknessRow key={i} w={w} />
          ))}
        </View>
      )}

      {/* ── Recommendations ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>전략 권고</Text>
        {report.strategy.recommendations.map((rec, i) => (
          <RecommendationCard key={i} rec={rec} />
        ))}
      </View>

      {/* ── AI Analysis ── */}
      {report.report.ai_analysis && (
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiDot} />
            <Text style={styles.aiLabel}>AI 코칭 분석 · {report.report.generated_by}</Text>
          </View>
          <Text style={styles.aiText}>{report.report.ai_analysis}</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: 24 },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: Colors.subtext, fontFamily: Fonts.body, fontSize: 14 },

  header: { marginBottom: Spacing.xl },
  headerMeta: { fontFamily: Fonts.body, fontSize: 10, letterSpacing: 3, color: Colors.outline, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 28, color: Colors.text, marginBottom: 2 },
  headerDate: { fontFamily: Fonts.body, fontSize: 12, color: Colors.outline },

  advantageCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advantageLabel: { fontFamily: Fonts.body, fontSize: 9, letterSpacing: 2.5, color: Colors.accentLight, textTransform: 'uppercase', marginBottom: 4 },
  advantageValue: { fontFamily: Fonts.headlineBold, fontSize: 32, marginBottom: 4 },
  advantageNote: { fontFamily: Fonts.body, fontSize: 11, color: Colors.subtext, maxWidth: 180 },
  advantageRight: { alignItems: 'center' },
  advantageSpeedLabel: { fontFamily: Fonts.body, fontSize: 9, color: Colors.outline, letterSpacing: 1, textTransform: 'uppercase' },
  advantageSpeed: { fontFamily: Fonts.headlineBold, fontSize: 28, color: Colors.accent },
  advantageSpeedUnit: { fontFamily: Fonts.body, fontSize: 10, color: Colors.accentLight },

  sectionCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Fonts.headlineBold, fontSize: 13, color: Colors.text, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: Spacing.md },

  statRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statPill: { flex: 1, backgroundColor: Colors.surfaceLow, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  statLabel: { fontFamily: Fonts.body, fontSize: 9, color: Colors.outline, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontFamily: Fonts.headlineBold, fontSize: 18, color: Colors.text },
  statUnit: { fontFamily: Fonts.body, fontSize: 10, color: Colors.accentLight },

  formationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formationLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.outline },
  formationValue: { fontFamily: Fonts.headlineBold, fontSize: 14, color: Colors.accentDim, letterSpacing: 1 },

  weaknessRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  severityDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  weaknessText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.subtext, flex: 1, lineHeight: 20 },

  recCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  recPhaseChip: { backgroundColor: Colors.secondaryContainer, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  recPhaseText: { fontFamily: Fonts.body, fontSize: 9, color: Colors.secondary, letterSpacing: 1, textTransform: 'uppercase' },
  recTactic: { fontFamily: Fonts.headlineBold, fontSize: 13, color: Colors.text },
  recDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.subtext, lineHeight: 18, marginBottom: Spacing.sm },
  recPlayers: { flexDirection: 'row', gap: 6 },
  playerChip: { backgroundColor: Colors.cardHighest, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  playerChipText: { fontFamily: Fonts.headlineBold, fontSize: 11, color: Colors.accentDim },

  aiCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  aiLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.accentLight, letterSpacing: 1.5, textTransform: 'uppercase' },
  aiText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.subtext, lineHeight: 22 },
});
