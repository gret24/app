import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

interface PlayerStats {
  jersey: string;
  team: 'HOME' | 'AWAY';
  total_ice_time_min: number;
  total_shifts: number;
  total_ice_time_sec: number;
}

const MOCK_VIDEOS = [
  { id: 'game1_val', label: 'Game 1 — KAHL DIV4', duration: '44:34' },
  { id: 'game2_4fps', label: 'Game 2 — Bluewhales', duration: '52:05' },
  { id: 'aigis_g18', label: 'Aigis G18', duration: '64:00' },
];

const MOCK_PLAYERS: Record<string, PlayerStats[]> = {
  game1_val: [
    { jersey: '91', team: 'HOME', total_ice_time_min: 37.4, total_shifts: 3,  total_ice_time_sec: 2244 },
    { jersey: '24', team: 'HOME', total_ice_time_min: 25.9, total_shifts: 21, total_ice_time_sec: 1554 },
    { jersey: '96', team: 'HOME', total_ice_time_min: 30.2, total_shifts: 18, total_ice_time_sec: 1812 },
    { jersey: '2',  team: 'HOME', total_ice_time_min: 20.7, total_shifts: 18, total_ice_time_sec: 1242 },
    { jersey: '5',  team: 'AWAY', total_ice_time_min: 18.0, total_shifts: 25, total_ice_time_sec: 1080 },
    { jersey: '91', team: 'AWAY', total_ice_time_min: 39.2, total_shifts: 2,  total_ice_time_sec: 2352 },
    { jersey: '24', team: 'AWAY', total_ice_time_min: 38.0, total_shifts: 7,  total_ice_time_sec: 2280 },
  ],
  game2_4fps: [
    { jersey: '19', team: 'AWAY', total_ice_time_min: 8.1,  total_shifts: 11, total_ice_time_sec: 486 },
    { jersey: '40', team: 'HOME', total_ice_time_min: 12.3, total_shifts: 15, total_ice_time_sec: 738 },
    { jersey: '89', team: 'AWAY', total_ice_time_min: 6.5,  total_shifts: 8,  total_ice_time_sec: 390 },
  ],
  aigis_g18: [
    { jersey: '47', team: 'HOME', total_ice_time_min: 24.9, total_shifts: 41, total_ice_time_sec: 1494 },
  ],
};

const MAX_ICE_TIME = 45;

