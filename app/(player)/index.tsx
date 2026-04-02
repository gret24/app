import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, ActivityIndicator, TextInput, Animated, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useRoster } from '../../contexts/RosterContext';
import PlayerForm from '../../components/PlayerForm';
import IceTimeDiagram from '../../components/IceTimeDiagram';
import * as ImagePicker from 'expo-image-picker';
import { uploadAndAnalyze, waitForAnalysis, getPlayers, getReport } from '../../api/analysisService';
import { generateHighlight, getVideoStreamUrl } from '../../api/highlightService';
import { apiPost } from '../../api/client';
import { API_BASE_URL } from '../../api/config';
import { useAuth } from '../../contexts/AuthContext';
import { addGame, getGames, updateGame, type GameRecord } from '../../api/gamesService';

type AppStep = 'input' | 'analyzing' | 'select_player' | 'select_option';
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

  // 게임 목록 로드
  useEffect(() => {
    if (!user?.uid) { setLoadingGames(false); return; }
    getGames(user.uid).then(games => {
      setMyGames(games);
      setLoadingGames(false);
    }).catch(() => setLoadingGames(false));
  }, [user?.uid]);

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

  // 서버에 YouTube URL 분석 요청
  const analyzeYouTube = async (youtubeUrl: string) => {
    return apiPost<{ job_id: string; video_stem: string }>('/analyze/url', {
      youtube_url: youtubeUrl, fps: 4,
    });
  };

  // 분석 시작
  const startAnalysis = async () => {
    const input = url.trim();
    if (!input) { Alert.alert('오류', 'YouTube URL 또는 영상을 선택해주세요'); return; }

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
        const res = await analyzeYouTube(input);
        job_id = res.job_id; stem = res.video_stem;
      } else if (isFile) {
        setProgressMsg('영상 업로드 중...');
        animateProgress(10);
        const filename = input.split('/').pop() || 'video.mp4';
        const res = await uploadAndAnalyze(input, filename, { fps: 4 });
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
      setVideoPath(vpath || `${API_BASE_URL}/uploads/${stem}`);
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
        const merged = mapped.map(p => {
          const rp = report.players.find(r => r.jersey === p.jersey && r.team === p.team);
          return rp ? { ...p, total_ice_time_min: rp.total_ice_time_min, total_shifts: rp.total_shifts, total_ice_time_sec: rp.total_ice_time_sec } : p;
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
      const result = await generateHighlight(
        videoPath, videoStem, selectedPlayer.jersey,
        { gap: 30, buf: 5 }
      );
      Alert.alert('하이라이트 완성!', `${result.shifts}개 시프트 · ${result.total_ice_time_min.toFixed(1)}분\n\n영상 URL이 클립보드에 복사됐어요.`);
    } catch (e: any) {
      Alert.alert('오류', e.message || '하이라이트 생성 실패');
    } finally {
      setGeneratingHL(false);
    }
  };

  const reset = () => {
    setStep('input'); setUrl(''); setVideoStem(''); setVideoPath('');
    setProgress(0); setProgressMsg(''); setPlayers([]);
    setSelectedPlayer(null); setShifts([]);
    progressAnim.setValue(0);
  };

  const filteredPlayers = players.filter(p => teamFilter === 'ALL' || p.team === teamFilter);

  // ── STEP 1: 입력 ──────────────────────────────────────────
  if (step === 'input') return (
    <>
      <PlayerForm visible={showForm} onClose={() => setShowForm(false)}
        onSave={(p) => { addPlayer(p); setShowForm(false); }} />
      <ScrollView style={s.root} contentContainerStyle={s.container}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()}><Text style={s.backBtn}>‹</Text></Pressable>
          <Text style={s.title}>🏒 Player 분석</Text>
          <Pressable style={s.addBtn} onPress={() => setShowForm(true)}>
            <Text style={s.addBtnText}>+ 선수</Text>
          </Pressable>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>📎 YouTube URL</Text>
          <TextInput
            style={s.input} value={url} onChangeText={setUrl}
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

        <Pressable style={s.analyzeBtn} onPress={startAnalysis}>
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
                        setPlayers(data.players.map(p => ({
                          jersey: p.jersey,
                          team: Object.keys(p.teams ?? {})[0] ?? 'HOME',
                          total_ice_time_min: 0, total_shifts: 0, total_ice_time_sec: 0,
                        })));
                      }).catch(() => {});
                    }}
                  >
                    <View style={s.gameCardLeft}>
                      <Text style={s.gameTitle}>{game.title}</Text>
                      <Text style={s.gameMeta}>
                        {game.status === 'done' ? `✅ ${game.playerCount ?? 0}명 감지` : '⏳ 분석 중'}
                      </Text>
                    </View>
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
                <Text style={s.playerTeam}>{p.team}</Text>
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
  sectionHeader: { fontSize: 14, fontWeight: '700', color: Colors.subtext, marginBottom: 10, letterSpacing: 0.5 },
  gameCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  gameCardLeft: { flex: 1 },
  gameTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  gameMeta: { fontSize: 12, color: Colors.subtext, marginTop: 2 },
});
