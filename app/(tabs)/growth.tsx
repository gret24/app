/**
 * IceIQ — Player Growth Dashboard
 * Kinetic Edge Design System v2
 * Based on "성장 대시보드" design reference
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Dimensions, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface StrengthItem {
  label: string;
  change: number; // positive = strength
}

interface TrainingRec {
  icon: string;
  title: string;
  detail: string;
}

interface GameGoal {
  label: string;
  done: boolean;
}

interface GrowthData {
  playerName: string;
  jersey: string;
  stage: string;
  gamesAnalyzed: number;
  // Trend metrics
  speed_kmh: number;
  distance_km: number;
  stamina_pct: number;
  // Growth items
  strengths: StrengthItem[];
  weaknesses: StrengthItem[];
  // AI recs
  trainingRecs: TrainingRec[];
  // Goals
  goals: GameGoal[];
  // AI feedback
  aiFeedback: string;
  feedbackModel: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK: GrowthData = {
  playerName: 'Park, Jae-Ho',
  jersey: '47',
  stage: 'ELITE STAGE',
  gamesAnalyzed: 5,
  speed_kmh: 9.4,
  distance_km: 0.182,
  stamina_pct: 88,
  strengths: [
    { label: '공격존 체류', change: 35.7 },
    { label: '스프린트 횟수', change: 165 },
  ],
  weaknesses: [
    { label: '최고속도', change: -48 },
    { label: '하이슬롯 점유', change: -100 },
  ],
  trainingRecs: [
    {
      icon: '🏃',
      title: '고강도 인터벌 트레이닝 (HIIT)',
      detail: '최근 경기 분석 결과 3피리어드 후반 스테미나가 급격히 저하됩니다. 주 3회 20분 고강도 인터벌 러닝으로 심폐 지구력을 보강하세요.',
    },
    {
      icon: '🦵',
      title: '하체 근력 강화',
      detail: '폭발적 가속력을 위해 쿼드러셉스·햄스트링 강화가 필요합니다. 불가리안 스플릿 스쿼트 4세트를 권장합니다.',
    },
    {
      icon: '🎯',
      title: '하이슬롯 포지셔닝',
      detail: 'OZ 진입 후 즉각적인 슈팅 포지션 이동 드릴을 추가하세요. 슬롯 점유 0%는 득점 기회 부재를 의미합니다.',
    },
  ],
  goals: [
    { label: '어시스트 1개 이상', done: false },
    { label: '유효 슈팅 3회', done: false },
    { label: '블로킹 성공 2회', done: false },
    { label: '페널티 0분', done: false },
  ],
  aiFeedback: `좋은 신호들이 보인다. 공격존 체류율이 7.6%에서 43.3%로 급증했고, 스프린트 횟수도 49회에서 130회로 늘었다. 다만 최고속도 18.7km/h 하락은 심각하다. 강도 높은 플레이를 유지하면서 순간 폭발력을 되찾아야 한다.

다음 경기 집중 목표: 스프린트 강도를 유지하면서 하이슬롯 점유 시간을 늘려라.`,
  feedbackModel: 'claude-haiku-4-5',
};

// ─── Area Shard Card ──────────────────────────────────────────────────────────

function TrendCard({
  label, value, unit, icon,
  shapePoints,
}: {
  label: string; value: number; unit: string; icon: string;
  shapePoints?: string;
}) {
  // Area shard as a simple bar graph visual
  const bars = [0.4, 0.6, 0.5, 0.75, 1.0];
  return (
    <View style={trendStyles.card}>
      <View style={trendStyles.top}>
        <View>
          <Text style={trendStyles.label}>{label}</Text>
          <Text style={trendStyles.value}>
            {value}
            <Text style={trendStyles.unit}> {unit}</Text>
          </Text>
        </View>
        <Text style={trendStyles.icon}>{icon}</Text>
      </View>
      {/* Area shard bars */}
      <View style={trendStyles.shardRow}>
        {bars.map((h, i) => (
          <LinearGradient
            key={i}
            colors={i === bars.length - 1
              ? [Colors.accent, 'rgba(0,212,255,0.1)']
              : ['rgba(0,212,255,0.5)', 'rgba(0,212,255,0.05)']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={[trendStyles.shard, { height: `${h * 100}%` as any }]}
          />
        ))}
      </View>
    </View>
  );
}

const trendStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: (SCREEN_W - Spacing.lg * 2 - Spacing.md * 2) / 3,
    backgroundColor: 'rgba(53,52,58,0.4)',
    borderRadius: Radius.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(168,232,255,0.1)',
    padding: Spacing.md,
    height: 160,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label: { fontFamily: Fonts.body, fontSize: 9, color: Colors.outline, marginBottom: 3 },
  value: { fontFamily: Fonts.headlineBold, fontSize: 22, color: Colors.text },
  unit: { fontFamily: Fonts.body, fontSize: 11, color: Colors.outline },
  icon: { fontSize: 20 },
  shardRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 48 },
  shard: { flex: 1, borderRadius: Radius.sm },
});

// ─── Strength Row ─────────────────────────────────────────────────────────────

function StrengthRow({ item, positive }: { item: StrengthItem; positive: boolean }) {
  const color = positive ? Colors.success : Colors.error;
  const icon = positive ? '✓' : '!';
  return (
    <View style={strStyles.row}>
      <View style={[strStyles.iconBox, { backgroundColor: color + '22' }]}>
        <Text style={[strStyles.icon, { color }]}>{icon}</Text>
      </View>
      <Text style={strStyles.label}>{item.label}</Text>
      <Text style={[strStyles.change, { color }]}>
        {item.change > 0 ? '+' : ''}{item.change.toFixed(0)}%
      </Text>
    </View>
  );
}

const strStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 10, paddingHorizontal: Spacing.md, backgroundColor: Colors.cardHighest + '55', borderRadius: Radius.md, marginBottom: Spacing.sm },
  iconBox: { width: 28, height: 28, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  icon: { fontFamily: Fonts.bodyBold, fontSize: 13 },
  label: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text, flex: 1 },
  change: { fontFamily: Fonts.headlineBold, fontSize: 13 },
});

// ─── Training Rec ─────────────────────────────────────────────────────────────

function TrainingRecCard({ rec }: { rec: TrainingRec }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      style={recStyles.card}
      onPress={() => setOpen(o => !o)}
      android_ripple={{ color: Colors.accentGlow }}
    >
      <View style={recStyles.header}>
        <View style={recStyles.iconBox}>
          <Text style={recStyles.icon}>{rec.icon}</Text>
        </View>
        <Text style={recStyles.title}>{rec.title}</Text>
        <Text style={recStyles.chevron}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && <Text style={recStyles.detail}>{rec.detail}</Text>}
    </Pressable>
  );
}

