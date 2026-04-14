import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius } from '../../constants/Colors';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────
interface Weakness {
  type: string; description: string; severity: 'high'|'medium'|'low';
}
interface LinePlayer {
  jersey: string; position: string; reason: string;
}
interface LineRec {
  line: string; players: LinePlayer[]; strategy: string; target_weakness: string;
}
interface Mission {
  jersey: string; name: string; mission_title: string;
  mission_detail: string; key_zones: string[]; avoid: string; target_metric: string;
}
interface ScoutingReport {
  opponent_name: string;
  primary_formation: string;
  forecheck_intensity: number;
  zone_tendency: { OZ: number; NZ: number; DZ: number };
  weaknesses: Weakness[];
  game_plan: { summary: string; tactical_focus: string[] };
  line_recommendations: LineRec[];
  player_missions: Mission[];
  defensive_plan: { formation: string; matchup_strategy: string };
  special_teams: { pp_strategy: string; pk_strategy: string };
}

// ─── Vulnerability Badge ─────────────────────────────────────────
function VulnBadge({ weakness }: { weakness: Weakness }) {
  const color = weakness.severity === 'high' ? '#FF3B30' : '#FFD700';
  return (
    <View style={[st.vulnBadge, { borderLeftColor: color }]}>
      <Text style={[st.vulnSev, { color }]}>
        {weakness.severity === 'high' ? '🔴 HIGH' : '🟡 MED'}
      </Text>
      <Text style={st.vulnDesc}>{weakness.description}</Text>
    </View>
  );
}

