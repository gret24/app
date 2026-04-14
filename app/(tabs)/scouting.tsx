/**
 * IceIQ — Scouting Report Screen
 * Kinetic Edge Design System v2
 * Based on "Scouting Report" design reference
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Dimensions, FlatList,
} from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lineup {
  line: string;
  type: string;
  typeColor: string;
  players: { jersey: string; name: string; pos: string }[];
}

interface PlayerMission {
  jersey: string;
  name: string;
  role: string;
  roleColor: string;
  metric: string;
  metricValue: string;
  description: string;
  accentColor: string;
}

interface ScoutingData {
  opponentName: string;
  system: string;
  systemNote: string;
  // Rink zones
  deficitZone: string;
  vulnerability: string;
  defensiveGap: string;
  // Lineups
  lineups: Lineup[];
  // Missions
  missions: PlayerMission[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK: ScoutingData = {
  opponentName: 'Shadow Wolves',
  system: '1-2-2 SYSTEM',
  systemNote: 'High Forecheck Tactical',
  deficitZone: 'ZONE 3 DEFICIT',
  vulnerability: 'VULNERABILITY DETECTED',
  defensiveGap: 'Defensive Gaps: Neutral Zone Left',
  lineups: [
    {
      line: 'LINE 1', type: 'OFFENSIVE', typeColor: Colors.accent,
      players: [
        { jersey: '#19', name: 'Smith', pos: 'C' },
        { jersey: '#88', name: 'Kane', pos: 'LW' },
        { jersey: '#10', name: 'Miller', pos: 'RW' },
      ],
    },
    {
      line: 'LINE 2', type: 'BALANCED', typeColor: Colors.secondary,
      players: [
        { jersey: '#42', name: 'Thompson', pos: 'C' },
        { jersey: '#07', name: 'Park', pos: 'LW' },
        { jersey: '#22', name: 'Kim', pos: 'RW' },
      ],
    },
    {
      line: 'LINE 3', type: 'CHECKING', typeColor: Colors.outline,
      players: [
        { jersey: '#15', name: 'Davies', pos: 'C' },
        { jersey: '#33', name: 'Larsen', pos: 'LW' },
        { jersey: '#56', name: 'Zito', pos: 'RW' },
      ],
    },
  ],
  missions: [
    {
      jersey: '#7', name: 'Park, Jae-Ho', role: 'HIGH PRESS PRIORITY', roleColor: Colors.accent,
      metric: 'SUCCESS RATE', metricValue: '82%', accentColor: Colors.accent,
      description: "Target Shadow Wolves' defensemen in the primary breakout lane. Force turnovers early in the transition phase.",
    },
    {
      jersey: '#22', name: 'Kim, Sung-Min', role: 'NEUTRAL ZONE TRAP', roleColor: Colors.accentDim,
      metric: 'ENGAGEMENT', metricValue: 'High', accentColor: Colors.accentLight,
      description: 'Lock the center channel during opposition power plays. Redirect flow to the boards where defensive gaps are minimal.',
    },
    {
      jersey: '#88', name: 'Kane, Patrick', role: 'SLOT PENETRATION', roleColor: Colors.outline,
      metric: 'GOAL THREAT', metricValue: 'Elite', accentColor: Colors.cardHighest,
      description: 'Drive hard to the slot on every power play entry. Create screens and deflection opportunities in front of the net.',
    },
  ],
};

// ─── Rink Visualization ───────────────────────────────────────────────────────

function RinkViz() {
  return (
    <View style={rinkStyles.container}>
      {/* Rink border */}
      <View style={rinkStyles.rink}>
        {/* Center line */}
        <View style={rinkStyles.centerLine} />
        {/* Center circle */}
        <View style={rinkStyles.centerCircle} />
        {/* Zone labels */}
        <View style={[rinkStyles.zoneLabel, { top: 12, left: 12 }]}>
          <Text style={rinkStyles.zoneLabelText}>ZONE 3 DEFICIT</Text>
        </View>
        <View style={[rinkStyles.vulnLabel, { top: 12, right: 12 }]}>
          <Text style={[rinkStyles.zoneLabelText, { color: Colors.error }]}>VULNERABILITY</Text>
        </View>
        {/* Vulnerability blobs */}
        <View style={[rinkStyles.blob, { top: '25%' as any, left: '20%' as any, width: 60, height: 60, backgroundColor: Colors.error + '55' }]} />
        <View style={[rinkStyles.blob, { bottom: '30%' as any, right: '20%' as any, width: 72, height: 72, backgroundColor: Colors.error + '66' }]} />
        <View style={[rinkStyles.blob, { top: '50%' as any, right: '12%' as any, width: 44, height: 44, backgroundColor: Colors.error + '33' }]} />
        {/* Bottom label */}
        <View style={rinkStyles.bottomLabel}>
          <Text style={rinkStyles.bottomLabelText}>{MOCK.defensiveGap}</Text>
        </View>
      </View>
    </View>
  );
}

