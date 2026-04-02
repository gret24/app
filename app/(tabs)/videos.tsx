import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  FlatList, Linking, Alert,
} from 'react-native';
import { Colors } from '../../constants/Colors';

// API 베이스 — RunPod 서버
const API_BASE = 'http://localhost:8000';

type VideoType = 'fulltime' | 'highlight' | 'shifts';

interface ShiftItem {
  shift_number?: number;
  start_time: number;
  end_time: number;
  duration: number;
}

interface PlayerStats {
  jersey: string;
  team: string;
  total_ice_time_min: number;
  total_shifts: number;
  total_ice_time_sec: number;
}

const MOCK_PLAYERS: PlayerStats[] = [
  { jersey: '91', team: 'HOME', total_ice_time_min: 37.4, total_shifts: 3, total_ice_time_sec: 2244 },
  { jersey: '24', team: 'HOME', total_ice_time_min: 25.9, total_shifts: 21, total_ice_time_sec: 1554 },
  { jersey: '96', team: 'HOME', total_ice_time_min: 30.2, total_shifts: 18, total_ice_time_sec: 1812 },
  { jersey: '2',  team: 'HOME', total_ice_time_min: 20.7, total_shifts: 18, total_ice_time_sec: 1242 },
  { jersey: '21', team: 'HOME', total_ice_time_min: 24.6, total_shifts: 22, total_ice_time_sec: 1476 },
  { jersey: '5',  team: 'AWAY', total_ice_time_min: 18.0, total_shifts: 25, total_ice_time_sec: 1080 },
];