// ─── Line Card ───────────────────────────────────────────────────
function LineCard({ rec }: { rec: LineRec }) {
  const isOff = rec.line.includes('1') || rec.strategy.toLowerCase().includes('offens');
  const tagColor = isOff ? Colors.accent : Colors.secondary;
  const tagText = isOff ? 'OFFENSIVE' : 'DEFENSIVE';
  return (
    <View style={st.lineCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={st.lineName}>{rec.line}</Text>
        <View style={[st.lineTag, { backgroundColor: tagColor + '22', borderColor: tagColor + '55' }]}>
          <Text style={[st.lineTagText, { color: tagColor }]}>{tagText}</Text>
        </View>
      </View>
      {rec.players.map((p, i) => (
        <View key={i} style={st.linePlayerRow}>
          <View style={st.jerseyChip}>
            <Text style={st.jerseyChipText}>#{p.jersey}</Text>
          </View>
          <Text style={st.linePlayerName}>{p.position}</Text>
          <Text style={st.linePlayerReason} numberOfLines={1}>{p.reason}</Text>
        </View>
      ))}
      <Text style={st.lineStrategy}>전략: {rec.strategy}</Text>
    </View>
  );
}

// ─── Mission Card ────────────────────────────────────────────────
function MissionCard({ mission }: { mission: Mission }) {
  return (
    <View style={st.missionCard}>
      <View style={st.missionHeader}>
        <View>
          <Text style={st.missionName}>{mission.name}</Text>
          <Text style={st.missionTitle}>{mission.mission_title}</Text>
        </View>
        <View style={st.missionMetric}>
          <Text style={st.missionMetricLabel}>TARGET</Text>
          <Text style={st.missionMetricValue}>{mission.target_metric}</Text>
        </View>
      </View>
      <Text style={st.missionDetail}>{mission.mission_detail}</Text>
      {mission.avoid ? (
        <View style={st.missionAvoid}>
          <Text style={st.missionAvoidText}>❌ {mission.avoid}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Rink Diagram (simplified gap visualization) ─────────────────
function RinkGapDiagram({ weaknesses }: { weaknesses: Weakness[] }) {
  const hasLeftGap = weaknesses.some(w => w.type.includes('left') || w.description.includes('좌측'));
  const hasRightGap = weaknesses.some(w => w.type.includes('right') || w.description.includes('우측'));
  const hasCenter = weaknesses.some(w => w.type.includes('center') || w.description.includes('중앙'));

  return (
    <View style={st.rinkContainer}>
      <View style={st.rinkBg}>
        {/* Zone labels */}
        <View style={st.rinkZones}>
          <Text style={st.zoneLabel}>ZONE 3 DEFICIT</Text>
          <View style={{ flex: 1 }} />
          {weaknesses.length > 0 && (
            <View style={st.vulnDetected}>
              <Text style={st.vulnDetectedText}>VULNERABILITY DETECTED</Text>
            </View>
          )}
        </View>
        {/* Simplified rink with gap indicators */}
        <View style={st.rinkIce}>
          {hasLeftGap && <View style={[st.gapZone, { left: '10%', top: '20%' }]} />}
          {hasCenter && <View style={[st.gapZone, { left: '40%', top: '40%' }]} />}
          {hasRightGap && <View style={[st.gapZone, { right: '10%', top: '30%' }]} />}
          {/* Center line */}
          <View style={st.centerLine} />
          {/* Blue lines */}
          <View style={[st.blueLine, { left: '31%' }]} />
          <View style={[st.blueLine, { left: '69%' }]} />
        </View>
        <Text style={st.rinkCaption}>
          Defensive Gaps: {weaknesses.map(w => w.type.replace(/_/g, ' ')).join(', ') || 'None detected'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function ScoutingScreen() {
  const router = useRouter();
  const [report] = useState<ScoutingReport>(MOCK);

  return (
    <ScrollView style={st.root} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56 }}>
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 28, color: Colors.accent }}>‹</Text>
        </Pressable>
        <Text style={st.headerTitle}>SCOUTING REPORT</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Opponent Info */}
      <Text style={st.upcomingLabel}>UPCOMING MATCHUP</Text>
      <View style={st.opponentRow}>
        <Text style={st.opponentName}>{report.opponent_name}</Text>
        <View style={st.formationBadge}>
          <Text style={st.formationText}>{report.primary_formation}</Text>
          <Text style={st.formationSub}>SYSTEM</Text>
        </View>
      </View>
      <Text style={st.forecheckLabel}>
        Forecheck Intensity: {report.forecheck_intensity}%
      </Text>

      {/* Rink Gap Visualization */}
      <RinkGapDiagram weaknesses={report.weaknesses} />

      {/* Weaknesses */}
      {report.weaknesses.length > 0 && (
        <>
          <Text style={st.sectionTitle}>상대 약점</Text>
          {report.weaknesses.map((w, i) => <VulnBadge key={i} weakness={w} />)}
        </>
      )}

      {/* Game Plan */}
      <Text style={st.sectionTitle}>게임 플랜</Text>
      <View style={st.planCard}>
        <Text style={st.planSummary}>{report.game_plan.summary}</Text>
        {report.game_plan.tactical_focus.map((tf, i) => (
          <View key={i} style={st.focusRow}>
            <Text style={st.focusDot}>▸</Text>
            <Text style={st.focusText}>{tf}</Text>
          </View>
        ))}
      </View>

      {/* Recommended Lineups */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <Text style={st.sectionTitle}>RECOMMENDED LINEUPS</Text>
        <Text style={{ fontSize: 10, color: Colors.accent, fontWeight: '700', letterSpacing: 1 }}>OPTIMIZED</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
        {report.line_recommendations.map((lr, i) => <LineCard key={i} rec={lr} />)}
      </ScrollView>

      {/* Player Missions */}
      <Text style={[st.sectionTitle, { marginTop: 24 }]}>KEY PLAYER MISSIONS</Text>
      {report.player_missions.map((m, i) => <MissionCard key={i} mission={m} />)}

      {/* Defense & Special Teams */}
      <Text style={[st.sectionTitle, { marginTop: 24 }]}>수비 & 스페셜팀</Text>
      <View style={st.defCard}>
        <Text style={st.defLabel}>🛡 수비 포메이션</Text>
        <Text style={st.defValue}>{report.defensive_plan.formation}</Text>
        <Text style={st.defDetail}>{report.defensive_plan.matchup_strategy}</Text>
      </View>
      <View style={st.defCard}>
        <Text style={st.defLabel}>⚡ 파워플레이</Text>
        <Text style={st.defDetail}>{report.special_teams.pp_strategy}</Text>
      </View>
      <View style={st.defCard}>
        <Text style={st.defLabel}>🔒 페널티킬</Text>
        <Text style={st.defDetail}>{report.special_teams.pk_strategy}</Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Mock Data ───────────────────────────────────────────────────
const MOCK: ScoutingReport = {
  opponent_name: 'Shadow Wolves',
  primary_formation: '1-2-2',
  forecheck_intensity: 43,
  zone_tendency: { OZ: 17, NZ: 64, DZ: 19 },
  weaknesses: [
    { type: 'passive_forecheck', description: '포체킹이 소극적 — 빠른 전환 공략 가능', severity: 'high' },
    { type: 'left_high_slot', description: '좌측 하이슬롯 커버리지 부족 34%', severity: 'high' },
    { type: 'breakout_dependent', description: '브레이크아웃 의존도 35% — 포체킹 압박 유효', severity: 'medium' },
  ],
  game_plan: {
    summary: '상대의 소극적 포체킹을 역이용하여 빠른 전환 공격 위주로 전개',
    tactical_focus: [
      '뉴트럴존에서 빠른 캐리인 (덤프 최소화)',
      '상대 좌측 하이슬롯 갭 공략',
      '포체킹 강도 높여 턴오버 유도',
    ],
  },
  line_recommendations: [
    {
      line: 'LINE 1', strategy: '상대 좌측 갭으로 캐리인 후 하이슬롯 원타이머',
      target_weakness: '좌측 수비 부족',
      players: [
        { jersey: '47', position: 'RW', reason: '폭발적 속도' },
        { jersey: '25', position: 'C', reason: '전환 플레이어' },
        { jersey: '11', position: 'LW', reason: '패싱 능력' },
      ],
    },
    {
      line: 'LINE 2', strategy: '안정적 포지셔닝 + 수비 전환',
      target_weakness: '브레이크아웃 차단',
      players: [
        { jersey: '36', position: 'C', reason: '넓은 커버리지' },
        { jersey: '4', position: 'LW', reason: '수비 책임감' },
        { jersey: '61', position: 'RW', reason: '슬롯 침투' },
      ],
    },
  ],
  player_missions: [
    {
      jersey: '47', name: 'Han', mission_title: 'HIGH PRESS PRIORITY',
      mission_detail: '상대 디펜스맨 브레이크아웃 경로를 원천 차단. 전환 초반에 턴오버 유도.',
      key_zones: ['neutral_zone', 'offensive_blue_line'],
      avoid: '뉴트럴존에서 퍽 오래 보유하지 말 것',
      target_metric: '턴오버 유도 3회+',
    },
    {
      jersey: '25', name: 'Kim', mission_title: 'NEUTRAL ZONE TRAP',
      mission_detail: '센터 채널 장악. 상대 파워플레이 시 패스 루트 차단하고 보드로 유도.',
      key_zones: ['center_channel', 'neutral_zone'],
      avoid: '상대 포워드 뒤로 밀려나지 않기',
      target_metric: '인터셉트 2회+',
    },
    {
      jersey: '14', name: 'Lee', mission_title: 'SLOT PENETRATION',
      mission_detail: '하이슬롯 빈 공간 침투. 상대 LD 커버리지 약점 활용해 원타이머 포지션.',
      key_zones: ['high_slot', 'right_circle'],
      avoid: '수비존에서 너무 깊이 내려가지 않기',
      target_metric: '슈팅 기회 생성 4회+',
    },
  ],
  defensive_plan: {
    formation: '1-2-2 포체킹',
    matchup_strategy: '상대 탑라인에 우리 1D 페어(#14, #28) 고정 배치. 넓은 커버리지로 중립화.',
  },
  special_teams: {
    pp_strategy: '엄브렐라 포메이션 — 상대 PK가 소극적이므로 패싱으로 갭 만들기',
    pk_strategy: '다이아몬드 — 상대 PP 점유율이 낮으므로 적극 압박',
  },
};

// ─── Styles ──────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: Colors.accent, letterSpacing: 3 },

  upcomingLabel: { fontSize: 10, fontWeight: '600', color: Colors.outline, letterSpacing: 2, marginBottom: 8 },
  opponentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  opponentName: { fontSize: 32, fontWeight: '800', color: Colors.text, lineHeight: 38 },
  formationBadge: { backgroundColor: Colors.cardHighest, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  formationText: { fontSize: 16, fontWeight: '800', color: Colors.accent },
  formationSub: { fontSize: 9, fontWeight: '700', color: Colors.outline, letterSpacing: 2, marginTop: 2 },
  forecheckLabel: { fontSize: 11, color: Colors.outline, marginBottom: 16 },

  // Rink
  rinkContainer: { marginBottom: 20 },
  rinkBg: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 12, overflow: 'hidden' },
  rinkZones: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  zoneLabel: { fontSize: 10, fontWeight: '700', color: Colors.outline, letterSpacing: 1 },
  vulnDetected: { backgroundColor: '#FF3B3033', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  vulnDetectedText: { fontSize: 9, fontWeight: '800', color: '#FF3B30', letterSpacing: 1 },
  rinkIce: { width: '100%', aspectRatio: 2, backgroundColor: '#0A0F0A', borderRadius: 4, position: 'relative', overflow: 'hidden' },
  centerLine: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: '#FF3B3044' },
  blueLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#0066FF44' },
  gapZone: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF3B3033', borderWidth: 1, borderColor: '#FF3B3066' },
  rinkCaption: { fontSize: 11, color: Colors.accent, marginTop: 8, fontWeight: '600' },

  // Sections
  sectionTitle: { fontSize: 12, fontWeight: '800', color: Colors.text, letterSpacing: 2, marginTop: 16, marginBottom: 12 },

  // Vulnerability
  vulnBadge: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.md, padding: 12, marginBottom: 8, borderLeftWidth: 3 },
  vulnSev: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  vulnDesc: { fontSize: 13, color: Colors.subtext, lineHeight: 18 },

  // Plan
  planCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 16, gap: 10 },
  planSummary: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  focusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  focusDot: { color: Colors.accent, fontSize: 12, marginTop: 1 },
  focusText: { fontSize: 13, color: Colors.subtext, flex: 1, lineHeight: 18 },

  // Line Card
  lineCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 16, width: SCREEN_W * 0.7, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  lineName: { fontSize: 20, fontWeight: '900', color: Colors.text, fontStyle: 'italic' },
  lineTag: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  lineTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  linePlayerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  jerseyChip: { backgroundColor: Colors.accent + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  jerseyChipText: { fontSize: 11, fontWeight: '800', color: Colors.accent },
  linePlayerName: { fontSize: 13, fontWeight: '600', color: Colors.text, width: 36 },
  linePlayerReason: { fontSize: 11, color: Colors.outline, flex: 1 },
  lineStrategy: { fontSize: 11, color: Colors.subtext, marginTop: 8, lineHeight: 16, fontStyle: 'italic' },

  // Mission
  missionCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  missionName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  missionTitle: { fontSize: 11, fontWeight: '700', color: Colors.accent, letterSpacing: 1, marginTop: 2 },
  missionMetric: { alignItems: 'flex-end' },
  missionMetricLabel: { fontSize: 9, fontWeight: '700', color: Colors.outline, letterSpacing: 1 },
  missionMetricValue: { fontSize: 14, fontWeight: '800', color: Colors.text, marginTop: 2 },
  missionDetail: { fontSize: 13, color: Colors.subtext, lineHeight: 19 },
  missionAvoid: { backgroundColor: '#FF3B3011', borderRadius: 4, padding: 8, marginTop: 8 },
  missionAvoidText: { fontSize: 12, color: '#FF6644' },

  // Defense
  defCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: 14, marginBottom: 8, gap: 4 },
  defLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  defValue: { fontSize: 16, fontWeight: '800', color: Colors.accent },
  defDetail: { fontSize: 12, color: Colors.subtext, lineHeight: 17 },
});
