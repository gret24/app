import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Linking, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useRoster } from '../../contexts/RosterContext';
import PlayerForm from '../../components/PlayerForm';
import IceTimeDiagram from '../../components/IceTimeDiagram';

const API_BASE = 'http://localhost:8000';

type VideoType = 'highlight' | 'fulltime' | 'shifts';
type TeamFilter = 'ALL' | 'HOME' | 'AWAY';

interface PlayerStats {
  jersey: string;
  team: string;
  total_ice_time_min: number;
  total_shifts: number;
  total_ice_time_sec: number;
}

interface ShiftItem {
  shift_number?: number;
  start_time: number;
  end_time: number;
  duration: number;
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

const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function PlayerAnalysisScreen() {
  const router = useRouter();
  const { players: rosterPlayers, addPlayer } = useRoster();
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedVideo, setSelectedVideo] = useState<typeof MOCK_VIDEOS[0] | null>(null);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [videoType, setVideoType] = useState<VideoType>('highlight');
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  const players = selectedVideo ? (MOCK_PLAYERS[selectedVideo.id] || []) : [];
  const filteredPlayers = players.filter(p =>
    teamFilter === 'ALL' || p.team === teamFilter
  );

  const loadShifts = () => {
    setLoadingShifts(true);
    setTimeout(() => {
      setShifts([
        { shift_number: 1, start_time: 109,  end_time: 121,  duration: 12 },
        { shift_number: 2, start_time: 136,  end_time: 158,  duration: 22 },
        { shift_number: 3, start_time: 203,  end_time: 224,  duration: 20 },
        { shift_number: 4, start_time: 243,  end_time: 267,  duration: 24 },
        { shift_number: 5, start_time: 306,  end_time: 317,  duration: 11 },
        { shift_number: 6, start_time: 321,  end_time: 598,  duration: 277 },
        { shift_number: 7, start_time: 601,  end_time: 2469, duration: 1868 },
        { shift_number: 8, start_time: 2510, end_time: 2621, duration: 111 },
        { shift_number: 9, start_time: 2672, end_time: 2684, duration: 12 },
      ]);
      setLoadingShifts(false);
    }, 600);
  };

  const handlePlay = () => {
    if (!selectedVideo || !selectedPlayer) return;
    const path = videoType === 'fulltime'
      ? `/video/workspace/iceiq/output/${selectedVideo.id}_${selectedPlayer.jersey}_fulltime.mp4`
      : `/video/workspace/iceiq/output/${selectedVideo.id}_${selectedPlayer.jersey}_highlight.mp4`;
    Alert.alert(
      `#${selectedPlayer.jersey} ${videoType === 'fulltime' ? 'Fulltime' : 'Highlight'}`,
      `RunPod 서버에서 스트리밍\n${selectedVideo.label}`,
      [
        { text: '취소', style: 'cancel' },
        { text: '재생', onPress: () => Linking.openURL(API_BASE + path) },
      ]
    );
  };

  const reset = () => {
    setStep(1); setSelectedVideo(null);
    setSelectedPlayer(null); setShifts([]);
    setTeamFilter('ALL');
  };

