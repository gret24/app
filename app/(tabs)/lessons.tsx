import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, ActivityIndicator, Animated, Image, FlatList, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Colors } from '../../constants/Colors';
import IceTimeDiagram from '../../components/IceTimeDiagram';
import TacticsAnimator from '../../components/TacticsAnimator';
import { CURRICULUM, LEVELS, getWeekStates, overallProgress, type PlanTier } from '../../tactics/curriculum';

// mock 레슨 데이터
const LESSONS = [
  { id: '1', title: 'Skating Fundamentals',  youtube: 'LPmGKBaRMhc', cat: 'Skating',  diff: 'Beginner',     dur: '8:32'  },
  { id: '2', title: 'Wrist Shot Technique',   youtube: 'r5IJufntqL0', cat: 'Shooting', diff: 'Intermediate', dur: '12:15' },
  { id: '3', title: 'Stickhandling Drills',   youtube: 'XiEBxBkBCBo', cat: 'Basics',   diff: 'Beginner',     dur: '10:04' },
  { id: '4', title: 'Defensive Positioning',  youtube: '9kgBiMk8HMc', cat: 'Defense',  diff: 'Intermediate', dur: '15:20' },
  { id: '5', title: 'Power Skating',          youtube: 'jF4PLbD6Ofs', cat: 'Skating',  diff: 'Advanced',     dur: '18:00' },
  { id: '6', title: 'Puck Handling Advanced', youtube: '3HQxDMZMIVs', cat: 'Basics',   diff: 'Advanced',     dur: '14:30' },
];
const DIFF_COLOR: Record<string, string> = {
  Beginner: '#00CC66', Intermediate: '#FFD700', Advanced: '#FF6644',
};

import { uploadAndAnalyze, waitForAnalysis, getPlayers, getReport } from '../../api/analysisService';
import { generateHighlight } from '../../api/highlightService';
import * as ImagePicker from 'expo-image-picker';

interface AnalysisResult {
  job_id: string;
  video_stem: string;
  players: { jersey: string; team: string; total_ice_time_min: number; total_shifts: number }[];
  shifts?: Record<string, any[]>;
}

type Step = 'input' | 'analyzing' | 'result';
type MainTab = 'video' | 'tactics';

// ─── Tactics Tab ─────────────────────────────────────────────────────────────
type LevelKey = 'Beginner' | 'Intermediate' | 'Advanced';

