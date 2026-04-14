/**
 * IceIQ — Player Growth Dashboard
 * Kinetic Edge Design System
 * Heatmap + Area Shard 성장 그래프 + AI 피드백
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.lg * 2 - Spacing.lg * 2; // card padding

// ─── Types ───────────────────────────────────────────────────────────────────

interface Snapshot {
  game: number;
  label: string;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  sprint_count: number;
  total_km: number;
  stamina_decay_pct: number;
  oz_pct: number;
  high_slot_pct: number;
  ice_time_sec: number;
}

interface MetricDelta {
  metric: string;
  label: string;
  direction: 'higher' | 'lower';
  values: number[];
  change: number;
  change_pct: number;
  improved: boolean;
  trend: string;
}

interface GrowthReport {
  jersey: string;
  games_analyzed: number;
  growth: {
    overall_trend: string;
    improved_count: number;
    total_metrics: number;
    deltas: MetricDelta[];
    snapshots: Snapshot[];
  };
  feedback: {
    generated_by: string;
    ai_feedback?: string;
    summary?: string;
    strengths?: string[];
    concerns?: string[];
    coaching_points?: string[];
  };
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_GROWTH: GrowthReport = {
  jersey: '47',
  games_analyzed: 2,
  growth: {
    overall_trend: '혼조세 🟡',
    improved_count: 4,
    total_metrics: 8,
    snapshots: [
      { game: 1, label: 'vs Lopez G1', avg_speed_kmh: 8.3, max_speed_kmh: 38.8, sprint_count: 49, total_km: 0.058, stamina_decay_pct: -36.6, oz_pct: 7.6, high_slot_pct: 0, ice_time_sec: 120 },
      { game: 2, label: 'vs Lopez G2', avg_speed_kmh: 9.4, max_speed_kmh: 20.1, sprint_count: 130, total_km: 0.182, stamina_decay_pct: -12.2, oz_pct: 43.3, high_slot_pct: 0, ice_time_sec: 180 },
    ],
    deltas: [
      { metric: 'avg_speed_kmh', label: '평균속도', direction: 'higher', values: [8.3, 9.4], change: 1.1, change_pct: 13.3, improved: true, trend: '📈' },
      { metric: 'max_speed_kmh', label: '최고속도', direction: 'higher', values: [38.8, 20.1], change: -18.7, change_pct: -48.2, improved: false, trend: '📉' },
      { metric: 'sprint_count', label: '스프린트', direction: 'higher', values: [49, 130], change: 81, change_pct: 165.3, improved: true, trend: '📈' },
      { metric: 'total_km', label: '이동거리', direction: 'higher', values: [0.058, 0.182], change: 0.124, change_pct: 213.8, improved: true, trend: '📈' },
      { metric: 'oz_pct', label: '공격존 체류', direction: 'higher', values: [7.6, 43.3], change: 35.7, change_pct: 469.7, improved: true, trend: '📈' },
      { metric: 'stamina_decay_pct', label: '체력감소율', direction: 'lower', values: [-36.6, -12.2], change: 24.4, change_pct: 0, improved: false, trend: '📉' },
    ],
  },
  feedback: {
    generated_by: 'claude-haiku-4-5',
    ai_feedback: `좋은 신호들이 보인다. 게임 2에서 공격존 체류율이 7.6%에서 43.3%로 급증했고, 스프린트 횟수도 49회에서 130회로 늘어났으니 적극성과 움직임이 분명히 개선됐다.

✅ 공격 영역 장악력: 공격존 체류율 +35.7%p 상승 — 정확히 원하는 방향이다.
✅ 체력 관리: 체력 감소율이 개선됐다. 같은 강도를 더 오래 유지할 수 있다.

⚠️ 순간 폭발력: 최고속도 18.7km/h 하락 → 풀 스프린트 반복 훈련 3세트
⚠️ 하이슬롯 부재: 양 경기 0% → OZ 진입 후 슈팅 포지션 이동 드릴

다음 경기 목표: 스프린트 강도를 유지하면서 하이슬롯 점유 시간을 늘려라.`,
  },
};

// ─── Area Shard Chart ─────────────────────────────────────────────────────────

function AreaShardChart({ snapshots, metricKey, label }: {
  snapshots: Snapshot[];
  metricKey: keyof Snapshot;
  label: string;
}) {
  const values = snapshots.map(s => Number(s[metricKey]));
  const max = Math.max(...values, 0.001);
  const barW = (CHART_W - (snapshots.length - 1) * 4) / snapshots.length;

  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.label}>{label}</Text>
      <View style={chartStyles.bars}>
        {values.map((v, i) => {
          const heightPct = Math.abs(v) / Math.abs(max);
          const isLast = i === values.length - 1;
          return (
            <View key={i} style={[chartStyles.barWrap, { width: barW }]}>
              <LinearGradient
                colors={isLast
                  ? [Colors.accent, 'rgba(0,212,255,0.15)']
                  : ['rgba(0,212,255,0.5)', 'rgba(0,212,255,0.05)']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={[chartStyles.bar, { height: `${Math.max(heightPct * 100, 8)}%` as any }]}
              />
              <Text style={chartStyles.barLabel}>G{i + 1}</Text>
            </View>
          );
        })}
      </View>
      <Text style={chartStyles.latestVal}>{values[values.length - 1]}</Text>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontFamily: Fonts.body, fontSize: 9, color: Colors.outline, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  bars: { height: 60, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barWrap: { alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: Radius.sm },
  barLabel: { fontFamily: Fonts.body, fontSize: 8, color: Colors.outline, marginTop: 2 },
  latestVal: { fontFamily: Fonts.headlineBold, fontSize: 12, color: Colors.accentDim, marginTop: 2 },
});

// ─── Delta Row ────────────────────────────────────────────────────────────────

function DeltaRow({ delta }: { delta: MetricDelta }) {
  return (
    <View style={styles.deltaRow}>
      <Text style={styles.deltaTrend}>{delta.trend}</Text>
      <Text style={styles.deltaLabel}>{delta.label}</Text>
      <View style={styles.deltaValues}>
        {delta.values.map((v, i) => (
          <React.Fragment key={i}>
            <Text style={[styles.deltaVal, i === delta.values.length - 1 && { color: delta.improved ? Colors.success : Colors.error }]}>
              {typeof v === 'number' ? (Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(1)) : v}
            </Text>
            {i < delta.values.length - 1 && <Text style={styles.deltaArrow}>→</Text>}
          </React.Fragment>
        ))}
      </View>
      <Text style={[styles.deltaPct, { color: delta.improved ? Colors.success : Colors.error }]}>
        {delta.change > 0 ? '+' : ''}{delta.change_pct.toFixed(0)}%
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GrowthScreen() {
  const [report, setReport] = useState<GrowthReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 API — fetch('/api/growth?jersey=47')
    setTimeout(() => {
      setReport(MOCK_GROWTH);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.loadingText}>성장 데이터 분석 중...</Text>
      </View>
    );
  }
  if (!report) return null;

  const { growth, feedback } = report;
  const improvedPct = Math.round((growth.improved_count / growth.total_metrics) * 100);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerMeta}>GROWTH DASHBOARD</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>#{report.jersey}</Text>
          <View style={[styles.trendChip, { backgroundColor: improvedPct >= 70 ? Colors.success + '22' : Colors.warning + '22' }]}>
            <Text style={[styles.trendChipText, { color: improvedPct >= 70 ? Colors.success : Colors.warning }]}>
              {growth.overall_trend}
            </Text>
          </View>
        </View>
        <Text style={styles.headerSub}>{growth.games_analyzed}경기 분석 · 개선 {growth.improved_count}/{growth.total_metrics}항목</Text>
      </View>

      {/* ── Progress Ring ── */}
      <LinearGradient
        colors={['rgba(0,212,255,0.12)', 'rgba(0,212,255,0.03)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.progressCard}
      >
        <View style={styles.progressLeft}>
          <Text style={styles.progressLabel}>IMPROVEMENT RATE</Text>
          <Text style={styles.progressValue}>{improvedPct}<Text style={styles.progressUnit}>%</Text></Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${improvedPct}%` as any }]} />
          </View>
        </View>
        <View style={styles.progressRight}>
          <Text style={styles.gamesLabel}>경기수</Text>
          <Text style={styles.gamesValue}>{growth.games_analyzed}</Text>
        </View>
      </LinearGradient>

      {/* ── Area Shard Charts ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>성장 궤적</Text>
        <AreaShardChart snapshots={growth.snapshots} metricKey="avg_speed_kmh" label="평균속도 (km/h)" />
        <AreaShardChart snapshots={growth.snapshots} metricKey="sprint_count" label="스프린트 횟수" />
        <AreaShardChart snapshots={growth.snapshots} metricKey="oz_pct" label="공격존 체류 (%)" />
      </View>

      {/* ── Delta Table ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>항목별 변화</Text>
        {growth.deltas.map((d, i) => <DeltaRow key={i} delta={d} />)}
      </View>

      {/* ── AI Feedback ── */}
      {feedback.ai_feedback && (
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiDot} />
            <Text style={styles.aiLabel}>AI 코칭 피드백 · {feedback.generated_by}</Text>
          </View>
          <Text style={styles.aiText}>{feedback.ai_feedback}</Text>
        </View>
      )}

      {/* ── Training CTA ── */}
      <LinearGradient
        colors={[Colors.shimmerStart, Colors.shimmerEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.cta}
      >
        <Pressable style={styles.ctaInner} android_ripple={{ color: 'rgba(0,0,0,0.1)' }}>
          <Text style={styles.ctaText}>훈련 추천 확인</Text>
        </Pressable>
      </LinearGradient>

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
  headerMeta: { fontFamily: Fonts.body, fontSize: 10, letterSpacing: 3, color: Colors.outline, textTransform: 'uppercase', marginBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: 4 },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 36, color: Colors.text },
  trendChip: { borderRadius: Radius.xl, paddingHorizontal: 12, paddingVertical: 4 },
  trendChipText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  headerSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.outline },

  progressCard: { borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLeft: { flex: 1 },
  progressLabel: { fontFamily: Fonts.body, fontSize: 9, letterSpacing: 2.5, color: Colors.accentLight, textTransform: 'uppercase', marginBottom: 4 },
  progressValue: { fontFamily: Fonts.headlineBold, fontSize: 40, color: Colors.accent },
  progressUnit: { fontFamily: Fonts.body, fontSize: 16, color: Colors.accentLight },
  progressBar: { height: 3, backgroundColor: Colors.surfaceLow, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  progressRight: { alignItems: 'center', paddingLeft: Spacing.xl },
  gamesLabel: { fontFamily: Fonts.body, fontSize: 9, color: Colors.outline, textTransform: 'uppercase', letterSpacing: 1 },
  gamesValue: { fontFamily: Fonts.headlineBold, fontSize: 28, color: Colors.text },

  sectionCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Fonts.headlineBold, fontSize: 13, color: Colors.text, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: Spacing.md },

  deltaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '30' },
  deltaTrend: { fontSize: 14, marginRight: 6 },
  deltaLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.subtext, flex: 1 },
  deltaValues: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaVal: { fontFamily: Fonts.headlineBold, fontSize: 12, color: Colors.text },
  deltaArrow: { fontSize: 10, color: Colors.outline },
  deltaPct: { fontFamily: Fonts.bodyBold, fontSize: 11, width: 44, textAlign: 'right' },

  aiCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  aiLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.accentLight, letterSpacing: 1.5, textTransform: 'uppercase' },
  aiText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.subtext, lineHeight: 22 },

  cta: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.md },
  ctaInner: { paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: Fonts.headlineBold, fontSize: 14, color: '#003642', letterSpacing: 2, textTransform: 'uppercase' },
});