const recStyles = StyleSheet.create({
  card: { backgroundColor: Colors.cardHigh, borderRadius: Radius.lg, marginBottom: Spacing.sm, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  iconBox: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.accentGlow, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  title: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.text, flex: 1 },
  chevron: { color: Colors.outline, fontSize: 10 },
  detail: { fontFamily: Fonts.body, fontSize: 12, color: Colors.subtext, lineHeight: 20, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
});

// ─── Goal Checkbox ────────────────────────────────────────────────────────────

function GoalItem({ goal, onToggle }: { goal: GameGoal; onToggle: () => void }) {
  return (
    <Pressable style={goalStyles.item} onPress={onToggle}>
      <View style={[goalStyles.box, goal.done && { backgroundColor: Colors.accent, borderColor: Colors.accent }]}>
        {goal.done && <Text style={goalStyles.check}>✓</Text>}
      </View>
      <Text style={[goalStyles.label, goal.done && { color: Colors.accentDim, textDecorationLine: 'line-through' }]}>
        {goal.label}
      </Text>
    </Pressable>
  );
}

const goalStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.card + '88', borderRadius: Radius.md, borderWidth: 1, borderColor: 'transparent' },
  box: { width: 20, height: 20, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  check: { color: '#003642', fontSize: 11, fontFamily: Fonts.bodyBold },
  label: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text, flex: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GrowthScreen() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<GameGoal[]>([]);

  useEffect(() => {
    // TODO: 실제 API — fetch('/api/growth?jersey=47')
    setTimeout(() => {
      setData(MOCK);
      setGoals(MOCK.goals.map(g => ({ ...g })));
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
  if (!data) return null;

  const toggleGoal = (i: number) => {
    setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, done: !g.done } : g));
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Hero / Player HUD ── */}
      <LinearGradient
        colors={['#0E0E13', '#1B1B20']}
        style={styles.heroCard}
      >
        <View style={styles.heroGlow} />
        <Text style={styles.heroMeta}>PLAYER PERFORMANCE HUD</Text>
        <Text style={styles.heroStage}>{data.stage}</Text>
        <View style={styles.heroPulseRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.heroPulseText}>최근 {data.gamesAnalyzed}경기 데이터 분석 완료</Text>
        </View>
      </LinearGradient>

      {/* ── Performance Trends ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Performance Trends</Text>
        <Text style={styles.sectionMeta}>LAST {data.gamesAnalyzed} GAMES</Text>
      </View>
      <View style={styles.trendRow}>
        <TrendCard label="속도 (Speed)" value={data.speed_kmh} unit="km/h" icon="⚡" />
        <TrendCard label="거리 (Distance)" value={data.distance_km} unit="km" icon="📏" />
        <TrendCard label="스테미나" value={data.stamina_pct} unit="%" icon="🔋" />
      </View>

      {/* ── Strengths & Weaknesses ── */}
      <View style={styles.swGrid}>
        <View style={styles.swCol}>
          <Text style={styles.swTitle}>강점</Text>
          <View style={styles.swCard}>
            {data.strengths.map((s, i) => <StrengthRow key={i} item={s} positive={true} />)}
          </View>
        </View>
        <View style={styles.swCol}>
          <Text style={styles.swTitle}>보완점</Text>
          <View style={styles.swCard}>
            {data.weaknesses.map((w, i) => <StrengthRow key={i} item={w} positive={false} />)}
          </View>
        </View>
      </View>

      {/* ── AI Training Recs ── */}
      <Text style={[styles.sectionTitle, { marginBottom: Spacing.md }]}>AI 훈련 추천</Text>
      {data.trainingRecs.map((rec, i) => <TrainingRecCard key={i} rec={rec} />)}

      {/* ── Next Game Goals ── */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl, marginBottom: Spacing.md }]}>다음 경기 목표</Text>
      <LinearGradient
        colors={[Colors.surfaceLow, Colors.surfaceLowest]}
        style={styles.goalsCard}
      >
        <View style={styles.goalsGrid}>
          {goals.map((g, i) => (
            <GoalItem key={i} goal={g} onToggle={() => toggleGoal(i)} />
          ))}
        </View>
        <LinearGradient
          colors={[Colors.shimmerStart, Colors.shimmerEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          <Pressable style={styles.ctaInner} android_ripple={{ color: 'rgba(0,0,0,0.1)' }}>
            <Text style={styles.ctaText}>목표 달성 전략 보기</Text>
          </Pressable>
        </LinearGradient>
      </LinearGradient>

      {/* ── AI Feedback ── */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <View style={styles.aiDot} />
          <Text style={styles.aiLabel}>AI 피드백 · {data.feedbackModel}</Text>
        </View>
        <Text style={styles.aiText}>{data.aiFeedback}</Text>
      </View>

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

  // Hero
  heroCard: { borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.xl, minHeight: 180, justifyContent: 'flex-end', overflow: 'hidden' },
  heroGlow: { position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.accentGlow },
  heroMeta: { fontFamily: Fonts.headline, fontSize: 10, letterSpacing: 4, color: Colors.accentDim, textTransform: 'uppercase', marginBottom: Spacing.sm },
  heroStage: { fontFamily: Fonts.headlineBold, fontSize: 36, color: Colors.text, marginBottom: Spacing.sm },
  heroPulseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  heroPulseText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.accentLight },

  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Fonts.headlineBold, fontSize: 16, color: Colors.text, letterSpacing: 0.5 },
  sectionMeta: { fontFamily: Fonts.body, fontSize: 9, color: Colors.outline, letterSpacing: 1.5 },

  // Trend row
  trendRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },

  // Strengths / Weaknesses
  swGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  swCol: { flex: 1 },
  swTitle: { fontFamily: Fonts.headlineBold, fontSize: 14, color: Colors.text, marginBottom: Spacing.md },
  swCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: Spacing.md },

  // Goals
  goalsCard: { borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
  goalsGrid: { gap: Spacing.sm, marginBottom: Spacing.lg },

  // CTA
  cta: { borderRadius: Radius.md, overflow: 'hidden' },
  ctaInner: { paddingVertical: 14, alignItems: 'center' },
  ctaText: { fontFamily: Fonts.headlineBold, fontSize: 13, color: '#003642', letterSpacing: 2.5, textTransform: 'uppercase' },

  // AI
  aiCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  aiLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.accentLight, letterSpacing: 1.5, textTransform: 'uppercase' },
  aiText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.subtext, lineHeight: 22 },
});