function TacticsTab({ plan }: { plan: PlanTier }) {
  const [scores] = useState<Record<number, number>>({
    1: 90, 2: 85, // mock: weeks 1-2 done
  });
  const [expandedLevel, setExpandedLevel] = useState<LevelKey | null>('Beginner');
  const [activeTacticId, setActiveTacticId] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

  const weekStates = getWeekStates(scores, plan);
  const progress = overallProgress(scores);

  if (activeTacticId && activeWeek !== null) {
    const week = CURRICULUM.find(w => w.weekNumber === activeWeek);
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Pressable
          onPress={() => { setActiveTacticId(null); setActiveWeek(null); }}
          style={ts.backRow}
        >
          <Text style={ts.backBtn}>← 커리큘럼으로</Text>
        </Pressable>
        <Text style={ts.weekTitle}>Week {activeWeek}: {week?.title}</Text>
        <Text style={ts.weekDesc}>{week?.description}</Text>
        <TacticsAnimator tacticId={activeTacticId} autoPlay compact />
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Progress bar */}
      <View style={ts.progressCard}>
        <View style={ts.progressHeader}>
          <Text style={ts.progressLabel}>전체 진행도</Text>
          <Text style={ts.progressPct}>{progress}%</Text>
        </View>
        <View style={ts.barBg}>
          <View style={[ts.barFill, { width: `${progress}%` }]} />
        </View>
        <Text style={ts.progressSub}>
          {Object.keys(scores).length} / {CURRICULUM.length}주 완료
        </Text>
      </View>

      {/* Level cards */}
      {LEVELS.map(({ level, weekRange, emoji }) => {
        const levelWeeks = weekStates.filter(
          ws => ws.week.weekNumber >= weekRange[0] && ws.week.weekNumber <= weekRange[1]
        );
        const doneCount = levelWeeks.filter(ws => ws.completed).length;
        const isExpanded = expandedLevel === level;

        return (
          <View key={level} style={ts.levelCard}>
            <Pressable
              style={ts.levelHeader}
              onPress={() => setExpandedLevel(isExpanded ? null : level)}
            >
              <Text style={ts.levelEmoji}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={ts.levelTitle}>{level}</Text>
                <Text style={ts.levelMeta}>
                  {doneCount}/{levelWeeks.length}주 완료 · Week {weekRange[0]}–{weekRange[1]}
                </Text>
              </View>
              <Text style={ts.chevron}>{isExpanded ? '▲' : '▼'}</Text>
            </Pressable>

            {isExpanded && (
              <View style={ts.weekList}>
                {levelWeeks.map(({ week, locked, completed }) => {
                  const firstLesson = week.lessons.find(l => l.type === 'animation');
                  return (
                    <Pressable
                      key={week.weekNumber}
                      style={[ts.weekRow, locked && ts.weekRowLocked]}
                      onPress={() => {
                        if (locked) {
                          Alert.alert(
                            '잠금',
                            week.planGate === plan
                              ? `이전 주 점수 80점 이상이 필요합니다.`
                              : `${week.planGate.toUpperCase()} 플랜 이상이 필요합니다.`
                          );
                          return;
                        }
                        if (firstLesson) {
                          setActiveTacticId(firstLesson.contentId);
                          setActiveWeek(week.weekNumber);
                        }
                      }}
                    >
                      <View style={ts.weekIconWrap}>
                        {locked
                          ? <Text style={ts.lockIcon}>🔒</Text>
                          : completed
                          ? <Text style={ts.checkIcon}>✅</Text>
                          : <Text style={ts.weekNumText}>{week.weekNumber}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[ts.weekTitle2, locked && { color: Colors.subtext }]}>
                          Week {week.weekNumber}: {week.title}
                        </Text>
                        <Text style={ts.weekCategory}>
                          {week.category.toUpperCase()} · {week.lessons.length}개 레슨
                        </Text>
                      </View>
                      {!locked && (
                        <Text style={{ color: Colors.accent, fontSize: 16 }}>›</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function VideoLessonsScreen() {
  const router = useRouter();
  const { plan, isPro, checkLimit, recordGame } = useSubscription();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: 0 });
  const [mainTab, setMainTab] = useState<MainTab>('video');
  const [videoSubTab, setVideoSubTab] = useState<'library' | 'analyze'>('library');
  const [step, setStep]               = useState<Step>('input');
  const [url, setUrl]                 = useState('');
  const [progress, setProgress]       = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [selectedJersey, setSelectedJersey] = useState<string | null>(null);
  const [playerShifts, setPlayerShifts]     = useState<any[]>([]);
  const [loadingShifts, setLoadingShifts]   = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animateProgress = (to: number) => {
    Animated.timing(progressAnim, {
      toValue: to, duration: 400, useNativeDriver: false,
    }).start();
    setProgress(to);
  };

  const startWithLimitCheck = async () => {
    const { allowed, used, limit } = await checkLimit();
    if (!allowed) { setLimitInfo({ used, limit }); setShowLimitModal(true); return; }
    startAnalysis();
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '갤러리 접근 권한이 필요해요'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 1,
    });
    if (!res.canceled && res.assets[0]) setUrl(res.assets[0].uri);
  };

  const startAnalysis = async () => {
    const input = url.trim();
    if (!input) { Alert.alert('오류', '영상 경로 또는 URL을 입력해주세요'); return; }
    setStep('analyzing'); animateProgress(5); setProgressMsg('업로드 중...');
    try {
      let job_id: string, video_stem: string;
      if (input.startsWith('file://') || input.startsWith('/')) {
        setProgressMsg('서버에 업로드 중...'); animateProgress(10);
        const filename = input.split('/').pop() || 'video.mp4';
        const res = await uploadAndAnalyze(input, filename, { fps: 4 });
        job_id = res.job_id; video_stem = res.video_stem;
      } else {
        // YouTube URL → /analyze/url 엔드포인트
        const { apiPost } = await import('../../api/client');
        const isYoutube = input.includes('youtube.com') || input.includes('youtu.be');
        const endpoint = isYoutube ? '/analyze/url' : '/analyze';
        const body = isYoutube
          ? { youtube_url: input, fps: 4, home_roster: '', away_roster: '' }
          : { video_path: input, fps: 4, home_roster: '', away_roster: '' };
        const res = await apiPost<any>(endpoint, body);
        job_id = res.job_id; video_stem = res.video_stem;
      }
      setProgressMsg('AI 분석 중...'); animateProgress(20);
      waitForAnalysis(job_id, (status) => {
        setProgressMsg(status.message);
        animateProgress(Math.max(20, Math.min(95, status.progress)));
      }).then(async () => {
        animateProgress(100); setProgressMsg('완료!');
        await recordGame();
        await loadResults(video_stem);
      }).catch(() => loadMockResults());
    } catch { simulateMockAnalysis(); }
  };

  const simulateMockAnalysis = () => {
    const steps = [
      { msg: '프레임 추출 중... (4fps)', pct: 20, delay: 800 },
      { msg: 'ByteTrack 선수 추적 중...', pct: 45, delay: 1200 },
      { msg: 'OCR 등번호 인식 중...', pct: 70, delay: 1500 },
      { msg: '팀 자동 구분 중...', pct: 85, delay: 800 },
      { msg: '하이라이트 생성 중...', pct: 95, delay: 600 },
      { msg: '분석 완료! ✅', pct: 100, delay: 400 },
    ];
    let total = 0;
    steps.forEach(({ msg, pct, delay }) => {
      total += delay;
      setTimeout(() => {
        setProgressMsg(msg); animateProgress(pct);
        if (pct === 100) loadMockResults();
      }, total);
    });
  };

  const loadResults = async (video_stem: string) => {
    try {
      const data = await getReport(video_stem);
      setResult({
        job_id: '', video_stem,
        players: (data.players ?? []).slice(0, 12).map(p => ({
          jersey: p.jersey, team: p.team,
          total_ice_time_min: p.total_ice_time_min, total_shifts: p.total_shifts,
        })),
      });
      setStep('result');
    } catch { await loadMockResults(); }
  };

  const loadMockResults = async () => {
    setResult({
      job_id: 'mock', video_stem: 'demo_video',
      players: [
        { jersey: '91', team: 'HOME', total_ice_time_min: 37.4, total_shifts: 3  },
        { jersey: '24', team: 'HOME', total_ice_time_min: 25.9, total_shifts: 21 },
        { jersey: '96', team: 'HOME', total_ice_time_min: 30.2, total_shifts: 18 },
        { jersey: '5',  team: 'AWAY', total_ice_time_min: 18.0, total_shifts: 25 },
        { jersey: '91', team: 'AWAY', total_ice_time_min: 39.2, total_shifts: 2  },
      ],
    });
    setStep('result');
  };

  const loadPlayerShifts = (jersey: string) => {
    setSelectedJersey(jersey); setLoadingShifts(true);
    setTimeout(() => {
      setPlayerShifts([
        { shift_number: 1, start_time: 109,  end_time: 121,  duration: 12 },
        { shift_number: 2, start_time: 203,  end_time: 230,  duration: 27 },
        { shift_number: 3, start_time: 400,  end_time: 445,  duration: 45 },
        { shift_number: 4, start_time: 700,  end_time: 762,  duration: 62 },
        { shift_number: 5, start_time: 1100, end_time: 1155, duration: 55 },
        { shift_number: 6, start_time: 1500, end_time: 1540, duration: 40 },
      ]);
      setLoadingShifts(false);
    }, 600);
  };

  const reset = () => {
    setStep('input'); setUrl(''); setProgress(0);
    setProgressMsg(''); setResult(null);
    setSelectedJersey(null); setPlayerShifts([]);
    progressAnim.setValue(0);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const barWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  const LimitModal = () => (
    <Modal visible={showLimitModal} transparent animationType="fade">
      <View style={{ flex:1, backgroundColor:'#000000CC', justifyContent:'center', alignItems:'center', padding:24 }}>
        <View style={{ backgroundColor: Colors.card, borderRadius:20, padding:24, width:'100%', gap:14 }}>
          <Text style={{ fontSize:36, textAlign:'center' }}>⛔</Text>
          <Text style={{ fontSize:18, fontWeight:'800', color:Colors.text, textAlign:'center' }}>이번 달 제한 초과</Text>
          <Text style={{ fontSize:14, color:Colors.subtext, textAlign:'center', lineHeight:22 }}>
            {`이번 달 무료 분석 ${limitInfo.limit}회를 모두 사용했어요.`}
          </Text>
          <Pressable style={{ height:48, borderRadius:12, backgroundColor:Colors.accent, justifyContent:'center', alignItems:'center' }}
            onPress={() => setShowLimitModal(false)}>
            <Text style={{ color:Colors.bg, fontWeight:'700', fontSize:15 }}>업그레이드 알아보기</Text>
          </Pressable>
          <Pressable onPress={() => setShowLimitModal(false)} style={{ alignSelf:'center' }}>
            <Text style={{ color:Colors.subtext, fontSize:13 }}>나중에</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  if (!isPro) return (
    <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
      <LimitModal />
      <Text style={{ fontSize: 56, marginBottom: 16 }}>🔒</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 10 }}>Pro 이상 전용</Text>
      <Text style={{ fontSize: 14, color: Colors.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
        영상 레슨, 드로잉 분석, 전술 커리큘럼은{'\n'}
        <Text style={{ color: Colors.accent, fontWeight: '700' }}>Pro / Team</Text> 플랜에서 사용할 수 있어요.
      </Text>
      <Pressable style={{ marginTop: 20, height: 52, borderRadius: 12, backgroundColor: Colors.accent, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.bg, fontSize: 16, fontWeight: '700' }}>업그레이드하기</Text>
      </Pressable>
      <Text style={{ marginTop: 12, fontSize: 11, color: Colors.subtext }}>현재 플랜: Free</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <LimitModal />

      {/* ── Top 2 sub-tabs ─────────────────────────── */}
      <View style={s.tabRow}>
        <Pressable
          style={[s.tab, mainTab === 'video' && s.tabActive]}
          onPress={() => setMainTab('video')}
        >
          <Text style={[s.tabText, mainTab === 'video' && s.tabTextActive]}>📹 Video Lessons</Text>
        </Pressable>
        <Pressable
          style={[s.tab, mainTab === 'tactics' && s.tabActive]}
          onPress={() => setMainTab('tactics')}
        >
          <Text style={[s.tabText, mainTab === 'tactics' && s.tabTextActive]}>🏒 Tactics</Text>
        </Pressable>
      </View>

      {/* ── Tactics tab ────────────────────────────── */}
      {mainTab === 'tactics' && (
        <TacticsTab plan={plan as PlanTier} />
      )}

      {/* ── Video tab ──────────────────────────────── */}
      {mainTab === 'video' && (
        <>
          {/* Video sub-tabs: Library / Analyze */}
          {step === 'input' && (
            <View style={s.subTabRow}>
              <Pressable
                style={[s.subTab, videoSubTab === 'library' && s.subTabActive]}
                onPress={() => setVideoSubTab('library')}
              >
                <Text style={[s.subTabText, videoSubTab === 'library' && s.subTabTextActive]}>
                  📚 레슨 라이브러리
                </Text>
              </Pressable>
              <Pressable
                style={[s.subTab, videoSubTab === 'analyze' && s.subTabActive]}
                onPress={() => setVideoSubTab('analyze')}
              >
                <Text style={[s.subTabText, videoSubTab === 'analyze' && s.subTabTextActive]}>
                  🔍 내 영상 분석
                </Text>
              </Pressable>
            </View>
          )}

          {step === 'input' && videoSubTab === 'library' && (
            <ScrollView contentContainerStyle={s.container}>
              <Text style={s.libDesc}>레슨을 눌러 영상을 보고, <Text style={{color:Colors.accent}}>Draw</Text>로 그림을 그려 공유하세요.</Text>
              {LESSONS.map(item => (
                <Pressable key={item.id} style={s.lessonCard} onPress={() => router.push(`/lesson/${item.id}` as any)}>
                  <View style={s.thumbWrap}>
                    <Image source={{ uri: `https://img.youtube.com/vi/${item.youtube}/hqdefault.jpg` }} style={s.thumb} resizeMode="cover" />
                    <View style={s.durBadge}><Text style={s.durText}>{item.dur}</Text></View>
                    <View style={s.drawHint}><Text style={s.drawHintText}>✏️ Draw</Text></View>
                  </View>
                  <View style={s.lessonInfo}>
                    <Text style={s.lessonTitle}>{item.title}</Text>
                    <View style={s.tagRow}>
                      <View style={s.catBadge}><Text style={s.catText}>{item.cat}</Text></View>
                      <View style={[s.diffBadge2, { backgroundColor: DIFF_COLOR[item.diff] + '33' }]}>
                        <Text style={[s.diffText, { color: DIFF_COLOR[item.diff] }]}>{item.diff}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {step === 'input' && videoSubTab === 'analyze' && (
            <ScrollView contentContainerStyle={s.container}>
              <Text style={s.subtitle}>영상 분석 후 선수별 하이라이트와 아이스타임 다이어그램을 제공해요.</Text>
              <View style={s.card}>
                <Text style={s.cardTitle}>📎 YouTube URL</Text>
                <TextInput
                  style={s.input} value={url} onChangeText={setUrl}
                  placeholder="https://youtube.com/watch?v=..."
                  placeholderTextColor={Colors.subtext}
                  autoCapitalize="none" autoCorrect={false}
                />
                <Text style={s.orText}>— 또는 —</Text>
                <Pressable style={s.fileBtn} onPress={pickVideo}>
                  <Text style={s.fileBtnText}>📁 갤러리에서 선택</Text>
                </Pressable>
              </View>
              <Pressable style={s.analyzeBtn} onPress={startWithLimitCheck}>
                <Text style={s.analyzeBtnText}>🔍 분석 시작</Text>
              </Pressable>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {step === 'analyzing' && (
            <View style={[s.center, { flex: 1 }]}>
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
                    { label: '프레임 추출', done: progress >= 20 },
                    { label: 'ByteTrack 추적', done: progress >= 45 },
                    { label: 'OCR 인식', done: progress >= 70 },
                    { label: '팀 자동 구분', done: progress >= 85 },
                    { label: '하이라이트 생성', done: progress >= 100 },
                  ].map((st, i) => (
                    <View key={i} style={s.stepRow}>
                      <Text>{st.done ? '✅' : '⏳'}</Text>
                      <Text style={[s.stepLabel, st.done && s.stepLabelDone]}>{st.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {step === 'result' && (
            <ScrollView contentContainerStyle={s.container}>
              <View style={s.resultHeader}>
                <Text style={s.title}>✅ 분석 완료</Text>
                <Pressable onPress={reset} style={s.resetBtn}>
                  <Text style={s.resetText}>새 영상</Text>
                </Pressable>
              </View>
              <Text style={s.sectionTitle}>감지된 선수 ({result?.players.length ?? 0}명)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.playerScroll}>
                {result?.players.map((p, i) => (
                  <Pressable key={i}
                    style={[s.playerChip, selectedJersey === p.jersey && s.playerChipActive]}
                    onPress={() => loadPlayerShifts(p.jersey)}>
                    <Text style={s.playerNum}>#{p.jersey}</Text>
                    <Text style={s.playerTeam}>{p.team}</Text>
                    <Text style={s.playerIce}>{p.total_ice_time_min.toFixed(1)}분</Text>
                  </Pressable>
                ))}
              </ScrollView>
              {selectedJersey && (
                <View style={{ marginTop: 16 }}>
                  <Text style={s.sectionTitle}>#{selectedJersey} 아이스타임 다이어그램</Text>
                  {loadingShifts ? (
                    <View style={[s.card, s.center, { height: 80 }]}>
                      <ActivityIndicator color={Colors.accent} />
                    </View>
                  ) : playerShifts.length > 0 ? (
                    <IceTimeDiagram
                      shifts={playerShifts}
                      playerJersey={selectedJersey}
                      playerTeam={result?.players.find(p => p.jersey === selectedJersey)?.team as any ?? 'HOME'}
                      autoPlay={true}
                    />
                  ) : null}
                </View>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                {[
                  { icon: '🎬', label: '하이라이트 재생',  color: Colors.accent },
                  { icon: '🏒', label: '풀타임 재생',      color: '#FF6644' },
                  { icon: '📊', label: '팀 리포트 보기',   color: '#FFD700' },
                  { icon: '💾', label: '영상 저장',        color: Colors.subtext },
                ].map((btn, i) => (
                  <Pressable key={i}
                    style={{ width: '47%', backgroundColor: Colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: btn.color + '66', alignItems: 'center', gap: 6 }}
                    onPress={() => Alert.alert(btn.label, 'RunPod 서버 연결 후 사용 가능')}>
                    <Text style={{ fontSize: 26 }}>{btn.icon}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: btn.color, textAlign: 'center' }}>{btn.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

// ─── Tactics tab styles ───────────────────────────────────────────────────────
const ts = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: { color: Colors.accent, fontSize: 15, fontWeight: '600' },
  weekTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  weekDesc: { fontSize: 13, color: Colors.subtext, lineHeight: 20 },
  progressCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  progressPct: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  barBg: { height: 8, backgroundColor: Colors.input, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 4 },
  progressSub: { fontSize: 11, color: Colors.subtext },
  levelCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  levelHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  levelEmoji: { fontSize: 20 },
  levelTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  levelMeta: { fontSize: 11, color: Colors.subtext, marginTop: 2 },
  chevron: { fontSize: 12, color: Colors.subtext },
  weekList: { borderTopWidth: 1, borderTopColor: Colors.border },
  weekRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border + '55' },
  weekRowLocked: { opacity: 0.55 },
  weekIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center' },
  lockIcon: { fontSize: 13 },
  checkIcon: { fontSize: 14 },
  weekNumText: { fontSize: 11, fontWeight: '800', color: Colors.accent },
  weekTitle2: { fontSize: 13, fontWeight: '700', color: Colors.text },
  weekCategory: { fontSize: 10, color: Colors.subtext, marginTop: 2, letterSpacing: 0.5 },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingTop: 12 },
  center: { justifyContent: 'center', alignItems: 'center' },
  // Top sub-tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 8 },
  tab: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' },
  tabActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '18' },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.subtext },
  tabTextActive: { color: Colors.accent },
  // Video sub-tabs
  subTabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  subTab: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' },
  subTabActive: { borderColor: Colors.accent + '88', backgroundColor: Colors.accent + '12' },
  subTabText: { fontSize: 12, fontWeight: '700', color: Colors.subtext },
  subTabTextActive: { color: Colors.accent },
  // Library
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.subtext, lineHeight: 20, marginBottom: 16 },
  libDesc: { fontSize: 13, color: Colors.subtext, lineHeight: 20, marginBottom: 16 },
  lessonCard: { backgroundColor: Colors.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  thumbWrap: { position: 'relative', width: '100%', aspectRatio: 16/9 },
  thumb: { width: '100%', height: '100%' },
  durBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#000000BB', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  durText: { fontSize: 11, color: 'white', fontWeight: '600' },
  drawHint: { position: 'absolute', bottom: 8, left: 8, backgroundColor: Colors.accent + 'CC', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  drawHintText: { fontSize: 11, color: Colors.bg, fontWeight: '700' },
  lessonInfo: { padding: 12, gap: 8 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tagRow: { flexDirection: 'row', gap: 6 },
  catBadge: { backgroundColor: Colors.input, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 11, color: Colors.subtext, fontWeight: '600' },
  diffBadge2: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '700' },
  // Analyze
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  input: { height: 48, backgroundColor: Colors.input, borderRadius: 10, paddingHorizontal: 14, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  orText: { textAlign: 'center', color: Colors.subtext, fontSize: 12 },
  fileBtn: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  fileBtnText: { color: Colors.subtext, fontSize: 14 },
  analyzeBtn: { height: 52, borderRadius: 12, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnText: { fontSize: 17, fontWeight: '700', color: Colors.bg },
  // Analyzing
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
  // Result
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resetBtn: { backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  resetText: { color: Colors.subtext, fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  playerScroll: { marginBottom: 4 },
  playerChip: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', minWidth: 72, borderWidth: 1, borderColor: Colors.border },
  playerChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  playerNum: { fontSize: 20, fontWeight: '900', color: Colors.accent },
  playerTeam: { fontSize: 10, color: Colors.subtext },
  playerIce: { fontSize: 11, color: Colors.text, fontWeight: '600' },
});