const rinkStyles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg },
  rink: {
    width: '100%', aspectRatio: 4 / 3,
    backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.outlineVariant + '33',
    overflow: 'hidden', position: 'relative',
  },
  centerLine: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: Colors.outlineVariant + '55' },
  centerCircle: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: Colors.outlineVariant + '44', top: '50%', left: '50%', marginTop: -40, marginLeft: -40 },
  zoneLabel: { position: 'absolute', backgroundColor: Colors.cardHighest + 'CC', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  vulnLabel: { position: 'absolute', backgroundColor: Colors.errorContainer + 'CC', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  zoneLabelText: { fontFamily: Fonts.headline, fontSize: 8, letterSpacing: 1.5, color: Colors.accentDim, textTransform: 'uppercase' },
  blob: { position: 'absolute', borderRadius: 999 },
  bottomLabel: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  bottomLabelText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.subtext, backgroundColor: Colors.bg + 'CC', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.outlineVariant + '22' },
});

// ─── Lineup Card ──────────────────────────────────────────────────────────────

function LineupCard({ lineup }: { lineup: Lineup }) {
  const isFirst = lineup.line === 'LINE 1';
  return (
    <View style={[lineupStyles.card, isFirst && lineupStyles.cardActive]}>
      <View style={lineupStyles.header}>
        <Text style={[lineupStyles.lineNum, isFirst && { color: Colors.accentDim }]}>{lineup.line}</Text>
        <View style={[lineupStyles.typeBadge, { backgroundColor: lineup.typeColor + '22' }]}>
          <Text style={[lineupStyles.typeText, { color: lineup.typeColor }]}>{lineup.type}</Text>
        </View>
      </View>
      {lineup.players.map((p, i) => (
        <View key={i} style={lineupStyles.playerRow}>
          <View style={[lineupStyles.jerseyBox, isFirst && { backgroundColor: Colors.accentGlow }]}>
            <Text style={[lineupStyles.jersey, isFirst && { color: Colors.accent }]}>{p.jersey}</Text>
          </View>
          <Text style={lineupStyles.playerName}>{p.name}</Text>
          <Text style={lineupStyles.pos}>{p.pos}</Text>
        </View>
      ))}
    </View>
  );
}