  return (
    <>
    <PlayerForm
      visible={showForm}
      onClose={() => setShowForm(false)}
      onSave={(p) => { addPlayer(p); setShowForm(false); }}
    />
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Text style={styles.title}>🏒 Player Analysis</Text>
          {step > 1 && (
            <Pressable onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetText}>처음부터</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 브레드크럼 */}
      <View style={styles.breadcrumb}>
        {['영상', '팀', '선수', '옵션'].map((label, i) => (
          <View key={i} style={styles.breadcrumbItem}>
            <View style={[styles.breadcrumbDot, step > i && styles.breadcrumbDotActive]}>
              <Text style={styles.breadcrumbNum}>{i + 1}</Text>
            </View>
            <Text style={[styles.breadcrumbLabel, step > i && styles.breadcrumbLabelActive]}>
              {label}
            </Text>
            {i < 3 && <View style={[styles.breadcrumbLine, step > i + 1 && styles.breadcrumbLineActive]} />}
          </View>
        ))}
      </View>

      {/* STEP 1: 영상 선택 */}
      {step === 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>분석 영상 선택</Text>
          <View style={styles.videoList}>
            {MOCK_VIDEOS.map(v => (
              <Pressable
                key={v.id}
                style={styles.videoCard}
                onPress={() => { setSelectedVideo(v); setStep(2); }}
              >
                <View style={styles.videoThumb}>
                  <Text style={{ fontSize: 28 }}>🏒</Text>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoLabel}>{v.label}</Text>
                  <Text style={styles.videoDur}>{v.duration}</Text>
                  <Text style={styles.playerCount}>
                    {(MOCK_PLAYERS[v.id] || []).length}명 감지됨
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* STEP 2: 팀 선택 */}
      {step === 2 && selectedVideo && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{selectedVideo.label}</Text>
          <Text style={styles.stepTitle}>팀 선택</Text>
          <View style={styles.teamRow}>
            {(['ALL', 'HOME', 'AWAY'] as TeamFilter[]).map(t => (
              <Pressable
                key={t}
                style={[styles.teamCard, teamFilter === t && styles.teamCardActive]}
                onPress={() => { setTeamFilter(t); setStep(3); }}
              >
                <Text style={styles.teamIcon}>
                  {t === 'ALL' ? '🏟️' : t === 'HOME' ? '🏠' : '✈️'}
                </Text>
                <Text style={[styles.teamLabel, teamFilter === t && styles.teamLabelActive]}>
                  {t === 'ALL' ? '전체' : t}
                </Text>
                <Text style={styles.teamCount}>
                  {t === 'ALL'
                    ? players.length
                    : players.filter(p => p.team === t).length}명
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* STEP 3: 선수 선택 */}
      {step === 3 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionLabel}>
                {selectedVideo?.label} · {teamFilter === 'ALL' ? '전체' : teamFilter}
              </Text>
              <Text style={styles.stepTitle}>선수 선택</Text>
            </View>
            <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>+ 선수 등록</Text>
            </Pressable>
          </View>

          {/* 로스터 등록 선수 미리보기 */}
          {rosterPlayers.length > 0 && (
            <View style={styles.rosterPreview}>
              <Text style={styles.rosterLabel}>📋 등록된 선수 ({rosterPlayers.length}명)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {rosterPlayers.filter(p => teamFilter === 'ALL' || p.team === teamFilter).map(p => (
                  <Pressable
                    key={p.id}
                    style={styles.rosterChip}
                    onPress={() => {
                      setSelectedPlayer({
                        jersey: p.jersey, team: p.team,
                        total_ice_time_min: 0, total_shifts: 0, total_ice_time_sec: 0,
                      });
                      setStep(4);
                    }}
                  >
                    <Text style={styles.rosterChipNum}>#{p.jersey}</Text>
                    <Text style={styles.rosterChipName}>{p.name}</Text>
                    <Text style={styles.rosterChipPos}>{p.position}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.playerList}>
            {filteredPlayers
              .sort((a, b) => b.total_ice_time_min - a.total_ice_time_min)
              .map((p, i) => (
                <Pressable
                  key={i}
                  style={styles.playerRow}
                  onPress={() => { setSelectedPlayer(p); setStep(4); }}
                >
                  <View style={[styles.jerseyBadge,
                    { backgroundColor: p.team === 'HOME' ? '#00D4FF33' : '#FF664433' }]}>
                    <Text style={[styles.jerseyNum,
                      { color: p.team === 'HOME' ? Colors.accent : '#FF6644' }]}>
                      #{p.jersey}
                    </Text>
                  </View>
                  <View style={styles.playerRowInfo}>
                    <Text style={styles.playerRowTeam}>{p.team}</Text>
                    <Text style={styles.playerRowIce}>{p.total_ice_time_min.toFixed(1)}분 · {p.total_shifts}시프트</Text>
                  </View>
                  <View style={styles.iceBar}>
                    <View style={[styles.iceBarFill, {
                      width: `${Math.min(p.total_ice_time_min / 45 * 100, 100)}%` as any,
                      backgroundColor: p.team === 'HOME' ? Colors.accent : '#FF6644',
                    }]} />
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
          </View>
        </View>
      )}

      {/* STEP 4: 영상 옵션 */}
      {step === 4 && selectedPlayer && (
        <View style={styles.section}>
          <View style={styles.selectedSummary}>
            <View style={[styles.jerseyBadgeLg,
              { backgroundColor: selectedPlayer.team === 'HOME' ? '#00D4FF33' : '#FF664433' }]}>
              <Text style={[styles.jerseyNumLg,
                { color: selectedPlayer.team === 'HOME' ? Colors.accent : '#FF6644' }]}>
                #{selectedPlayer.jersey}
              </Text>
            </View>
            <View style={{ gap: 2 }}>
              <Text style={styles.summaryName}>{selectedPlayer.team} · #{selectedPlayer.jersey}</Text>
              <Text style={styles.summaryStats}>
                {selectedPlayer.total_ice_time_min.toFixed(1)}분 · {selectedPlayer.total_shifts}시프트
              </Text>
            </View>
          </View>

          <Text style={styles.stepTitle}>영상 타입</Text>
          <View style={styles.optionList}>
            {[
              { type: 'highlight' as VideoType, icon: '🎬', label: 'Highlight Clips',
                desc: `감지 구간 클립 · ${selectedPlayer.total_shifts}개 시프트` },
              { type: 'fulltime' as VideoType, icon: '🏒', label: 'Fulltime Video',
                desc: `첫~마지막 등장 전체 · ${selectedPlayer.total_ice_time_min.toFixed(1)}분` },
              { type: 'shifts' as VideoType, icon: '📋', label: 'Ice Time Shifts',
                desc: '시프트별 타임스탬프 조회' },
            ].map(opt => (
              <Pressable
                key={opt.type}
                style={[styles.optionCard, videoType === opt.type && styles.optionCardActive]}
                onPress={() => { setVideoType(opt.type); if (opt.type === 'shifts') loadShifts(); }}
              >
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, videoType === opt.type && { color: Colors.accent }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                {videoType === opt.type && <Text style={{ color: Colors.accent, fontSize: 18 }}>✓</Text>}
              </Pressable>
            ))}
          </View>

          {videoType !== 'shifts' && (
            <Pressable style={styles.playBtn} onPress={handlePlay}>
              <Text style={styles.playBtnText}>
                {videoType === 'highlight' ? '🎬 하이라이트 재생' : '🏒 풀타임 재생'}
              </Text>
            </Pressable>
          )}

          {videoType === 'shifts' && (
            <View style={{ marginTop: 12, gap: 12 }}>
              {loadingShifts ? (
                <ActivityIndicator color={Colors.accent} style={{ padding: 20 }} />
              ) : shifts.length === 0 ? (
                <Pressable style={styles.loadBtn} onPress={loadShifts}>
                  <Text style={styles.loadBtnText}>시프트 불러오기</Text>
                </Pressable>
              ) : (
                <>
                {/* 아이스타임 다이어그램 */}
                <IceTimeDiagram
                  shifts={shifts}
                  playerJersey={selectedPlayer?.jersey ?? ''}
                  playerTeam={selectedPlayer?.team as 'HOME' | 'AWAY'}
                  autoPlay={true}
                />
                <View style={styles.shiftList}>
                  {shifts.map((sh, i) => (
                    <View key={i} style={styles.shiftRow}>
                      <View style={styles.shiftNum}>
                        <Text style={styles.shiftNumText}>{sh.shift_number}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shiftTime}>
                          {fmtTime(sh.start_time)} → {fmtTime(sh.end_time)}
                        </Text>
                        <Text style={styles.shiftDur}>{sh.duration}초</Text>
                      </View>
                      <View style={[styles.shiftBar, {
                        width: Math.min(sh.duration / 30 * 50, 80),
                      }]} />
                    </View>
                  ))}
                </View>
                </>
              )}
            </View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 8 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 16, color: Colors.accent, fontWeight: '600' },
  headerRight: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text },
  resetBtn: { backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  resetText: { color: Colors.subtext, fontSize: 13 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breadcrumbDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  breadcrumbDotActive: { backgroundColor: Colors.accent + '33', borderColor: Colors.accent },
  breadcrumbNum: { fontSize: 11, fontWeight: '700', color: Colors.subtext },
  breadcrumbLabel: { fontSize: 11, color: Colors.subtext },
  breadcrumbLabelActive: { color: Colors.accent },
  breadcrumbLine: { width: 20, height: 1, backgroundColor: Colors.border, marginHorizontal: 4 },
  breadcrumbLineActive: { backgroundColor: Colors.accent },
  section: {},
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.subtext, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  videoList: { gap: 10 },
  videoCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12 },
  videoThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center' },
  videoInfo: { flex: 1, gap: 2 },
  videoLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  videoDur: { fontSize: 12, color: Colors.subtext },
  playerCount: { fontSize: 11, color: Colors.accent },
  chevron: { fontSize: 22, color: Colors.subtext },
  teamRow: { flexDirection: 'row', gap: 10 },
  teamCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 6 },
  teamCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  teamIcon: { fontSize: 28 },
  teamLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  teamLabelActive: { color: Colors.accent },
  teamCount: { fontSize: 12, color: Colors.subtext },
  playerList: { gap: 8 },
  playerRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 10 },
  jerseyBadge: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  jerseyNum: { fontSize: 16, fontWeight: '800' },
  playerRowInfo: { flex: 1 },
  playerRowTeam: { fontSize: 11, color: Colors.subtext, fontWeight: '600' },
  playerRowIce: { fontSize: 14, fontWeight: '700', color: Colors.text },
  iceBar: { width: 60, height: 4, backgroundColor: Colors.input, borderRadius: 2, overflow: 'hidden' },
  iceBarFill: { height: '100%', borderRadius: 2 },
  selectedSummary: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  jerseyBadgeLg: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  jerseyNumLg: { fontSize: 22, fontWeight: '900' },
  summaryName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  summaryStats: { fontSize: 13, color: Colors.subtext },
  optionList: { gap: 10 },
  optionCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12 },
  optionCardActive: { borderColor: Colors.accent },
  optionIcon: { fontSize: 26 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  optionDesc: { fontSize: 12, color: Colors.subtext, marginTop: 2 },
  playBtn: { height: 52, borderRadius: 12, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  playBtnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
  loadBtn: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  loadBtnText: { color: Colors.accent, fontSize: 15, fontWeight: '600' },
  shiftList: { gap: 8 },
  shiftRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 10 },
  shiftNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accent + '22', justifyContent: 'center', alignItems: 'center' },
  shiftNumText: { fontSize: 12, fontWeight: '700', color: Colors.accent },
  shiftTime: { fontSize: 13, fontWeight: '600', color: Colors.text },
  shiftDur: { fontSize: 11, color: Colors.subtext },
  shiftBar: { height: 4, borderRadius: 2, backgroundColor: Colors.accent, opacity: 0.5 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  addBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: Colors.bg, fontSize: 13, fontWeight: '700' },
  rosterPreview: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  rosterLabel: { fontSize: 12, color: Colors.subtext, fontWeight: '600', marginBottom: 8 },
  rosterChip: { backgroundColor: Colors.input, borderRadius: 10, padding: 10, marginRight: 8, alignItems: 'center', minWidth: 72, borderWidth: 1, borderColor: Colors.border },
  rosterChipNum: { fontSize: 16, fontWeight: '800', color: Colors.accent },
  rosterChipName: { fontSize: 10, color: Colors.text, marginTop: 2 },
  rosterChipPos: { fontSize: 10, color: Colors.subtext },
});
