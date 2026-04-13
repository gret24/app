import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, ActivityIndicator, TextInput, Animated, Modal, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { JERSEY_PALETTE } from '../../constants/jerseyPalette';
import { useRoster } from '../../contexts/RosterContext';
import PlayerForm from '../../components/PlayerForm';
import IceTimeDiagram from '../../components/IceTimeDiagram';
import PlayerTracker, { TeamRosterList } from '../../components/PlayerTracker';
import { RinkSVG } from '../../components/TacticsAnimator';
import { getAllTracks, getAllPlayersAtTime } from '../../api/trackingService';
import * as ImagePicker from 'expo-image-picker';
import { uploadAndAnalyze, waitForAnalysis, getPlayers, getReport } from '../../api/analysisService';
import { generateHighlight, getVideoStreamUrl } from '../../api/highlightService';
import { apiPost } from '../../api/client';
import { API_BASE_URL } from '../../api/config';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useAuth } from '../../contexts/AuthContext';
import { addGame, getGames, updateGame, deleteGame, type GameRecord } from '../../api/gamesService';
import BenchSetupScreen, { BenchConfig } from '../../components/BenchSetupScreen';
import HeatmapView from '../../components/HeatmapView';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
type ViewMode = 'video' | 'diagram' | 'heatmap';
type LabelFilter = 'ALL' | 'HOME' | 'AWAY' | 'OFF';

type AppStep = 'input' | 'analyzing' | 'select_player' | 'select_option';
type VideoType = 'highlight' | 'fulltime' | 'shifts';
type TeamFilter = 'ALL' | 'HOME' | 'AWAY';