function RosterSection({
  side,
  players,
  onViewHighlights,
}: {
  side: 'HOME' | 'AWAY';
  players: PlayerStats[];
  onViewHighlights: (p: PlayerStats) => void;
}) {
  const color = side === 'HOME' ? Colors.accent : '#FF6644';
  const bgColor = side === 'HOME' ? '#00D4FF33' : '#FF664433';
  const sorted = [...players].sort((a, b) => b.total_ice_time_min - a.total_ice_time_min);

  return (
    <View style={styles.rosterSection}>
      <View style={[styles.rosterHeader, { borderLeftColor: color }]}>
        <Text style={styles.rosterHeaderIcon}>{side === 'HOME' ? '🏠' : '✈️'}</Text>
        <Text style={[styles.rosterHeaderTitle, { color }]}>{side} TEAM</Text>
        <Text style={styles.rosterHeaderCount}>{players.length} players</Text>
      </View>

      <View style={styles.rosterList}>
        {sorted.map((p, i) => (
          <View key={i} style={styles.playerCard}>
            <View style={[styles.jerseyBadge, { backgroundColor: bgColor }]}>
              <Text style={[styles.jerseyNum, { color }]}>#{p.jersey}</Text>
            </View>

            <View style={styles.playerInfo}>
              <View style={styles.playerInfoRow}>
                <Text style={styles.playerIceTime}>{p.total_ice_time_min.toFixed(1)} min</Text>
                <Text style={styles.playerShifts}>{p.total_shifts} shifts</Text>
              </View>
              <View style={styles.iceBar}>
                <View
                  style={[
                    styles.iceBarFill,
                    {
                      width: `${Math.min(p.total_ice_time_min / MAX_ICE_TIME * 100, 100)}%` as any,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            </View>

            <Pressable
              style={[styles.highlightBtn, { borderColor: color }]}
              onPress={() => onViewHighlights(p)}
            >
              <Text style={[styles.highlightBtnText, { color }]}>🎬</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function TeamAnalysisScreen() {
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<typeof MOCK_VIDEOS[0] | null>(null);

  const players = selectedVideo ? (MOCK_PLAYERS[selectedVideo.id] || []) : [];
  const homePlayers = players.filter(p => p.team === 'HOME');
  const awayPlayers = players.filter(p => p.team === 'AWAY');

  const handleViewHighlights = (player: PlayerStats) => {
    router.push('/(player)');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>🏟️ Team Analysis</Text>
      </View>

      {/* Video Selector */}
      {!selectedVideo ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>분석 영상 선택</Text>
          <View style={styles.videoList}>
            {MOCK_VIDEOS.map(v => {
              const vPlayers = MOCK_PLAYERS[v.id] || [];
              const homeCount = vPlayers.filter(p => p.team === 'HOME').length;
              const awayCount = vPlayers.filter(p => p.team === 'AWAY').length;
              return (
                <Pressable
                  key={v.id}
                  style={styles.videoCard}
                  onPress={() => setSelectedVideo(v)}
                >
                  <View style={styles.videoThumb}>
                    <Text style={{ fontSize: 28 }}>🏟️</Text>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoLabel}>{v.label}</Text>
                    <Text style={styles.videoDur}>{v.duration}</Text>
                    <View style={styles.videoTeamCounts}>
                      <Text style={styles.homeCount}>HOME {homeCount}명</Text>
                      <Text style={styles.awayCount}>AWAY {awayCount}명</Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          {/* Selected Game Header */}
          <View style={styles.gameHeader}>
            <View style={styles.gameHeaderInfo}>
              <Text style={styles.gameHeaderLabel}>분석 중</Text>
              <Text style={styles.gameHeaderTitle}>{selectedVideo.label}</Text>
              <Text style={styles.gameHeaderDur}>{selectedVideo.duration}</Text>
            </View>
            <Pressable
              onPress={() => setSelectedVideo(null)}
              style={styles.changeBtn}
            >
              <Text style={styles.changeBtnText}>변경</Text>
            </Pressable>
          </View>

          {/* Team Stats Summary */}
          <View style={styles.teamSummary}>
            <View style={styles.teamSummaryItem}>
              <Text style={[styles.teamSummaryLabel, { color: Colors.accent }]}>🏠 HOME</Text>
              <Text style={styles.teamSummaryCount}>{homePlayers.length} players</Text>
            </View>
            <View style={styles.teamSummaryDivider} />
            <View style={styles.teamSummaryItem}>
              <Text style={[styles.teamSummaryLabel, { color: '#FF6644' }]}>✈️ AWAY</Text>
              <Text style={styles.teamSummaryCount}>{awayPlayers.length} players</Text>
            </View>
          </View>

          {/* Rosters */}
          {homePlayers.length > 0 && (
            <RosterSection
              side="HOME"
              players={homePlayers}
              onViewHighlights={handleViewHighlights}
            />
          )}
          {awayPlayers.length > 0 && (
            <RosterSection
              side="AWAY"
              players={awayPlayers}
              onViewHighlights={handleViewHighlights}
            />
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 24 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 16, color: Colors.accent, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text },
  section: { gap: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.subtext, letterSpacing: 0.8, textTransform: 'uppercase' },
  videoList: { gap: 10 },
  videoCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12 },
  videoThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center' },
  videoInfo: { flex: 1, gap: 4 },
  videoLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  videoDur: { fontSize: 12, color: Colors.subtext },
  videoTeamCounts: { flexDirection: 'row', gap: 10 },
  homeCount: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
  awayCount: { fontSize: 11, color: '#FF6644', fontWeight: '600' },
  chevron: { fontSize: 22, color: Colors.subtext },
  gameHeader: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12 },
  gameHeaderInfo: { flex: 1, gap: 2 },
  gameHeaderLabel: { fontSize: 11, fontWeight: '700', color: Colors.subtext, textTransform: 'uppercase', letterSpacing: 0.6 },
  gameHeaderTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  gameHeaderDur: { fontSize: 12, color: Colors.subtext },
  changeBtn: { backgroundColor: Colors.input, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  changeBtnText: { fontSize: 13, color: Colors.subtext, fontWeight: '600' },
  teamSummary: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  teamSummaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  teamSummaryLabel: { fontSize: 14, fontWeight: '800' },
  teamSummaryCount: { fontSize: 13, color: Colors.subtext },
  teamSummaryDivider: { width: 1, backgroundColor: Colors.border },
  rosterSection: { gap: 10 },
  rosterHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 3, paddingLeft: 10 },
  rosterHeaderIcon: { fontSize: 18 },
  rosterHeaderTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  rosterHeaderCount: { fontSize: 12, color: Colors.subtext },
  rosterList: { gap: 8 },
  playerCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 10 },
  jerseyBadge: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  jerseyNum: { fontSize: 16, fontWeight: '800' },
  playerInfo: { flex: 1, gap: 6 },
  playerInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  playerIceTime: { fontSize: 14, fontWeight: '700', color: Colors.text },
  playerShifts: { fontSize: 12, color: Colors.subtext },
  iceBar: { height: 4, backgroundColor: Colors.input, borderRadius: 2, overflow: 'hidden' },
  iceBarFill: { height: '100%', borderRadius: 2 },
  highlightBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  highlightBtnText: { fontSize: 16 },
});
