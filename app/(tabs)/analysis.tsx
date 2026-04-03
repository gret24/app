import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  FlatList, Dimensions, ActivityIndicator,
} from 'react-native';

import { getPlayers as apiGetPlayers, getReport as apiGetReport } from '../../api/analysisService';
import { apiGet } from '../../api/client';
import Svg, {
  Rect, Line, Circle, G, RadialGradient, Defs, Stop, Ellipse, Text as SvgText, Polyline, Polygon,
} from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { MOCK_PLAYERS, MOCK_ZONE_DATA, MOCK_OVERVIEW, Player } from '../../data/mockData';

const { width: SCREEN_W } = Dimensions.get('window');
const RINK_W = SCREEN_W - 40;
const RINK_H = RINK_W * 0.46;

// ─────────────────────────────────────────────
// Hockey Rink SVG
// ─────────────────────────────────────────────
function HockeyRink({ showHeatmap }: { showHeatmap: boolean }) {
  const w = RINK_W;
  const h = RINK_H;
  const r = 10; // corner radius
  const bx1 = w * 0.31; // left blue line
  const bx2 = w * 0.69; // right blue line
  const cx  = w / 2;    // center

  // Goal crease
  const goalW = 8;
  const goalH = h * 0.3;
  const creaseR = h * 0.12;

  return (
    <Svg width={w} height={h}>
      <Defs>
        {showHeatmap && (
          <>
            <RadialGradient id="heatO" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FF3B30" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#FF3B30" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="heatD" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="heatN" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.40" />
              <Stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </RadialGradient>
          </>
        )}
      </Defs>

      {/* Background ice */}
      <Rect x={2} y={2} width={w - 4} height={h - 4} rx={r} ry={r} fill="#D8ECFF" stroke="#AABBCC" strokeWidth={2} />

      {/* Zone tints */}
      <Rect x={bx2} y={2} width={w - bx2 - 4} height={h - 4} fill="#FF3B3022" />
      <Rect x={bx1} y={2} width={bx2 - bx1} height={h - 4} fill="#FFD70022" />
      <Rect x={2} y={2} width={bx1 - 2} height={h - 4} fill="#007AFF22" />

      {/* Boards (outer rect) */}
      <Rect x={2} y={2} width={w - 4} height={h - 4} rx={r} ry={r} fill="none" stroke="#AAAAAA" strokeWidth={2} />

      {/* Blue lines */}
      <Line x1={bx1} y1={2} x2={bx1} y2={h - 2} stroke="#1A5FCC" strokeWidth={3} />
      <Line x1={bx2} y1={2} x2={bx2} y2={h - 2} stroke="#1A5FCC" strokeWidth={3} />

      {/* Red center line */}
      <Line x1={cx} y1={2} x2={cx} y2={h - 2} stroke="#CC1A1A" strokeWidth={2.5} />

      {/* Center circle */}
      <Circle cx={cx} cy={h / 2} r={h * 0.22} fill="none" stroke="#CC1A1A" strokeWidth={1.5} />
      <Circle cx={cx} cy={h / 2} r={3} fill="#CC1A1A" />

      {/* Faceoff circles */}
      {[
        { cx: w * 0.2,  cy: h * 0.28 },
        { cx: w * 0.2,  cy: h * 0.72 },
        { cx: w * 0.8,  cy: h * 0.28 },
        { cx: w * 0.8,  cy: h * 0.72 },
      ].map((pos, i) => (
        <G key={i}>
          <Circle cx={pos.cx} cy={pos.cy} r={h * 0.14} fill="none" stroke="#CC1A1A" strokeWidth={1.5} />
          <Circle cx={pos.cx} cy={pos.cy} r={3} fill="#CC1A1A" />
        </G>
      ))}

      {/* Goal nets */}
      <Rect x={2} y={(h - goalH) / 2} width={goalW} height={goalH} fill="#BBBBBB" stroke="#888" strokeWidth={1} />
      <Rect x={w - 2 - goalW} y={(h - goalH) / 2} width={goalW} height={goalH} fill="#BBBBBB" stroke="#888" strokeWidth={1} />

      {/* Goal creases */}
      <Ellipse cx={goalW + creaseR * 0.7} cy={h / 2} rx={creaseR} ry={creaseR * 0.65} fill="#CC1A1A33" stroke="#CC1A1A" strokeWidth={1} />
      <Ellipse cx={w - goalW - creaseR * 0.7} cy={h / 2} rx={creaseR} ry={creaseR * 0.65} fill="#CC1A1A33" stroke="#CC1A1A" strokeWidth={1} />

      {/* Zone labels */}
      <SvgText x={w * 0.15} y={h - 8} fontSize={10} fill="#007AFF" fontWeight="bold" textAnchor="middle">D</SvgText>
      <SvgText x={cx}       y={h - 8} fontSize={10} fill="#B8860B" fontWeight="bold" textAnchor="middle">N</SvgText>
      <SvgText x={w * 0.85} y={h - 8} fontSize={10} fill="#CC1A1A" fontWeight="bold" textAnchor="middle">O</SvgText>

      {/* Heatmap overlay */}
      {showHeatmap && (
        <G>
          {/* Offensive zone heat */}
          <Ellipse cx={w * 0.82} cy={h * 0.5} rx={w * 0.12} ry={h * 0.38} fill="url(#heatO)" />
          {/* Defensive zone heat */}
          <Ellipse cx={w * 0.18} cy={h * 0.5} rx={w * 0.10} ry={h * 0.30} fill="url(#heatD)" />
          {/* Neutral zone heat */}
          <Ellipse cx={cx} cy={h * 0.45} rx={w * 0.09} ry={h * 0.22} fill="url(#heatN)" />
        </G>
      )}
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Zone Timeline Bar
// ─────────────────────────────────────────────
function ZoneTimeline() {
  const data = MOCK_ZONE_DATA.timeline;
  const total = data.reduce((s, d) => s + d.duration, 0);
  const zoneColors: Record<string, string> = { O: '#FF3B30', N: '#FFD700', D: '#007AFF' };

  return (
    <View style={tz.container}>
      <Text style={tz.label}>Zone Timeline</Text>
      <View style={tz.bar}>
        {data.map((seg, i) => (
          <View
            key={i}
            style={[tz.segment, {
              flex: seg.duration / total,
              backgroundColor: zoneColors[seg.zone],
            }]}
          />
        ))}
      </View>
      <View style={tz.legend}>
        {(['O', 'N', 'D'] as const).map(z => (
          <View key={z} style={tz.legendItem}>
            <View style={[tz.dot, { backgroundColor: zoneColors[z] }]} />
            <Text style={tz.legendText}>{z === 'O' ? 'Offensive' : z === 'N' ? 'Neutral' : 'Defensive'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const tz = StyleSheet.create({
  container: { gap: 8, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.subtext },
  bar: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden' },
  segment: { height: '100%' },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.subtext },
});

// ─────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────
function OverviewTab() {
  const stats = [
    { label: 'Ice Time', value: MOCK_OVERVIEW.iceTime,  icon: '⏱' },
    { label: 'Shifts',   value: String(MOCK_OVERVIEW.shifts), icon: '🔄' },
    { label: 'Avg Shift', value: MOCK_OVERVIEW.avgShiftLength, icon: '📏' },
    { label: 'Goals',    value: String(MOCK_OVERVIEW.goals),   icon: '🥅' },
    { label: 'Assists',  value: String(MOCK_OVERVIEW.assists),  icon: '🏒' },
    { label: '+/-',      value: `+${MOCK_OVERVIEW.plusMinus}`,  icon: '📊' },
  ];

  return (
    <View style={ov.container}>
      <View style={ov.statsGrid}>
        {stats.map(s => (
          <View key={s.label} style={ov.statCard}>
            <Text style={ov.statIcon}>{s.icon}</Text>
            <Text style={ov.statValue}>{s.value}</Text>
            <Text style={ov.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={ov.highlightCard}>
        <View style={ov.highlightLeft}>
          <Text style={ov.highlightTitle}>Highlight Reel</Text>
          <Text style={ov.highlightSub}>3 key moments captured</Text>
        </View>
        <Pressable style={ov.playBtn}>
          <Text style={ov.playBtnText}>▶</Text>
        </Pressable>
      </View>
    </View>
  );
}

const ov = StyleSheet.create({
  container: { gap: 16, paddingTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: Colors.card, borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: 11, color: Colors.subtext, textAlign: 'center' },
  highlightCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.border,
  },
  highlightLeft: { gap: 4 },
  highlightTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  highlightSub: { fontSize: 13, color: Colors.subtext },
  playBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  playBtnText: { fontSize: 18, color: Colors.bg },
});

// ─────────────────────────────────────────────
// Zone Analysis Tab
// ─────────────────────────────────────────────
function ZoneAnalysisTab() {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const z = MOCK_ZONE_DATA;
  const zoneStats = [
    { zone: 'O', label: 'Offensive', color: '#FF3B30', data: z.ozone },
    { zone: 'N', label: 'Neutral',   color: '#FFD700', data: z.nzone },
    { zone: 'D', label: 'Defensive', color: '#007AFF', data: z.dzone },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={za.container}>
        {/* Rink */}
        <View style={za.rinkContainer}>
          <View style={za.rinkHeader}>
            <Text style={za.rinkTitle}>Zone Map</Text>
            <Pressable
              style={[za.heatmapToggle, showHeatmap && za.heatmapToggleActive]}
              onPress={() => setShowHeatmap(v => !v)}
            >
              <Text style={za.heatmapToggleText}>
                {showHeatmap ? '🔥 Hide Heatmap' : '🔥 Show Heatmap'}
              </Text>
            </Pressable>
          </View>
          <HockeyRink showHeatmap={showHeatmap} />
        </View>

        {/* Zone stat cards */}
        <View style={za.statsRow}>
          {zoneStats.map(zs => (
            <View key={zs.zone} style={[za.zoneCard, { borderTopColor: zs.color, borderTopWidth: 3 }]}>
              <Text style={[za.zoneLabel, { color: zs.color }]}>{zs.label}</Text>
              <Text style={za.zonePct}>{zs.data.percentage}%</Text>
              <Text style={za.zoneSub}>{zs.data.touches} touches</Text>
              <View style={za.zoneDetail}>
                <Text style={za.zoneDetailText}>↓{zs.data.entries} in</Text>
                <Text style={za.zoneDetailText}>↑{zs.data.exits} out</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Timeline */}
        <View style={za.card}>
          <ZoneTimeline />
        </View>

        {/* Zone Transitions */}
        <View style={za.card}>
          <Text style={za.cardTitle}>Zone Transitions</Text>
          <View style={za.transitionGrid}>
            {z.transitions.map(t => (
              <View key={t.label} style={za.transitionItem}>
                <Text style={za.transitionLabel}>{t.label}</Text>
                <Text style={za.transitionCount}>{t.count}×</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const za = StyleSheet.create({
  container: { gap: 16, paddingTop: 8 },
  rinkContainer: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  rinkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rinkTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  heatmapToggle: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
  },
  heatmapToggleActive: { borderColor: '#FF3B30', backgroundColor: '#FF3B3022' },
  heatmapToggleText: { fontSize: 12, color: Colors.subtext, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  zoneCard: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: 12, padding: 12, gap: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  zoneLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  zonePct: { fontSize: 22, fontWeight: '800', color: Colors.text },
  zoneSub: { fontSize: 10, color: Colors.subtext },
  zoneDetail: { flexDirection: 'row', gap: 6, marginTop: 4 },
  zoneDetailText: { fontSize: 10, color: Colors.subtext },
  card: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  transitionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  transitionItem: {
    backgroundColor: Colors.input, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', gap: 2, minWidth: '22%',
  },
  transitionLabel: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  transitionCount: { fontSize: 18, fontWeight: '800', color: Colors.text },
});

// ─────────────────────────────────────────────
// Speed Tab
// ─────────────────────────────────────────────
interface SpeedOverall {
  avg_speed_kmh: number;
  max_speed_kmh: number;
  total_distance_km: number;
  total_ice_time_min: number;
}
interface SpeedPeriod {
  period: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
}
interface SpeedPoint { time_sec: number; speed_kmh: number }

function SpeedTab({ videoStem, playerNumber }: { videoStem: string; playerNumber: string }) {
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState<SpeedOverall | null>(null);
  const [periods, setPeriods] = useState<SpeedPeriod[]>([]);
  const [timeline, setTimeline] = useState<SpeedPoint[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true); setError(false);
    apiGet<any>(`/stats/${videoStem}/player/${playerNumber}/speed`)
      .then(data => {
        if (!data?.overall || Object.keys(data.overall).length === 0) {
          setError(true);
        } else {
          setOverall(data.overall);
          setPeriods(data.per_period ?? []);
          setTimeline((data.speed_timeline ?? []).slice(0, 80));
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [videoStem, playerNumber]);

  if (loading) {
    return (
      <View style={sp.centered}>
        <ActivityIndicator color={Colors.accent} />
        <Text style={sp.loadingText}>Loading speed data...</Text>
      </View>
    );
  }

  if (error || !overall) {
    return (
      <View style={sp.centered}>
        <Text style={sp.comingSoonIcon}>⚡</Text>
        <Text style={sp.comingSoonTitle}>Speed Analysis</Text>
        <Text style={sp.comingSoonSub}>No speed data available for this game &amp; player.</Text>
      </View>
    );
  }

  // Fitness analysis
  const p1 = periods[0]?.avg_speed_kmh ?? 0;
  const p3 = periods[2]?.avg_speed_kmh ?? 0;
  const dropPct = p1 > 0 ? Math.round(((p1 - p3) / p1) * 100) : 0;
  const fitnessText =
    dropPct <= 5 ? 'Excellent fitness — speed consistent across all periods.' :
    dropPct <= 15 ? `Moderate fatigue — ${dropPct}% speed drop in P3. Focus on conditioning.` :
    `High fatigue — ${dropPct}% speed drop in P3. Consider interval training.`;

  // Timeline chart
  const chartW = SCREEN_W - 80;
  const chartH = 80;
  const maxSpd = Math.max(...timeline.map(p => p.speed_kmh), 1);
  const points = timeline.map((p, i) =>
    `${(i / (timeline.length - 1)) * chartW},${chartH - (p.speed_kmh / maxSpd) * chartH}`
  ).join(' ');

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={sp.container}>
        {/* Summary cards */}
        <View style={sp.summaryRow}>
          <View style={[sp.summaryCard, { borderTopColor: Colors.accent }]}>
            <Text style={sp.summaryIcon}>⚡</Text>
            <Text style={sp.summaryVal}>{overall.avg_speed_kmh}</Text>
            <Text style={sp.summaryUnit}>km/h</Text>
            <Text style={sp.summaryLabel}>Avg Speed</Text>
          </View>
          <View style={[sp.summaryCard, { borderTopColor: '#FF3B30' }]}>
            <Text style={sp.summaryIcon}>🚀</Text>
            <Text style={sp.summaryVal}>{overall.max_speed_kmh}</Text>
            <Text style={sp.summaryUnit}>km/h</Text>
            <Text style={sp.summaryLabel}>Top Speed</Text>
          </View>
          <View style={[sp.summaryCard, { borderTopColor: '#34C759' }]}>
            <Text style={sp.summaryIcon}>📏</Text>
            <Text style={sp.summaryVal}>{overall.total_distance_km}</Text>
            <Text style={sp.summaryUnit}>km</Text>
            <Text style={sp.summaryLabel}>Distance</Text>
          </View>
        </View>

        {/* Period comparison */}
        {periods.length > 0 && (
          <View style={sp.card}>
            <Text style={sp.cardTitle}>Period Comparison</Text>
            {periods.map(p => (
              <View key={p.period} style={sp.periodRow}>
                <Text style={sp.periodLabel}>P{p.period}</Text>
                <View style={sp.periodBar}>
                  <View style={[
                    sp.periodBarFill,
                    { width: `${Math.min((p.avg_speed_kmh / 35) * 100, 100)}%` },
                  ]} />
                </View>
                <Text style={sp.periodVal}>{p.avg_speed_kmh} km/h</Text>
              </View>
            ))}
          </View>
        )}

        {/* Speed timeline */}
        {timeline.length > 1 && (
          <View style={sp.card}>
            <Text style={sp.cardTitle}>Speed Timeline</Text>
            <Svg width={chartW} height={chartH + 8} style={{ marginTop: 4 }}>
              <Polyline
                points={points}
                fill="none"
                stroke={Colors.accent}
                strokeWidth="2"
              />
            </Svg>
            <View style={sp.timelineLabels}>
              <Text style={sp.timelineLabel}>0s</Text>
              <Text style={sp.timelineLabel}>{Math.round(timeline[Math.floor(timeline.length / 2)]?.time_sec ?? 0)}s</Text>
              <Text style={sp.timelineLabel}>{Math.round(timeline[timeline.length - 1]?.time_sec ?? 0)}s</Text>
            </View>
          </View>
        )}

        {/* Fitness analysis */}
        <View style={[sp.card, { borderLeftWidth: 3, borderLeftColor: dropPct <= 5 ? '#34C759' : dropPct <= 15 ? '#FFD700' : '#FF3B30' }]}>
          <Text style={sp.cardTitle}>Fitness Analysis</Text>
          <Text style={sp.fitnessText}>{fitnessText}</Text>
          <Text style={sp.iceTimeText}>Total ice time: {overall.total_ice_time_min} min</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const sp = StyleSheet.create({
  centered: { paddingVertical: 60, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: Colors.subtext },
  comingSoonIcon: { fontSize: 48 },
  comingSoonTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  comingSoonSub: { fontSize: 13, color: Colors.subtext, textAlign: 'center' },
  container: { gap: 16, paddingTop: 8 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: Colors.border, borderTopWidth: 3,
  },
  summaryIcon: { fontSize: 20 },
  summaryVal: { fontSize: 22, fontWeight: '800', color: Colors.text },
  summaryUnit: { fontSize: 10, color: Colors.subtext },
  summaryLabel: { fontSize: 11, color: Colors.subtext, marginTop: 2 },
  card: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodLabel: { fontSize: 13, fontWeight: '700', color: Colors.subtext, width: 24 },
  periodBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.input, overflow: 'hidden' },
  periodBarFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.accent },
  periodVal: { fontSize: 12, color: Colors.text, fontWeight: '600', width: 72, textAlign: 'right' },
  timelineLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineLabel: { fontSize: 10, color: Colors.subtext },
  fitnessText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
  iceTimeText: { fontSize: 12, color: Colors.subtext },
});

// ─────────────────────────────────────────────
// Progress Tab
// ─────────────────────────────────────────────
type PeriodFilter = 'last5' | 'last10' | 'season';

const PROGRESS_MOCK_GAMES = [
  { date: 'Mar 5',  avgSpeed: 18.2, distance: 4.1, iceTime: 14.5, oZone: 38, nZone: 32, dZone: 30 },
  { date: 'Mar 10', avgSpeed: 19.0, distance: 4.4, iceTime: 15.2, oZone: 40, nZone: 30, dZone: 30 },
  { date: 'Mar 15', avgSpeed: 18.7, distance: 4.3, iceTime: 14.8, oZone: 35, nZone: 35, dZone: 30 },
  { date: 'Mar 20', avgSpeed: 20.1, distance: 4.8, iceTime: 16.1, oZone: 42, nZone: 28, dZone: 30 },
  { date: 'Mar 28', avgSpeed: 21.3, distance: 5.2, iceTime: 17.0, oZone: 45, nZone: 27, dZone: 28 },
];

function pctChange(arr: number[]) {
  if (arr.length < 2) return 0;
  const first = arr[0], last = arr[arr.length - 1];
  if (first === 0) return 0;
  return Math.round(((last - first) / first) * 100);
}

function LineChart({
  data, color, width = 280, height = 72, label,
}: { data: number[]; color: string; width?: number; height?: number; label: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const PAD = 4;
  const pts = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (width - PAD * 2);
    const y = PAD + height - PAD * 2 - ((v - min) / range) * (height - PAD * 2);
    return `${x},${y}`;
  });
  const change = pctChange(data);
  const changeColor = change >= 0 ? '#34C759' : '#FF3B30';
  const arrow = change >= 0 ? '▲' : '▼';

  return (
    <View style={pg.chartCard}>
      <View style={pg.chartHeader}>
        <Text style={pg.chartLabel}>{label}</Text>
        <Text style={[pg.chartChange, { color: changeColor }]}>
          {arrow} {Math.abs(change)}%
        </Text>
      </View>
      <Svg width={width} height={height}>
        <Polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((pt, i) => {
          const [x, y] = pt.split(',').map(Number);
          return <Circle key={i} cx={x} cy={y} r={3} fill={color} />;
        })}
      </Svg>
      <View style={pg.chartXLabels}>
        {data.map((_, i) => i === 0 || i === data.length - 1 ? null : null).filter(Boolean)}
      </View>
    </View>
  );
}

function BarChart({
  data, color, width = 280, height = 72, label,
}: { data: number[]; color: string; width?: number; height?: number; label: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data) || 1;
  const barW = (width / data.length) * 0.6;
  const gap = width / data.length;
  const change = pctChange(data);
  const changeColor = change >= 0 ? '#34C759' : '#FF3B30';
  const arrow = change >= 0 ? '▲' : '▼';

  return (
    <View style={pg.chartCard}>
      <View style={pg.chartHeader}>
        <Text style={pg.chartLabel}>{label}</Text>
        <Text style={[pg.chartChange, { color: changeColor }]}>
          {arrow} {Math.abs(change)}%
        </Text>
      </View>
      <Svg width={width} height={height}>
        {data.map((v, i) => {
          const barH = (v / max) * (height - 8);
          const x = i * gap + (gap - barW) / 2;
          const y = height - barH;
          return <Rect key={i} x={x} y={y} width={barW} height={barH} rx={3} fill={color} fillOpacity={0.85} />;
        })}
      </Svg>
    </View>
  );
}

function ZoneStackedChart({
  games, width = 280, height = 72,
}: { games: typeof PROGRESS_MOCK_GAMES; width?: number; height?: number }) {
  const n = games.length;
  if (n === 0) return null;
  // Build stacked area polygons for O (top), N (mid), D (bottom)
  // Each zone occupies its percentage of height per game
  // We'll draw 3 filled polygons
  const xs = games.map((_, i) => (i / (n - 1)) * width);

  // bottom of each zone (cumulative from top)
  const oBottoms = games.map(g => (g.oZone / 100) * height);
  const nBottoms = games.map(g => ((g.oZone + g.nZone) / 100) * height);

  // O zone: top=0, bottom=oBottoms
  const oPts = [
    ...xs.map((x, i) => `${x},0`),
    ...[...xs].reverse().map((x, i) => `${x},${oBottoms[n - 1 - i]}`),
  ].join(' ');
  // N zone: top=oBottoms, bottom=nBottoms
  const nPts = [
    ...xs.map((x, i) => `${x},${oBottoms[i]}`),
    ...[...xs].reverse().map((x, i) => `${x},${nBottoms[n - 1 - i]}`),
  ].join(' ');
  // D zone: top=nBottoms, bottom=height
  const dPts = [
    ...xs.map((x, i) => `${x},${nBottoms[i]}`),
    ...[...xs].reverse().map((x) => `${x},${height}`),
  ].join(' ');

  return (
    <View style={pg.chartCard}>
      <View style={pg.chartHeader}>
        <Text style={pg.chartLabel}>Zone Distribution</Text>
        <View style={pg.zoneLegendRow}>
          {[['#FF3B30','O'],['#FFD700','N'],['#007AFF','D']].map(([c,l]) => (
            <View key={l} style={pg.zoneLegendItem}>
              <View style={[pg.zoneDot, { backgroundColor: c }]} />
              <Text style={pg.zoneLegendText}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
      <Svg width={width} height={height}>
        <Polygon points={oPts} fill="#FF3B30" fillOpacity={0.7} />
        <Polygon points={nPts} fill="#FFD700" fillOpacity={0.7} />
        <Polygon points={dPts} fill="#007AFF" fillOpacity={0.7} />
      </Svg>
    </View>
  );
}

function ProgressTab() {
  const [period, setPeriod] = useState<PeriodFilter>('last5');

  const allGames = PROGRESS_MOCK_GAMES;
  const games =
    period === 'last5' ? allGames.slice(-5) :
    period === 'last10' ? allGames.slice(-10) :
    allGames;

  const hasData = games.length >= 2;

  const avgSpeeds   = games.map(g => g.avgSpeed);
  const distances   = games.map(g => g.distance);
  const iceTimes    = games.map(g => g.iceTime);

  const bestGame    = games.reduce((a, b) => a.avgSpeed > b.avgSpeed ? a : b, games[0]);
  const worstGame   = games.reduce((a, b) => a.avgSpeed < b.avgSpeed ? a : b, games[0]);
  const speedChange = pctChange(avgSpeeds);

  const CHART_W = SCREEN_W - 80;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={pg.container}>
        {/* Period filter */}
        <View style={pg.filterRow}>
          {([['last5','Last 5'],['last10','Last 10'],['season','Season']] as [PeriodFilter,string][]).map(([key, lbl]) => (
            <Pressable
              key={key}
              style={[pg.filterBtn, period === key && pg.filterBtnActive]}
              onPress={() => setPeriod(key)}
            >
              <Text style={[pg.filterBtnText, period === key && pg.filterBtnTextActive]}>{lbl}</Text>
            </Pressable>
          ))}
        </View>

        {!hasData ? (
          <View style={pg.placeholder}>
            <Text style={pg.placeholderIcon}>📈</Text>
            <Text style={pg.placeholderTitle}>Upload more games to see your progress</Text>
            <Text style={pg.placeholderSub}>At least 2 games are required to show trends.</Text>
          </View>
        ) : (
          <>
            {/* Summary cards */}
            <View style={pg.summaryRow}>
              <View style={[pg.summaryCard, { borderTopColor: '#34C759' }]}>
                <Text style={pg.summaryCardIcon}>🏆</Text>
                <Text style={pg.summaryCardLabel}>Best Performance</Text>
                <Text style={pg.summaryCardVal}>{bestGame.date}</Text>
                <Text style={pg.summaryCardSub}>{bestGame.avgSpeed} km/h avg</Text>
              </View>
              <View style={[pg.summaryCard, { borderTopColor: Colors.accent }]}>
                <Text style={pg.summaryCardIcon}>📈</Text>
                <Text style={pg.summaryCardLabel}>Most Improved</Text>
                <Text style={pg.summaryCardVal}>Avg Speed</Text>
                <Text style={[pg.summaryCardSub, { color: speedChange >= 0 ? '#34C759' : '#FF3B30' }]}>
                  {speedChange >= 0 ? '+' : ''}{speedChange}%
                </Text>
              </View>
              <View style={[pg.summaryCard, { borderTopColor: '#FF3B30' }]}>
                <Text style={pg.summaryCardIcon}>⚠️</Text>
                <Text style={pg.summaryCardLabel}>Watch Out</Text>
                <Text style={pg.summaryCardVal}>{worstGame.date}</Text>
                <Text style={pg.summaryCardSub}>Low performance</Text>
              </View>
            </View>

            {/* Charts */}
            <LineChart data={avgSpeeds}  color={Colors.accent} width={CHART_W} label="Avg Speed (km/h)" />
            <LineChart data={distances}  color="#34C759"       width={CHART_W} label="Total Distance (km)" />
            <BarChart  data={iceTimes}   color="#AF52DE"       width={CHART_W} label="Ice Time (min)" />
            <ZoneStackedChart games={games} width={CHART_W} />

            {/* Game date labels */}
            <View style={pg.dateRow}>
              {games.map((g, i) => (
                <Text key={i} style={pg.dateLabel}>{g.date}</Text>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const pg = StyleSheet.create({
  container: { gap: 16, paddingTop: 8 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: Colors.subtext },
  filterBtnTextActive: { color: Colors.accent },
  placeholder: { paddingVertical: 60, alignItems: 'center', gap: 10 },
  placeholderIcon: { fontSize: 48 },
  placeholderTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  placeholderSub: { fontSize: 13, color: Colors.subtext, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: Colors.border, borderTopWidth: 3,
  },
  summaryCardIcon: { fontSize: 18 },
  summaryCardLabel: { fontSize: 10, color: Colors.subtext, textAlign: 'center' },
  summaryCardVal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  summaryCardSub: { fontSize: 11, color: Colors.subtext },
  chartCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  chartChange: { fontSize: 13, fontWeight: '700' },
  chartXLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  zoneLegendRow: { flexDirection: 'row', gap: 8 },
  zoneLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  zoneDot: { width: 8, height: 8, borderRadius: 4 },
  zoneLegendText: { fontSize: 11, color: Colors.subtext },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  dateLabel: { fontSize: 10, color: Colors.subtext, flex: 1, textAlign: 'center' },
});

// ─────────────────────────────────────────────
// Main AnalysisScreen
// ─────────────────────────────────────────────
const MOCK_VIDEOS = [
  { id: 'v1', label: 'Game vs Falcons — Mar 28' },
  { id: 'v2', label: 'Practice — Mar 25' },
  { id: 'v3', label: 'Game vs Wolves — Mar 20' },
];

type SubTab = 'overview' | 'zone' | 'speed' | 'progress';

export default function AnalysisScreen() {
  const [selectedVideo, setSelectedVideo] = useState(MOCK_VIDEOS[0]);
  const [showVideoDrop, setShowVideoDrop] = useState(false);
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(MOCK_PLAYERS[0]);
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [video_stem, setVideoStem] = useState('game1_val');
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await apiGetPlayers(video_stem);
        if (data.players && data.players.length > 0) {
          const mapped = data.players.map((p: any) => ({
            id: p.jersey, name: `#${p.jersey}`, number: p.jersey,
            team: Object.keys(p.teams ?? {})[0] ?? 'HOME',
            position: 'F' as any,
          }));
          setPlayers(mapped);
          setSelectedPlayer(mapped[0]);
        }
      } catch {
        setPlayers(MOCK_PLAYERS);
        setSelectedPlayer(MOCK_PLAYERS[0]);
      } finally {
        setLoadingPlayers(false);
      }
    };
    fetchPlayers();
  }, [video_stem]);

  return (
    <View style={as.root}>
      {/* Header */}
      <View style={as.header}>
        <Text style={as.headerTitle}>Analysis</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={as.content}>
        {/* Video Selector */}
        <View style={as.section}>
          <Text style={as.sectionLabel}>Select Video</Text>
          <Pressable
            style={as.dropdown}
            onPress={() => setShowVideoDrop(v => !v)}
          >
            <Text style={as.dropdownText}>{selectedVideo.label}</Text>
            <Text style={as.dropdownArrow}>{showVideoDrop ? '▲' : '▼'}</Text>
          </Pressable>
          {showVideoDrop && (
            <View style={as.dropdownMenu}>
              {MOCK_VIDEOS.map(v => (
                <Pressable
                  key={v.id}
                  style={[as.dropdownItem, v.id === selectedVideo.id && as.dropdownItemActive]}
                  onPress={() => { setSelectedVideo(v); setShowVideoDrop(false); }}
                >
                  <Text style={[as.dropdownItemText, v.id === selectedVideo.id && { color: Colors.accent }]}>
                    {v.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Player Selector */}
        <View style={as.section}>
          <Text style={as.sectionLabel}>Select Player</Text>
          {loadingPlayers ? (
            <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: 12 }} />
          ) : (
          <FlatList
            horizontal
            data={players}
            keyExtractor={p => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 4 }}
            renderItem={({ item }) => (
              <Pressable
                style={[as.playerCard, item.id === selectedPlayer.id && as.playerCardActive]}
                onPress={() => setSelectedPlayer(item)}
              >
                <View style={[as.playerJersey, item.id === selectedPlayer.id && as.playerJerseyActive]}>
                  <Text style={as.playerNumber}>#{item.number}</Text>
                </View>
                <Text style={[as.playerName, item.id === selectedPlayer.id && { color: Colors.accent }]}>
                  {item.name.split(' ')[0]}
                </Text>
                <Text style={as.playerPos}>{item.position}</Text>
              </Pressable>
            )}
          />
          )}
        </View>

        {/* Sub-tabs */}
        <View style={as.subTabs}>
          {(['overview', 'zone', 'speed', 'progress'] as SubTab[]).map(t => (
            <Pressable
              key={t}
              style={[as.subTab, subTab === t && as.subTabActive]}
              onPress={() => setSubTab(t)}
            >
              <Text style={[as.subTabText, subTab === t && as.subTabTextActive]}>
                {t === 'overview' ? 'Overview' : t === 'zone' ? 'Zone' : t === 'speed' ? 'Speed' : 'Progress'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {subTab === 'overview' && <OverviewTab />}
        {subTab === 'zone' && <ZoneAnalysisTab />}
        {subTab === 'speed' && (
          <SpeedTab videoStem={video_stem} playerNumber={String(selectedPlayer.number)} />
        )}
        {subTab === 'progress' && <ProgressTab />}
      </ScrollView>
    </View>
  );
}

const as = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  content: { padding: 20, paddingBottom: 40, gap: 20 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.subtext, letterSpacing: 0.5 },
  dropdown: {
    backgroundColor: Colors.card, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  dropdownText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  dropdownArrow: { fontSize: 12, color: Colors.subtext },
  dropdownMenu: {
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropdownItemActive: { backgroundColor: Colors.accent + '11' },
  dropdownItemText: { fontSize: 14, color: Colors.text },
  playerCard: {
    alignItems: 'center', gap: 4,
    backgroundColor: Colors.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    minWidth: 72,
  },
  playerCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '11' },
  playerJersey: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.input,
    justifyContent: 'center', alignItems: 'center',
  },
  playerJerseyActive: { backgroundColor: Colors.accent + '33' },
  playerNumber: { fontSize: 13, fontWeight: '800', color: Colors.text },
  playerName: { fontSize: 12, fontWeight: '600', color: Colors.subtext },
  playerPos: { fontSize: 10, color: Colors.subtext },
  subTabs: { flexDirection: 'row', gap: 0, backgroundColor: Colors.card, borderRadius: 12, padding: 3 },
  subTab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center',
  },
  subTabActive: { backgroundColor: Colors.accent + '22' },
  subTabText: { fontSize: 13, fontWeight: '600', color: Colors.subtext },
  subTabTextActive: { color: Colors.accent },
  comingSoon: {
    paddingVertical: 60, alignItems: 'center', gap: 10,
  },
  comingSoonIcon: { fontSize: 48 },
  comingSoonTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  comingSoonSub: { fontSize: 13, color: Colors.subtext, textAlign: 'center' },
});
