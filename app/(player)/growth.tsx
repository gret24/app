import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────
interface TrendData {
  label: string; values: number[]; latest: number; first: number;
  change_pct: number; trend: 'improving'|'declining'|'stable'; direction: string;
}
interface StrengthWeakness { metric: string; label: string; change_pct: number; detail: string; }
interface Drill { name: string; description: string; duration: string; frequency: string; }
interface DevelopArea { metric: string; priority: string; current_level: string; target: string; drills: Drill[]; }
interface NextGoal { metric: string; target_value: string; description: string; }
interface GrowthReport {
  jersey: string; games_analyzed: number;
  trend_analysis: { trends: Record<string,TrendData>; strengths: StrengthWeakness[]; weaknesses: StrengthWeakness[]; };
  ai_recommendations: { overall_assessment: string; growth_grade: string; areas_to_develop: DevelopArea[]; next_game_goals: NextGoal[]; long_term_projection: string; };
}

// ─── Sparkline ───────────────────────────────────────────────────
function Sparkline({ values, color = Colors.accent }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 48, gap: 2, marginTop: 8 }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, height: ((v-min)/range)*44+4,
          backgroundColor: i===values.length-1 ? color : color+'40',
          borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      ))}
    </View>
  );
}

// ─── Trend Card ──────────────────────────────────────────────────
function TrendCard({ data, icon }: { data: TrendData; icon: string }) {
  const isUp = data.trend === 'improving';
  const trendColor = isUp ? Colors.success : data.trend === 'declining' ? Colors.error : Colors.outline;
  const arrow = isUp ? '↑' : data.trend === 'declining' ? '↓' : '→';
  return (
    <View style={st.trendCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.subtext }}>{data.label}</Text>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 32, fontWeight: '800', color: Colors.text, marginTop: 4 }}>
        {data.latest.toFixed(1)}
      </Text>
      <Sparkline values={data.values} color={isUp ? Colors.accent : Colors.outline} />
      <Text style={[{ fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 8 }, { color: trendColor }]}>
        {arrow} {data.change_pct > 0 ? '+' : ''}{data.change_pct.toFixed(1)}%
      </Text>
    </View>
  );
}