const lineupStyles = StyleSheet.create({
  card: { width: 220, backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: Spacing.lg, marginRight: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.outlineVariant + '22' },
  cardActive: { borderTopColor: Colors.accent + '55' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  lineNum: { fontFamily: Fonts.headlineBold, fontSize: 22, color: Colors.subtext, fontStyle: 'italic' },
  typeBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  typeText: { fontFamily: Fonts.body, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  jerseyBox: { width: 32, height: 32, borderRadius: Radius.md, backgroundColor: Colors.cardHighest, alignItems: 'center', justifyContent: 'center' },
  jersey: { fontFamily: Fonts.headlineBold, fontSize: 11, color: Colors.text },
  playerName: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text, flex: 1 },
  pos: { fontFamily: Fonts.body, fontSize: 10, color: Colors.outline },
});

// ─── Mission Card ─────────────────────────────────────────────────────────────

function MissionCard({ m }: { m: PlayerMission }) {
  return (
    <View style={missionStyles.card}>
      {/* Accent bar */}
      <View style={[missionStyles.accentBar, { backgroundColor: m.accentColor }]} />
      <View style={missionStyles.top}>
        <View style={missionStyles.avatar}>
          <Text style={{ fontSize: 28 }}>🏒</Text>
          <View style={[missionStyles.jerseyBadge, { backgroundColor: m.accentColor }]}>
            <Text style={missionStyles.jerseyText}>{m.jersey}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={missionStyles.name}>{m.name}</Text>
          <Text style={[missionStyles.role, { color: m.roleColor }]}>{m.role}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={missionStyles.metricLabel}>{m.metric}</Text>
          <Text style={missionStyles.metricValue}>{m.metricValue}</Text>
        </View>
      </View>
      <View style={missionStyles.divider} />
      <Text style={missionStyles.desc}>{m.description}</Text>
    </View>
  );
}

const missionStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, overflow: 'hidden', position: 'relative' },
  accentBar: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 3 },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 48, height: 48, backgroundColor: Colors.cardHighest, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  jerseyBadge: { position: 'absolute', bottom: -4, right: -4, borderRadius: Radius.sm, paddingHorizontal: 4, paddingVertical: 1 },
  jerseyText: { fontFamily: Fonts.headlineBold, fontSize: 8, color: Colors.bg },
  name: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.text },
  role: { fontFamily: Fonts.body, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 },
  metricLabel: { fontFamily: Fonts.body, fontSize: 8, color: Colors.outline, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  metricValue: { fontFamily: Fonts.headlineBold, fontSize: 16, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.outlineVariant + '22', marginVertical: Spacing.md },
  desc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.subtext, lineHeight: 18 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScoutingScreen() {
  const [data] = useState<ScoutingData>(MOCK);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Opponent Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerMeta}>UPCOMING MATCHUP</Text>
          <Text style={styles.headerTitle}>{data.opponentName}</Text>
        </View>
        <View style={styles.systemBadge}>
          <Text style={styles.systemText}>{data.system}</Text>
          <Text style={styles.systemNote}>{data.systemNote}</Text>
        </View>
      </View>

      {/* ── Rink Heatmap ── */}
      <RinkViz />

      {/* ── Recommended Lineups ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended Lineups</Text>
        <Text style={styles.sectionBadge}>OPTIMIZED</Text>
      </View>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.lineupScroll}
        snapToInterval={236} decelerationRate="fast"
      >
        {data.lineups.map((l, i) => <LineupCard key={i} lineup={l} />)}
      </ScrollView>

      {/* ── Player Missions ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Key Player Missions</Text>
      </View>
      {data.missions.map((m, i) => <MissionCard key={i} m={m} />)}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: 56, paddingBottom: 24, gap: Spacing.xl },

  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },
  headerLeft: { gap: 2 },
  headerMeta: { fontFamily: Fonts.headline, fontSize: 9, letterSpacing: 3, color: Colors.outline, textTransform: 'uppercase' },
  headerTitle: { fontFamily: Fonts.headlineBold, fontSize: 32, color: Colors.text, letterSpacing: -1 },
  systemBadge: { backgroundColor: Colors.cardHighest, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6, borderLeftWidth: 2, borderLeftColor: Colors.accent, alignItems: 'flex-end', gap: 2 },
  systemText: { fontFamily: Fonts.headline, fontSize: 10, color: Colors.accent, letterSpacing: 1.5, textTransform: 'uppercase' },
  systemNote: { fontFamily: Fonts.body, fontSize: 9, color: Colors.outline, fontStyle: 'italic' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg },
  sectionTitle: { fontFamily: Fonts.headlineBold, fontSize: 13, color: Colors.text, letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionBadge: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.accent, letterSpacing: 2 },

  lineupScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 4 },
});