// 시간 포맷
const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function VideosScreen() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats>(MOCK_PLAYERS[0]);
  const [videoType, setVideoType] = useState<VideoType>('highlight');
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // mock 시프트 데이터 (game1 #91 기준)
  const MOCK_SHIFTS: ShiftItem[] = [
    { shift_number: 1, start_time: 109, end_time: 121, duration: 12 },
    { shift_number: 2, start_time: 136, end_time: 158, duration: 22 },
    { shift_number: 3, start_time: 203, end_time: 224, duration: 20 },
    { shift_number: 4, start_time: 243, end_time: 267, duration: 24 },
    { shift_number: 5, start_time: 306, end_time: 317, duration: 11 },
    { shift_number: 6, start_time: 321, end_time: 598, duration: 277 },
    { shift_number: 7, start_time: 601, end_time: 2469, duration: 1868 },
    { shift_number: 8, start_time: 2510, end_time: 2621, duration: 111 },
    { shift_number: 9, start_time: 2672, end_time: 2684, duration: 12 },
  ];

  const loadShifts = () => {
    setLoadingShifts(true);
    // 실제 API 호출 시 여기서 fetch
    setTimeout(() => {
      setShifts(MOCK_SHIFTS);
      setLoadingShifts(false);
    }, 500);
  };

  const handleDownload = (type: VideoType) => {
    const paths: Record<VideoType, string> = {
      fulltime:  `/video/workspace/iceiq/output/game1_${selectedPlayer.jersey}_fulltime.mp4`,
      highlight: `/video/workspace/iceiq/output/game1_${selectedPlayer.jersey}_highlight.mp4`,
      shifts:    `/video/workspace/iceiq/output/game1_${selectedPlayer.jersey}_highlight.mp4`,
    };
    const url = API_BASE + paths[type];
    Alert.alert('영상 스트리밍', `RunPod 서버에서 재생:\n#${selectedPlayer.jersey} ${type}`, [
      { text: '취소', style: 'cancel' },
      { text: '열기', onPress: () => Linking.openURL(url) },
    ]);
  };

  const VIDEO_OPTIONS: { type: VideoType; label: string; icon: string; desc: string }[] = [
    {
      type: 'highlight',
      label: 'Highlight Clips',
      icon: '🎬',
      desc: `감지된 출전 구간 클립 모음 • ${selectedPlayer.total_shifts}개 시프트`,
    },
    {
      type: 'fulltime',
      label: 'Fulltime Video',
      icon: '🏒',
      desc: `첫 등장~마지막 등장 전체 구간 • ${selectedPlayer.total_ice_time_min.toFixed(1)}분`,
    },
    {
      type: 'shifts',
      label: 'Ice Time Shifts',
      icon: '📋',
      desc: `시프트별 상세 타임스탬프 조회`,
    },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>🎥 Videos</Text>
        <Text style={styles.subtitle}>선수별 영상 다운로드 / 스트리밍</Text>
      </View>

      {/* 선수 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>선수 선택</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerScroll}>
          {MOCK_PLAYERS.map(p => (
            <Pressable
              key={p.jersey}
              style={[styles.playerCard, selectedPlayer.jersey === p.jersey && styles.playerCardActive]}
              onPress={() => { setSelectedPlayer(p); setShifts([]); }}
            >
              <Text style={styles.playerNum}>#{p.jersey}</Text>
              <Text style={styles.playerTeam}>{p.team}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 선수 스탯 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{selectedPlayer.total_ice_time_min.toFixed(1)}분</Text>
          <Text style={styles.statLbl}>아이스타임</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{selectedPlayer.total_shifts}</Text>
          <Text style={styles.statLbl}>시프트</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{fmtTime(selectedPlayer.total_ice_time_sec / selectedPlayer.total_shifts)}</Text>
          <Text style={styles.statLbl}>평균 시프트</Text>
        </View>
      </View>

      {/* 영상 옵션 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>영상 타입 선택</Text>
        <View style={styles.optionsGrid}>
          {VIDEO_OPTIONS.map(opt => (
            <Pressable
              key={opt.type}
              style={[styles.optionCard, videoType === opt.type && styles.optionCardActive]}
              onPress={() => { setVideoType(opt.type); if (opt.type === 'shifts') loadShifts(); }}
            >
              <Text style={styles.optionIcon}>{opt.icon}</Text>
              <Text style={[styles.optionLabel, videoType === opt.type && styles.optionLabelActive]}>
                {opt.label}
              </Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 액션 버튼 */}
      {videoType !== 'shifts' && (
        <Pressable
          style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.85 }]}
          onPress={() => handleDownload(videoType)}
        >
          <Text style={styles.playBtnText}>
            {videoType === 'highlight' ? '🎬 하이라이트 재생' : '🏒 풀타임 재생'}
          </Text>
        </Pressable>
      )}

      {/* 시프트 목록 */}
      {videoType === 'shifts' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            #{selectedPlayer.jersey} 시프트 목록
            {shifts.length > 0 ? ` (${shifts.length}개)` : ''}
          </Text>
          {loadingShifts ? (
            <Text style={styles.loadingText}>로딩 중...</Text>
          ) : shifts.length === 0 ? (
            <Pressable style={styles.loadBtn} onPress={loadShifts}>
              <Text style={styles.loadBtnText}>시프트 불러오기</Text>
            </Pressable>
          ) : (
            <View style={styles.shiftList}>
              {shifts.map((sh, i) => (
                <Pressable
                  key={i}
                  style={styles.shiftRow}
                  onPress={() => Alert.alert(
                    `Shift ${sh.shift_number}`,
                    `${fmtTime(sh.start_time)} ~ ${fmtTime(sh.end_time)}\n길이: ${sh.duration}초`,
                    [{ text: '확인' }]
                  )}
                >
                  <View style={styles.shiftNum}>
                    <Text style={styles.shiftNumText}>{sh.shift_number}</Text>
                  </View>
                  <View style={styles.shiftInfo}>
                    <Text style={styles.shiftTime}>
                      {fmtTime(sh.start_time)} ~ {fmtTime(sh.end_time)}
                    </Text>
                    <Text style={styles.shiftDur}>{sh.duration}초</Text>
                  </View>
                  <View style={[styles.shiftBar, { width: Math.min(sh.duration / 30 * 60, 80) }]} />
                </Pressable>
              ))}
            </View>
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
  header: { marginBottom: 24, gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.subtext },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.subtext, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  playerScroll: { flexDirection: 'row' },
  playerCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    marginRight: 10, alignItems: 'center', minWidth: 64,
    borderWidth: 1, borderColor: Colors.border,
  },
  playerCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  playerNum: { fontSize: 18, fontWeight: '800', color: Colors.text },
  playerTeam: { fontSize: 10, color: Colors.subtext, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  statLbl: { fontSize: 11, color: Colors.subtext, marginTop: 2 },
  optionsGrid: { gap: 10 },
  optionCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  optionCardActive: { borderColor: Colors.accent },
  optionIcon: { fontSize: 28 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  optionLabelActive: { color: Colors.accent },
  optionDesc: { fontSize: 12, color: Colors.subtext },
  playBtn: {
    height: 52, borderRadius: 12, backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  playBtnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
  loadingText: { color: Colors.subtext, textAlign: 'center', padding: 20 },
  loadBtn: {
    height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  loadBtnText: { color: Colors.accent, fontSize: 15, fontWeight: '600' },
  shiftList: { gap: 8 },
  shiftRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  shiftNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accent + '33', justifyContent: 'center', alignItems: 'center',
  },
  shiftNumText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  shiftInfo: { flex: 1 },
  shiftTime: { fontSize: 14, fontWeight: '600', color: Colors.text },
  shiftDur: { fontSize: 11, color: Colors.subtext },
  shiftBar: { height: 4, borderRadius: 2, backgroundColor: Colors.accent, opacity: 0.6 },
});