// ─── SW Card ─────────────────────────────────────────────────────
function SwCard({ item, type }: { item: StrengthWeakness; type: 'strength'|'weakness' }) {
  const isS = type === 'strength';
  return (
    <View style={[st.swCard, { borderLeftColor: isS ? Colors.success : Colors.error }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 16 }}>{isS ? '✅' : '⚠️'}</Text>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text }}>{item.label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: isS ? Colors.success : Colors.error }}>
          {item.change_pct > 0 ? '+' : ''}{item.change_pct.toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

// ─── Training Card ───────────────────────────────────────────────
function TrainingCard({ area }: { area: DevelopArea }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable style={[st.trainCard, { borderLeftColor: area.priority === 'high' ? Colors.accent : Colors.outline }]} onPress={() => setOpen(!open)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text>⚡</Text>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text }}>{area.target}</Text>
        <Text style={{ color: Colors.outline }}>{open ? '∧' : '∨'}</Text>
      </View>
      {open && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <Text style={{ fontSize: 12, color: Colors.subtext, lineHeight: 18 }}>{area.current_level}</Text>
          {area.drills.map((d, i) => (
            <View key={i} style={{ backgroundColor: Colors.card, borderRadius: 4, padding: 12, gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accent }}>🔸 {d.name}</Text>
              <Text style={{ fontSize: 12, color: Colors.subtext }}>{d.description}</Text>
              <Text style={{ fontSize: 11, color: Colors.outline, marginTop: 4 }}>{d.duration} / {d.frequency}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function GrowthDashboard() {
  const router = useRouter();
  const [report] = useState<GrowthReport>(MOCK);

  const { trend_analysis: ta, ai_recommendations: ai } = report;

  return (
    <ScrollView style={st.root} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Pressable onPress={() => router.back()}><Text style={{ fontSize: 28, color: Colors.accent }}>‹</Text></Pressable>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: 1 }}>성장 대시보드</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Stage Badge */}
      <View style={st.stage}>
        <View style={st.stageGlow} />
        <Text style={{ fontSize: 10, fontWeight: '600', color: Colors.outline, letterSpacing: 3, marginBottom: 8 }}>PLAYER PERFORMANCE HUB</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: 2 }}>ELITE STAGE</Text>
        <Text style={{ fontSize: 12, color: Colors.accent, marginTop: 8 }}>최근 {report.games_analyzed}경기 데이터 분석 완료</Text>
      </View>

      {/* Section Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, letterSpacing: 2 }}>PERFORMANCE TRENDS</Text>
        <Text style={{ fontSize: 10, fontWeight: '600', color: Colors.outline }}>LAST {report.games_analyzed} GAMES</Text>
      </View>

      {ta.trends.avg_speed && <TrendCard data={ta.trends.avg_speed} icon="⚡" />}
      {ta.trends.total_distance && <TrendCard data={ta.trends.total_distance} icon="📏" />}
      {ta.trends.stamina_decay_pct && <TrendCard data={{...ta.trends.stamina_decay_pct, label: '스태미나', latest: 100+ta.trends.stamina_decay_pct.latest}} icon="💪" />}

      {ta.strengths.length > 0 && <>
        <Text style={st.groupTitle}>강점 (Strengths)</Text>
        {ta.strengths.map((s,i) => <SwCard key={i} item={s} type="strength" />)}
      </>}

      {ta.weaknesses.length > 0 && <>
        <Text style={st.groupTitle}>보완점 (Weaknesses)</Text>
        {ta.weaknesses.map((s,i) => <SwCard key={i} item={s} type="weakness" />)}
      </>}

      <Text style={st.groupTitle}>AI 훈련 추천</Text>
      {ai.areas_to_develop.map((a,i) => <TrainingCard key={i} area={a} />)}

      {ai.next_game_goals.length > 0 && <>
        <Text style={st.groupTitle}>다음 경기 목표</Text>
        <View style={st.goalsCard}>
          {ai.next_game_goals.map((g,i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.outlineVariant }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{g.description}</Text>
            </View>
          ))}
          <Pressable style={st.goalBtn}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.bg, letterSpacing: 1 }}>목표 달성 전략 보기</Text>
          </Pressable>
        </View>
      </>}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Mock Data ───────────────────────────────────────────────────
const MOCK: GrowthReport = {
  jersey: '47', games_analyzed: 5,
  trend_analysis: {
    trends: {
      avg_speed: { label: '속도 (Speed)', values: [28.5,30.1,31.8,33.0,34.2], latest: 34.2, first: 28.5, change_pct: 20.0, trend: 'improving', direction: 'higher_better' },
      total_distance: { label: '거리 (Distance)', values: [5.2,5.8,6.1,6.5,6.8], latest: 6.8, first: 5.2, change_pct: 30.8, trend: 'improving', direction: 'higher_better' },
      stamina_decay_pct: { label: '스태미나', values: [-18,-15,-14,-13,-12], latest: -12, first: -18, change_pct: 33.3, trend: 'improving', direction: 'lower_better' },
    },
    strengths: [
      { metric: 'sprint_count', label: '순발력', change_pct: 12, detail: '+12%' },
      { metric: 'high_slot_pct', label: '슬랩 샷 정확도', change_pct: 8, detail: '+8%' },
    ],
    weaknesses: [
      { metric: 'stamina_decay_pct', label: '체력 유지', change_pct: -15, detail: '-15%' },
      { metric: 'backcheck_sec', label: '백체킹 속도', change_pct: -5, detail: '-5%' },
    ],
  },
  ai_recommendations: {
    overall_assessment: '전반적 성장세. 속도와 거리 지표 우수.',
    growth_grade: 'B+',
    areas_to_develop: [
      { metric: 'stamina', priority: 'high',
        current_level: '3피리어드 후반부 스태미나 급격 저하 경향 발견.',
        target: '고강도 인터벌 트레이닝 (HIIT)',
        drills: [{ name: '인터벌 러닝', description: '주 3회 20분 고강도 인터벌 러닝으로 심폐 지구력 보강', duration: '20분', frequency: '주 3회' }] },
      { metric: 'lower_body', priority: 'medium',
        current_level: '하체 근력이 상대적으로 약한 편.',
        target: '하체 근력 강화 (Lower Body)',
        drills: [{ name: '스쿼트+런지', description: '스쿼트 3세트×12회 + 런지 3세트×10회', duration: '30분', frequency: '주 2회' }] },
    ],
    next_game_goals: [
      { metric: 'assists', target_value: '1+', description: '어시스트 1개 이상' },
      { metric: 'shots', target_value: '3', description: '유효 슈팅 3회' },
      { metric: 'blocks', target_value: '2', description: '블로킹 성공 2회' },
      { metric: 'penalties', target_value: '0', description: '페널티 0분' },
    ],
    long_term_projection: '현재 추세 유지 시 3개월 내 전체 퍼포먼스 15% 향상 예상.',
  },
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  stage: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 24, alignItems: 'center', marginBottom: 24, overflow: 'hidden', position: 'relative' },
  stageGlow: { position: 'absolute', width: 200, height: 200, backgroundColor: Colors.accentGlow, borderRadius: 100, top: -60, opacity: 0.5 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 24, marginBottom: 12 },
  trendCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 16, marginBottom: 12 },
  swCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 14, marginBottom: 8, borderLeftWidth: 3 },
  trainCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 16, marginBottom: 10, borderLeftWidth: 3 },
  goalsCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 16, gap: 14 },
  goalBtn: { height: 48, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', marginTop: 8, backgroundColor: Colors.accent },
});