interface PlayerStats {
  jersey: string;
  team: string;
  name?: string;
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

const fmtTime = (sec: number) => `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;

export default function PlayerAnalysisScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { players: rosterPlayers, addPlayer } = useRoster();
  const [showForm, setShowForm] = useState(false);

  // 내 게임 목록
  const [myGames, setMyGames] = useState<GameRecord[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  // 분석 흐름
  const [step, setStep] = useState<AppStep>('input');
  const [url, setUrl] = useState('');
  const [homeRoster, setHomeRoster] = useState(''); // "4,14,47,94"
  const [awayRoster, setAwayRoster] = useState('');
  const [showRoster, setShowRoster] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showBenchSetup, setShowBenchSetup] = useState(false);
  const [benchConfig, setBenchConfig] = useState<BenchConfig | null>(null);
  const [homeJerseyHex, setHomeJerseyHex] = useState<string | undefined>(undefined);
  const [awayJerseyHex, setAwayJerseyHex] = useState<string | undefined>(undefined);
  const [rosterForAnalysis, setRosterForAnalysis] = useState<{
    jersey: string; name: string; team: 'HOME' | 'AWAY';
  }[]>([]);
  const [videoStem, setVideoStem] = useState('');
  const [videoPath, setVideoPath] = useState(''); // 업로드된 영상 경로
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 선수 선택
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);

  // 옵션
  const [videoType, setVideoType] = useState<VideoType>('highlight');
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [generatingHL, setGeneratingHL] = useState(false);
  // 비디오 플레이어
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  // View mode toggle (video ↔ diagram)
  const [viewMode, setViewMode] = useState<ViewMode>('video');
  const [playbackTimeMs, setPlaybackTimeMs] = useState(0);
  const [labelFilter, setLabelFilter] = useState<LabelFilter>('ALL');
  const [diagramDetections, setDiagramDetections] = useState<any[]>([]);

  // 게임 목록 로드
  useEffect(() => {
    if (!user?.uid) { setLoadingGames(false); return; }
    getGames(user.uid).then(games => {
      setMyGames(games);
      setLoadingGames(false);
    }).catch(() => setLoadingGames(false));
  }, [user?.uid]);

  useEffect(() => {
    if (rosterPlayers.length > 0) {
      const p = rosterPlayers[0];
      setRosterForAnalysis([{ jersey: p.jersey, name: p.name, team: p.team }]);
    }
  }, [rosterPlayers]);

  const handleDeleteGame = (game: GameRecord) => {
    Alert.alert(
      "기록 삭제",
      `"${game.title}" 기록을 삭제할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제", style: "destructive",
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await deleteGame(user.uid, game.id!);
              setMyGames(prev => prev.filter(g => g.id !== game.id));
            } catch { Alert.alert("오류", "삭제 실패"); }
          }
        }
      ]
    );
  };

  const animateProgress = (to: number) => {
    Animated.timing(progressAnim, { toValue: to, duration: 400, useNativeDriver: false }).start();
    setProgress(to);
  };

  const barWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  // 갤러리에서 영상 선택
  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '갤러리 접근 권한이 필요해요'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 1,
    });
    if (!res.canceled && res.assets[0]) {
      setUrl(res.assets[0].uri);
    }
  };

  // 분석 시작
  const startAnalysis = async (homeR?: string, awayR?: string, benchCfg?: BenchConfig | null) => {
    const input = url.trim();
    if (!input) { Alert.alert('오류', 'YouTube URL 또는 영상을 선택해주세요'); return; }

    const finalHomeRoster = homeR ?? homeRoster;
    const finalAwayRoster = awayR ?? awayRoster;

    setStep('analyzing');
    animateProgress(5);
    setProgressMsg('분석 요청 중...');

    try {
      let job_id: string, stem: string, vpath: string = '';

      const isYouTube = input.includes('youtube.com') || input.includes('youtu.be');
      const isFile = input.startsWith('file://') || input.startsWith('/');

      if (isYouTube) {
        setProgressMsg('YouTube 영상 다운로드 중...');
        animateProgress(10);
        const res = await apiPost<{ job_id: string; video_stem: string }>('/analyze/url', {
          youtube_url: input, fps: 4,
          home_roster: finalHomeRoster,
          away_roster: finalAwayRoster,
          home_jersey_hex: homeJerseyHex ?? '',
          away_jersey_hex: awayJerseyHex ?? '',
          bench_config: benchCfg ?? null,
        });
        job_id = res.job_id; stem = res.video_stem;
      } else if (isFile) {
        setProgressMsg('영상 업로드 중...');
        animateProgress(10);
        const filename = input.split('/').pop() || 'video.mp4';
        const res = await uploadAndAnalyze(input, filename, { fps: 4, home_roster: finalHomeRoster, away_roster: finalAwayRoster });
        job_id = res.job_id; stem = res.video_stem;
        vpath = input;
      } else {
        // 경로 기반 (서버에 있는 영상)
        const res = await apiPost<{ job_id: string; video_stem: string }>('/analyze', {
          video_path: input, fps: 4,
        });
        job_id = res.job_id; stem = res.video_stem;
        vpath = input;
      }

      setVideoStem(stem);
      // YouTube: 서버에 다운된 실제 경로 사용
      const serverVideoPath = vpath || `/root/iceiq/videos/${stem}/${stem}.mp4`;
      setVideoPath(serverVideoPath);
      // Firestore에 게임 저장
      if (user?.uid) {
        const gid = await addGame(user.uid, {
          videoStem: stem,
          title: input.includes('youtube') ? `YouTube - ${stem}` : stem,
          youtubeUrl: input.includes('youtube') ? input : undefined,
          status: 'analyzing',
        });
        setCurrentGameId(gid);
      }
      animateProgress(20);
      setProgressMsg('AI 분석 중...');

      // 폴링
      await waitForAnalysis(job_id, (status) => {
        setProgressMsg(status.message);
        animateProgress(Math.max(20, Math.min(92, status.progress)));
      });

      animateProgress(100);
      setProgressMsg('분석 완료!');

      // 선수 목록 로드
      const data = await getPlayers(stem);
      const mapped = data.players.map(p => ({
        jersey: p.jersey,
        team: Object.keys(p.teams ?? {})[0] ?? 'HOME',
        total_ice_time_min: 0,
        total_shifts: 0,
        total_ice_time_sec: 0,
      }));
      // 리포트로 아이스타임 채우기
      try {
        const report = await getReport(stem);
        const merged = mapped
          .filter(p => {
            // roster에 등록된 선수만 표시 (등록된 게 없으면 전체 표시)
            if (rosterForAnalysis.length === 0) return true;
            return rosterForAnalysis.some(r => r.jersey === p.jersey);
          })
          .map(p => {
            const rp = report.players.find(r => r.jersey === p.jersey && r.team === p.team);
            const rosterEntry = rosterForAnalysis.find(r => r.jersey === p.jersey && r.team === p.team)
                          ?? rosterForAnalysis.find(r => r.jersey === p.jersey);
            return {
              ...(rp ? { ...p, total_ice_time_min: rp.total_ice_time_min, total_shifts: rp.total_shifts, total_ice_time_sec: rp.total_ice_time_sec } : p),
              name: rosterEntry?.name || '',
              team: (rosterEntry?.team ?? p.team) as 'HOME' | 'AWAY',
            };
          });
        setPlayers(merged.sort((a, b) => b.total_ice_time_min - a.total_ice_time_min));
      } catch {
        setPlayers(mapped);
      }
      // 게임 상태 완료로 업데이트
      if (user?.uid && currentGameId) {
        updateGame(user.uid, currentGameId, {
          status: 'done',
          playerCount: players.length,
        }).catch(() => {});
      }
      // 게임 목록 갱신
      if (user?.uid) getGames(user.uid).then(setMyGames).catch(() => {});
      setStep('select_player');
    } catch (e: any) {
      Alert.alert('분석 실패', e.message || '서버 연결을 확인해주세요');
      setStep('input');
    }
  };

  const loadShifts = () => {
    setLoadingShifts(true);
    setTimeout(() => {
      setShifts([
        { shift_number: 1, start_time: 109, end_time: 121, duration: 12 },
        { shift_number: 2, start_time: 203, end_time: 230, duration: 27 },
        { shift_number: 3, start_time: 400, end_time: 445, duration: 45 },
        { shift_number: 4, start_time: 700, end_time: 762, duration: 62 },
        { shift_number: 5, start_time: 1100, end_time: 1155, duration: 55 },
      ]);
      setLoadingShifts(false);
    }, 600);
  };

  const handlePlay = async () => {
    if (!selectedPlayer || !videoStem) return;
    if (videoType === 'shifts') { loadShifts(); return; }

    setGeneratingHL(true);
    try {
      // 풀타임: 선수 전체 구간 하이라이트로 생성 (gap 크게 → 거의 풀타임)
      if (videoType === 'fulltime') {
        const result = await generateHighlight(
          videoPath, videoStem, selectedPlayer.jersey,
          { gap: 300, buf: 10 }
        );
        const streamUrl = getVideoStreamUrl(result.file_path);
        setPlayerUrl(streamUrl);
        setShowPlayer(true);
        setGeneratingHL(false);
        return;
      }
      // 하이라이트: 서버에서 생성 후 재생
      const result = await generateHighlight(
        videoPath, videoStem, selectedPlayer.jersey,
        { gap: 30, buf: 5 }
      );
      const streamUrl = getVideoStreamUrl(result.file_path);
      setPlayerUrl(streamUrl);
      setShowPlayer(true);
    } catch (e: any) {
      Alert.alert('오류', e.message || '영상 생성 실패');
    } finally {
      setGeneratingHL(false);
    }
  };

  const reset = () => {
    setStep('input'); setUrl(''); setVideoStem(''); setVideoPath('');
    setProgress(0); setProgressMsg(''); setPlayers([]);
    setSelectedPlayer(null); setShifts([]);
    setHomeJerseyHex(undefined); setAwayJerseyHex(undefined);
    progressAnim.setValue(0);
  };

  const filteredPlayers = players.filter(p => teamFilter === 'ALL' || p.team === teamFilter);

  // ── STEP 1: 입력 ──────────────────────────────────────────
  if (step === 'input') return (
    <>
      <PlayerForm visible={showForm} onClose={() => setShowForm(false)}
        onSave={(p) => { addPlayer(p); setShowForm(false); }} />

      {/* Roster 확인 Modal */}
      <Modal visible={showRosterModal} animationType="slide" onRequestClose={() => setShowRosterModal(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.bg }}>
          <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.text }}>📋 내 선수 확인</Text>
            <Pressable onPress={() => setShowRosterModal(false)}><Text style={{ color: Colors.subtext }}>취소</Text></Pressable>
          </View>
          <Text style={{ paddingHorizontal: 20, color: Colors.subtext, marginBottom: 12 }}>번호, 이름, 팀을 확인하고 분석을 시작하세요</Text>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
            {/* 저지 색상 선택 */}
            <View style={{ marginBottom: 16, gap: 12 }}>
              <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 15 }}>저지 색상 선택</Text>
              {/* 홈팀 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: Colors.accent, fontWeight: '700', width: 60 }}>🏠 홈팀</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {JERSEY_PALETTE.map(p => (
                      <Pressable
                        key={p.name}
                        onPress={() => setHomeJerseyHex(p.hex)}
                        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.hex, borderWidth: 2, borderColor: homeJerseyHex === p.hex ? Colors.accent : Colors.border }}
                      />
                    ))}
                  </View>
                </ScrollView>
                {homeJerseyHex && <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: homeJerseyHex }} />}
              </View>
              {/* 어웨이팀 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: '#FF3B30', fontWeight: '700', width: 60 }}>✈️ 어웨이</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {JERSEY_PALETTE.map(p => (
                      <Pressable
                        key={p.name}
                        onPress={() => setAwayJerseyHex(p.hex)}
                        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.hex, borderWidth: 2, borderColor: awayJerseyHex === p.hex ? '#FF3B30' : Colors.border }}
                      />
                    ))}
                  </View>
                </ScrollView>
                {awayJerseyHex && <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: awayJerseyHex }} />}
              </View>
            </View>
            {rosterForAnalysis.map((p, i) => (
              <View key={i} style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border }}>
                <TextInput
                  value={p.jersey}
                  onChangeText={v => setRosterForAnalysis(prev => prev.map((r, j) => j === i ? { ...r, jersey: v } : r))}
                  style={{ width: 50, backgroundColor: Colors.input, borderRadius: 8, padding: 8, color: Colors.text, fontWeight: '800', textAlign: 'center' }}
                />
                <TextInput
                  value={p.name}
                  onChangeText={v => setRosterForAnalysis(prev => prev.map((r, j) => j === i ? { ...r, name: v } : r))}
                  style={{ flex: 1, backgroundColor: Colors.input, borderRadius: 8, padding: 8, color: Colors.text }}
                />
                <Pressable
                  onPress={() => setRosterForAnalysis(prev => prev.map((r, j) => j === i ? { ...r, team: r.team === 'HOME' ? 'AWAY' : 'HOME' } : r))}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: p.team === 'HOME' ? Colors.accent + '33' : '#FF3B3033' }}>
                  <Text style={{ color: p.team === 'HOME' ? Colors.accent : '#FF3B30', fontWeight: '700', fontSize: 13 }}>{p.team}</Text>
                </Pressable>
                <Pressable onPress={() => setRosterForAnalysis(prev => prev.filter((_, j) => j !== i))}>
                  <Text style={{ color: Colors.subtext, fontSize: 18 }}>✕</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => setRosterForAnalysis(prev => [...prev, { jersey: '', name: '', team: 'HOME' }])}
              style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center' }}>
              <Text style={{ color: Colors.accent }}>+ 선수 추가</Text>
            </Pressable>
          </ScrollView>
          <View style={{ padding: 20 }}>
            <Pressable
              style={{ backgroundColor: Colors.accent, borderRadius: 14, padding: 18, alignItems: 'center' }}
              onPress={() => {
                setShowRosterModal(false);
                const homeList = rosterForAnalysis.filter(p => p.team === 'HOME').map(p => p.jersey).join(',');
                const awayList = rosterForAnalysis.filter(p => p.team === 'AWAY').map(p => p.jersey).join(',');
                setHomeRoster(homeList);
                setAwayRoster(awayList);
                setShowBenchSetup(true);
              }}>
              <Text style={{ color: Colors.bg, fontWeight: '800', fontSize: 16 }}>🏒 분석 시작</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BenchSetupScreen
        visible={showBenchSetup}
        frameUri={videoStem ? `${API_BASE_URL}/frame/${videoStem}/first` : undefined}
        onDone={(cfg) => {
          setBenchConfig(cfg);
          setShowBenchSetup(false);
          const homeList = rosterForAnalysis.filter(p => p.team === 'HOME').map(p => p.jersey).join(',');
          const awayList = rosterForAnalysis.filter(p => p.team === 'AWAY').map(p => p.jersey).join(',');
          startAnalysis(homeList, awayList, cfg);
        }}
        onSkip={() => {
          setShowBenchSetup(false);
          const homeList = rosterForAnalysis.filter(p => p.team === 'HOME').map(p => p.jersey).join(',');
          const awayList = rosterForAnalysis.filter(p => p.team === 'AWAY').map(p => p.jersey).join(',');
          startAnalysis(homeList, awayList, null);
        }}
      />

      <ScrollView style={s.root} contentContainerStyle={s.container}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()}><Text style={s.backBtn}>‹</Text></Pressable>
          <Text style={s.title}>🏒 Player 분석</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* 내 선수 (1명) */}
        <View style={s.card}>
          <Text style={[s.cardTitle, { marginBottom: 12 }]}>👤 내 선수</Text>
          {rosterPlayers.length === 0 ? (
            <Pressable
              style={{ padding: 24, alignItems: 'center', borderWidth: 1,
                       borderColor: Colors.border, borderRadius: 12, borderStyle: 'dashed' }}
              onPress={() => setShowForm(true)}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🏒</Text>
              <Text style={{ color: Colors.accent, fontWeight: '700', fontSize: 16 }}>선수 등록</Text>
              <Text style={{ color: Colors.subtext, fontSize: 12, marginTop: 4 }}>
                내 번호, 이름, 팀을 등록하세요
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* 선수 정보 크게 */}
              <View style={{
                backgroundColor: rosterPlayers[0].team === 'HOME' ? Colors.accent + '22' : '#FF3B3022',
                borderRadius: 16, padding: 16, alignItems: 'center', minWidth: 90,
                borderWidth: 2, borderColor: rosterPlayers[0].team === 'HOME' ? Colors.accent : '#FF3B30'
              }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.text }}>
                  #{rosterPlayers[0].jersey}
                </Text>
                <Text style={{ fontSize: 13, color: Colors.subtext, marginTop: 2 }}>
                  {rosterPlayers[0].name}
                </Text>
                <Text style={{ fontSize: 11, color: rosterPlayers[0].team === 'HOME' ? Colors.accent : '#FF3B30',
                                fontWeight: '700', marginTop: 4 }}>
                  {rosterPlayers[0].position} · {rosterPlayers[0].team}
                </Text>
              </View>
              {/* 수정/변경 버튼 */}
              <Pressable style={s.addBtn} onPress={() => setShowForm(true)}>
                <Text style={s.addBtnText}>✏️ 수정</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>📎 YouTube URL</Text>
          <TextInput
            style={s.input} value={url}
            onChangeText={(text) => {
              setUrl(text);
              const m = text.match(/(?:v=|youtu\.be\/|live\/|shorts\/)([A-Za-z0-9_-]{11})/);
              if (m) setVideoStem(m[1]);
            }}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor={Colors.subtext}
            autoCapitalize="none" autoCorrect={false}
          />
          <View style={s.divRow}>
            <View style={s.divLine} /><Text style={s.divText}>또는</Text><View style={s.divLine} />
          </View>
          <Pressable style={s.fileBtn} onPress={pickVideo}>
            <Text style={s.fileBtnText}>📁 갤러리에서 영상 선택</Text>
          </Pressable>
        </View>

        {/* 로스터 입력 (선택) */}
        <Pressable style={s.rosterToggle} onPress={() => setShowRoster(v => !v)}>
          <Text style={s.rosterToggleText}>📋 홈/어웨이 번호 입력 (선택)</Text>
          <Text style={s.rosterToggleIcon}>{showRoster ? '▲' : '▼'}</Text>
        </Pressable>
        {showRoster && (
          <View style={s.rosterCard}>
            <Text style={s.rosterLabel}>🏠 홈팀 번호</Text>
            <TextInput
              style={s.rosterInput}
              value={homeRoster}
              onChangeText={setHomeRoster}
              placeholder="예: 2, 4, 14, 26, 47, 94"
              placeholderTextColor={Colors.subtext}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={[s.rosterLabel, { marginTop: 10 }]}>✈️ 어웨이팀 번호</Text>
            <TextInput
              style={s.rosterInput}
              value={awayRoster}
              onChangeText={setAwayRoster}
              placeholder="예: 3, 8, 11, 19, 33, 77"
              placeholderTextColor={Colors.subtext}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={s.rosterHint}>
              * 번호를 미리 등록하면 4→47 분리인식 자동 보정으로 정확도가 높아져요
            </Text>
          </View>
        )}

        <View style={s.howCard}>
          {[
            { icon: '🎯', text: '등번호 자동 인식 (AI OCR)' },
            { icon: '⏱️', text: '선수별 아이스타임 & 시프트 측정' },
            { icon: '🎬', text: '하이라이트 클립 자동 생성' },
            { icon: '🗺️', text: '빙판 이동 경로 다이어그램' },
          ].map((item, i) => (
            <View key={i} style={s.howRow}>
              <Text style={s.howIcon}>{item.icon}</Text>
              <Text style={s.howText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Pressable style={s.analyzeBtn} onPress={() => setShowRosterModal(true)}>
          <Text style={s.analyzeBtnText}>🔍 분석 시작</Text>
        </Pressable>

        {/* 내 게임 목록 */}
        {(myGames.length > 0 || loadingGames) && (
          <View style={{ marginTop: 24 }}>
            <Text style={s.sectionHeader}>📂 내 분석 기록</Text>
            {loadingGames ? (
              <ActivityIndicator color={Colors.accent} />
            ) : (
              <View style={{ gap: 8 }}>
                {myGames.map(game => (
                  <Pressable
                    key={game.id}
                    style={s.gameCard}
                    onPress={() => {
                      setVideoStem(game.videoStem);
                      setVideoPath(`${API_BASE_URL}/uploads/${game.videoStem}`);
                      setStep('select_player');
                      // 선수 목록 다시 로드
                      getPlayers(game.videoStem).then(data => {
                        setPlayers(data.players.map(p => {
                          const rEntry = rosterForAnalysis.find(r => r.jersey === p.jersey);
                          return {
                            jersey: p.jersey,
                            team: (rEntry?.team ?? Object.keys(p.teams ?? {})[0] ?? 'HOME') as 'HOME' | 'AWAY',
                            name: p.name || rEntry?.name || '',
                            total_ice_time_min: 0, total_shifts: 0, total_ice_time_sec: 0,
                          };
                        }));
                      }).catch(() => {});
                    }}
                  >
                    <View style={s.gameCardLeft}>
                      <Text style={s.gameTitle}>{game.title}</Text>
                      <Text style={s.gameMeta}>
                        {game.status === 'done' ? `✅ ${game.playerCount ?? 0}명 감지` : '⏳ 분석 중'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteGame(game)}
                      style={{ padding: 8 }}>
                      <Text style={{ color: "#FF3B30", fontSize: 16 }}>🗑️</Text>
                    </Pressable>
                    <Text style={s.chevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );

  // ── STEP 2: 분석 중 ───────────────────────────────────────
  if (step === 'analyzing') return (
    <View style={[s.root, s.center]}>
      <View style={s.analyzeCard}>
        <Text style={s.analyzeIcon}>🏒</Text>
        <Text style={s.analyzeTitle}>AI 분석 중</Text>
        <Text style={s.analyzeMsg}>{progressMsg}</Text>
        <View style={s.barBg}>
          <Animated.View style={[s.barFill, { width: barWidth }]} />
        </View>
        <Text style={s.pctText}>{Math.round(progress)}%</Text>
        <View style={s.stepList}>
          {[
            { label: '영상 업로드', done: progress >= 15 },
            { label: '프레임 추출', done: progress >= 30 },
            { label: 'ByteTrack 추적', done: progress >= 55 },
            { label: 'OCR 등번호 인식', done: progress >= 80 },
            { label: '결과 처리', done: progress >= 100 },
          ].map((st, i) => (
            <View key={i} style={s.stepRow}>
              <Text>{st.done ? '✅' : '⏳'}</Text>
              <Text style={[s.stepLabel, st.done && s.stepLabelDone]}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ── STEP 3: 선수 선택 ─────────────────────────────────────
  if (step === 'select_player') return (
    <>
      <PlayerForm visible={showForm} onClose={() => setShowForm(false)}
        onSave={(p) => { addPlayer(p); setShowForm(false); }} />
      <ScrollView style={s.root} contentContainerStyle={s.container}>
        <View style={s.header}>
          <Pressable onPress={reset}><Text style={s.backBtn}>‹</Text></Pressable>
          <Text style={s.title}>선수 선택</Text>
          <Pressable style={s.addBtn} onPress={() => setShowForm(true)}>
            <Text style={s.addBtnText}>+ 선수</Text>
          </Pressable>
        </View>

        {/* 팀 토글 */}
        <View style={s.teamToggle}>
          {(['ALL','HOME','AWAY'] as TeamFilter[]).map(t => (
            <Pressable key={t} style={[s.teamBtn, teamFilter===t && s.teamBtnActive]} onPress={() => setTeamFilter(t)}>
              <Text style={[s.teamBtnText, teamFilter===t && s.teamBtnTextActive]}>
                {t==='ALL'?'전체':t==='HOME'?'🏠 HOME':'✈️ AWAY'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 선수 목록 */}
        <Text style={s.sectionLabel}>{filteredPlayers.length}명 감지됨</Text>
        <View style={s.playerList}>
          {filteredPlayers.sort((a,b) => b.total_ice_time_min - a.total_ice_time_min).map((p, i) => (
            <Pressable key={i} style={s.playerRow} onPress={() => { setSelectedPlayer(p); setStep('select_option'); }}>
              <View style={[s.jerseyBadge, { backgroundColor: p.team==='HOME' ? Colors.accent+'33' : '#FF664433' }]}>
                <Text style={[s.jerseyNum, { color: p.team==='HOME' ? Colors.accent : '#FF6644' }]}>#{p.jersey}</Text>
              </View>
              <View style={{ flex: 1 }}>
                {p.name ? (
                  <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.text }}>{p.name}</Text>
                ) : null}
                <Text style={[s.playerTeam, p.name ? { fontSize: 11 } : {}]}>{p.team}</Text>
                {p.total_ice_time_min > 0 && (
                  <Text style={s.playerIce}>{p.total_ice_time_min.toFixed(1)}분 · {p.total_shifts}시프트</Text>
                )}
              </View>
              <View style={s.iceBar}>
                <View style={[s.iceBarFill, {
                  width: `${Math.min(p.total_ice_time_min / 45 * 100, 100)}%` as any,
                  backgroundColor: p.team==='HOME' ? Colors.accent : '#FF6644',
                }]} />
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );

  // ── STEP 4: 옵션 선택 + 다이어그램 ───────────────────────
  return (
    <>
    {/* 인앱 비디오 플레이어 모달 */}
    <Modal visible={showPlayer} animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 }}>
            {videoType === 'fulltime' ? '🏒 풀게임' : '🎬 하이라이트'} — #{selectedPlayer?.jersey}
          </Text>
          {/* Video ↔ Diagram toggle (only when videoStem is set) */}
          {!!videoStem && (
            <View style={{ flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 10, overflow: 'hidden', marginRight: 8 }}>
              <Pressable
                style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: viewMode === 'video' ? Colors.accent : 'transparent' }}
                onPress={() => setViewMode('video')}
              >
                <Text style={{ color: viewMode === 'video' ? '#000' : '#888', fontSize: 12, fontWeight: '700' }}>📹 Video</Text>
              </Pressable>
              <Pressable
                style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: viewMode === 'diagram' ? Colors.accent : 'transparent' }}
                onPress={() => setViewMode('diagram')}
              >
                <Text style={{ color: viewMode === 'diagram' ? '#000' : '#888', fontSize: 12, fontWeight: '700' }}>🗺 Diagram</Text>
              </Pressable>
              <Pressable
                style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: viewMode === 'heatmap' ? Colors.accent : 'transparent' }}
                onPress={() => setViewMode('heatmap')}
              >
                <Text style={{ color: viewMode === 'heatmap' ? '#000' : '#888', fontSize: 12, fontWeight: '700' }}>🔥 Heatmap</Text>
              </Pressable>
            </View>
          )}
          <Pressable onPress={() => setShowPlayer(false)} style={{ padding: 8 }}>
            <Text style={{ color: '#fff', fontSize: 22 }}>✕</Text>
          </Pressable>
        </View>

        {/* Content area */}
        <View style={{ flex: 1, position: 'relative' }}>
          {viewMode === 'video' ? (
            /* ── VIDEO VIEW ── */
            <>
              {playerUrl ? (
                <View style={{ flex: 1 }}>
                  <Video
                    source={{ uri: playerUrl }}
                    style={{ width: '100%', flex: 1 }}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    useNativeControls
                    onError={(e) => Alert.alert('재생 오류', String(e))}
                    onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                      // 250ms마다만 업데이트 (과부하 방지)
                      if (status.isLoaded) {
                        const pos = status.positionMillis ?? 0;
                        setPlaybackTimeMs(prev => Math.abs(pos - prev) > 250 ? pos : prev);
                      }
                    }}
                  />
                  {/* PlayerTracker overlay 비활성화 - 재생 중 과부하 방지 */}
                </View>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color={Colors.accent} size="large" />
                  <Text style={{ color: Colors.subtext, marginTop: 12 }}>영상 로딩 중...</Text>
                </View>
              )}
              {/* Label filter row */}
              {!!videoStem && (
                <View style={{ flexDirection: 'row', gap: 6, padding: 8, backgroundColor: '#0a0a0f' }}>
                  {(['ALL', 'HOME', 'AWAY', 'OFF'] as LabelFilter[]).map(f => (
                    <Pressable
                      key={f}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: labelFilter === f ? Colors.accent : '#1a1a2e', borderWidth: 1, borderColor: labelFilter === f ? Colors.accent : '#333355' }}
                      onPress={() => setLabelFilter(f)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: labelFilter === f ? '#000' : '#888' }}>
                        {f === 'ALL' ? '전체' : f === 'HOME' ? '🏠 홈' : f === 'AWAY' ? '✈️ 어웨이' : '숨기기'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : viewMode === 'heatmap' ? (
            /* ── HEATMAP VIEW ── */
            <View style={{ flex: 1, backgroundColor: '#020617' }}>
              <HeatmapView
                videoStem={videoStem ?? ''}
                initialJersey={selectedPlayer?.jersey}
              />
            </View>
          ) : (
            /* ── DIAGRAM VIEW ── */
            <View style={{ flex: 1, backgroundColor: '#0D1B2A', position: 'relative' }}>
              {/* Rink SVG */}
              <View style={{ flex: 1, position: 'relative' }}>
                <RinkSVG />
                {/* Player Tracker as overlay on rink */}
                {!!videoStem && (
                  <PlayerTracker
                    videoStem={videoStem}
                    currentTimeMs={playbackTimeMs}
                    videoWidth={200}
                    videoHeight={85}
                    playerWidth={SCREEN_W}
                    playerHeight={SCREEN_H - 260}
                    fps={4}
                    showLabels="ALL"
                  />
                )}
                {/* Roster lists */}
                {!!videoStem && diagramDetections.length > 0 && (
                  <>
                    <TeamRosterList detections={diagramDetections} team="HOME" side="left" />
                    <TeamRosterList detections={diagramDetections} team="AWAY" side="right" />
                  </>
                )}
              </View>
              <Text style={{ color: '#4a7aa0', fontSize: 11, textAlign: 'center', paddingVertical: 8 }}>
                🗺 Tactical Diagram View — #{selectedPlayer?.jersey} @ {(playbackTimeMs / 1000).toFixed(1)}s
              </Text>
            </View>
          )}
        </View>

        {/* 영상 타입 전환 탭 */}
        <View style={{ flexDirection: 'row', backgroundColor: '#111', paddingBottom: 32 }}>
          {[
            { type: 'highlight' as VideoType, icon: '🎬', label: '하이라이트' },
            { type: 'fulltime' as VideoType,  icon: '🏒', label: '풀게임' },
            { type: 'shifts' as VideoType,    icon: '⏱️', label: '아이스타임' },
          ].map(opt => (
            <Pressable
              key={opt.type}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 14,
                borderTopWidth: videoType === opt.type ? 2 : 0,
                borderTopColor: Colors.accent }}
              onPress={() => {
                setVideoType(opt.type);
                setShowPlayer(false);
                if (opt.type !== 'shifts') setTimeout(() => handlePlay(), 100);
                else { loadShifts(); }
              }}
            >
              <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
              <Text style={{ fontSize: 11, color: videoType === opt.type ? Colors.accent : '#888', marginTop: 2, fontWeight: '600' }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>

    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => setStep('select_player')}><Text style={s.backBtn}>‹</Text></Pressable>
        <Text style={s.title}>#{selectedPlayer?.jersey} 영상</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 선수 요약 */}
      <View style={s.summaryCard}>
        <View style={[s.jerseyBadgeLg, { backgroundColor: selectedPlayer?.team==='HOME' ? Colors.accent+'33' : '#FF664433' }]}>
          <Text style={[s.jerseyNumLg, { color: selectedPlayer?.team==='HOME' ? Colors.accent : '#FF6644' }]}>#{selectedPlayer?.jersey}</Text>
        </View>
        <View>
          <Text style={s.summaryTeam}>{selectedPlayer?.team}</Text>
          {selectedPlayer?.total_ice_time_min! > 0 && (
            <Text style={s.summaryStats}>{selectedPlayer?.total_ice_time_min.toFixed(1)}분 · {selectedPlayer?.total_shifts}시프트</Text>
          )}
        </View>
      </View>

      {/* 타입 선택 */}
      <Text style={s.sectionLabel}>영상 타입</Text>
      <View style={s.optionList}>
        {[
          { type: 'highlight' as VideoType, icon: '🎬', label: 'Highlight Clips', desc: '감지 구간 클립' },
          { type: 'fulltime' as VideoType, icon: '🏒', label: 'Fulltime Video', desc: '첫~마지막 등장 전체' },
          { type: 'shifts' as VideoType, icon: '📋', label: 'Ice Time Shifts', desc: '시프트별 타임스탬프' },
        ].map(opt => (
          <Pressable key={opt.type} style={[s.optionCard, videoType===opt.type && s.optionCardActive]}
            onPress={() => { setVideoType(opt.type); if (opt.type==='shifts') loadShifts(); }}>
            <Text style={s.optionIcon}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.optionLabel, videoType===opt.type && { color: Colors.accent }]}>{opt.label}</Text>
              <Text style={s.optionDesc}>{opt.desc}</Text>
            </View>
            {videoType===opt.type && <Text style={{ color: Colors.accent, fontSize: 18 }}>✓</Text>}
          </Pressable>
        ))}
      </View>

      {/* 재생/생성 버튼 */}
      {videoType !== 'shifts' && (
        <Pressable style={s.playBtn} onPress={handlePlay} disabled={generatingHL}>
          {generatingHL ? <ActivityIndicator color={Colors.bg} /> :
            <Text style={s.playBtnText}>{videoType==='highlight' ? '🎬 하이라이트 생성' : '🏒 풀타임 생성'}</Text>}
        </Pressable>
      )}

      {/* 시프트 + 다이어그램 */}
      {videoType === 'shifts' && (
        <View style={{ gap: 12 }}>
          {loadingShifts ? (
            <ActivityIndicator color={Colors.accent} style={{ padding: 20 }} />
          ) : shifts.length > 0 ? (
            <>
              <IceTimeDiagram shifts={shifts} playerJersey={selectedPlayer?.jersey ?? ''}
                playerTeam={selectedPlayer?.team as any ?? 'HOME'} autoPlay={true} />
              <View style={s.shiftList}>
                {shifts.map((sh, i) => (
                  <View key={i} style={s.shiftRow}>
                    <View style={s.shiftNum}><Text style={s.shiftNumText}>{sh.shift_number}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.shiftTime}>{fmtTime(sh.start_time)} → {fmtTime(sh.end_time)}</Text>
                      <Text style={s.shiftDur}>{sh.duration}초</Text>
                    </View>
                    <View style={[s.shiftBar, { width: Math.min(sh.duration/30*50, 80) }]} />
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Pressable style={s.loadBtn} onPress={loadShifts}>
              <Text style={s.loadBtnText}>시프트 불러오기</Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingTop: 60 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { fontSize: 28, color: Colors.accent },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  addBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: Colors.bg, fontSize: 13, fontWeight: '700' },
  // 입력
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  input: { height: 48, backgroundColor: Colors.input, borderRadius: 10, paddingHorizontal: 14, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  divRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { color: Colors.subtext, fontSize: 12 },
  fileBtn: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  fileBtnText: { color: Colors.subtext, fontSize: 14 },
  howCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10, marginBottom: 20 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howIcon: { fontSize: 18, width: 26 },
  howText: { fontSize: 13, color: Colors.subtext },
  analyzeBtn: { height: 52, borderRadius: 12, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnText: { fontSize: 17, fontWeight: '700', color: Colors.bg },
  // 분석중
  analyzeCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12, width: '90%' },
  analyzeIcon: { fontSize: 48 },
  analyzeTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  analyzeMsg: { fontSize: 13, color: Colors.subtext },
  barBg: { width: '100%', height: 8, backgroundColor: Colors.input, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 4 },
  pctText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  stepList: { width: '100%', gap: 8, marginTop: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepLabel: { fontSize: 13, color: Colors.subtext },
  stepLabelDone: { color: Colors.text },
  // 선수 선택
  teamToggle: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, gap: 4 },
  teamBtn: { flex: 1, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  teamBtnActive: { backgroundColor: Colors.accent },
  teamBtnText: { fontSize: 13, fontWeight: '700', color: Colors.subtext },
  teamBtnTextActive: { color: Colors.bg },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.subtext, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  playerList: { gap: 8 },
  playerRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 10 },
  jerseyBadge: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  jerseyNum: { fontSize: 16, fontWeight: '800' },
  playerTeam: { fontSize: 11, color: Colors.subtext, fontWeight: '600' },
  playerIce: { fontSize: 13, fontWeight: '700', color: Colors.text },
  iceBar: { width: 60, height: 4, backgroundColor: Colors.input, borderRadius: 2, overflow: 'hidden' },
  iceBarFill: { height: '100%', borderRadius: 2 },
  chevron: { fontSize: 22, color: Colors.subtext },
  // 옵션
  summaryCard: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  jerseyBadgeLg: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  jerseyNumLg: { fontSize: 22, fontWeight: '900' },
  summaryTeam: { fontSize: 13, color: Colors.subtext, fontWeight: '600' },
  summaryStats: { fontSize: 15, fontWeight: '700', color: Colors.text },
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
  shiftNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accent+'22', justifyContent: 'center', alignItems: 'center' },
  shiftNumText: { fontSize: 12, fontWeight: '700', color: Colors.accent },
  shiftTime: { fontSize: 13, fontWeight: '600', color: Colors.text },
  shiftDur: { fontSize: 11, color: Colors.subtext },
  shiftBar: { height: 4, borderRadius: 2, backgroundColor: Colors.accent, opacity: 0.5 },
  rosterToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  rosterToggleText: { fontSize: 14, fontWeight: '600', color: Colors.subtext },
  rosterToggleIcon: { fontSize: 12, color: Colors.subtext },
  rosterCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.accent + '44', marginBottom: 12 },
  rosterLabel: { fontSize: 12, fontWeight: '700', color: Colors.accent, marginBottom: 6, letterSpacing: 0.5 },
  rosterInput: { height: 44, backgroundColor: Colors.input, borderRadius: 10, paddingHorizontal: 12, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  rosterHint: { fontSize: 11, color: Colors.subtext, marginTop: 10, lineHeight: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: Colors.subtext, marginBottom: 10, letterSpacing: 0.5 },
  gameCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  gameCardLeft: { flex: 1 },
  gameTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  gameMeta: { fontSize: 12, color: Colors.subtext, marginTop: 2 },
});
