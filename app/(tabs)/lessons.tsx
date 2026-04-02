import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, ActivityIndicator, Animated, Image, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Colors } from '../../constants/Colors';
import IceTimeDiagram from '../../components/IceTimeDiagram';

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

export default function VideoLessonsScreen() {
  const router = useRouter();
  const { plan } = useSubscription();
  const isPro = plan === 'pro' || plan === 'team';
  const [mainTab, setMainTab] = useState<'library' | 'analyze'>('library');
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

  // 갤러리에서 영상 선택
  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '갤러리 접근 권한이 필요해요'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) {
      setUrl(res.assets[0].uri);
    }
  };

  // 분석 시작 (실제 API + mock 폴백)
  const startAnalysis = async () => {
    const input = url.trim();
    if (!input) { Alert.alert('오류', '영상 경로 또는 URL을 입력해주세요'); return; }

    setStep('analyzing');
    animateProgress(5);
    setProgressMsg('업로드 중...');

    try {
      // 파일 URI면 업로드, 아니면 경로 기반 분석
      let job_id: string, video_stem: string;
      if (input.startsWith('file://') || input.startsWith('/')) {
        setProgressMsg('서버에 업로드 중...');
        animateProgress(10);
        const filename = input.split('/').pop() || 'video.mp4';
        const res = await uploadAndAnalyze(input, filename, { fps: 4 });
        job_id = res.job_id; video_stem = res.video_stem;
      } else {
        // 경로 기반 (서버에 이미 있는 영상)
        const { apiPost } = await import('../../api/client');
        const res = await apiPost<any>('/analyze', { video_path: input, fps: 4 });
        job_id = res.job_id; video_stem = res.video_stem;
      }

      setProgressMsg('AI 분석 중...');
      animateProgress(20);

      // 폴링으로 진행 상황 확인
      waitForAnalysis(job_id, (status) => {
        setProgressMsg(status.message);
        animateProgress(Math.max(20, Math.min(95, status.progress)));
      }).then(async () => {
        animateProgress(100);
        setProgressMsg('완료!');
        await loadResults(video_stem);
      }).catch(() => loadMockResults());

    } catch {
      simulateMockAnalysis();
    }
  };

  // mock 분석 시뮬레이션 (API 없을 때)
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
        setProgressMsg(msg);
        animateProgress(pct);
        if (pct === 100) loadMockResults();
      }, total);
    });
  };

  const loadResults = async (video_stem: string) => {
    try {
      const data = await getReport(video_stem);
      setResult({
        job_id: '',
        video_stem,
        players: (data.players ?? []).slice(0, 12).map(p => ({
          jersey: p.jersey,
          team: p.team,
          total_ice_time_min: p.total_ice_time_min,
          total_shifts: p.total_shifts,
        })),
      });
      setStep('result');
    } catch {
      await loadMockResults();
    }
  };

  const loadMockResults = async () => {
    setResult({
      job_id: 'mock',
      video_stem: 'demo_video',
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
    setSelectedJersey(jersey);
    setLoadingShifts(true);
    // mock 시프트 데이터
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

  // ── STEP 1: 입력 ──────────────────────────────────────────
  // Pro 잠금 화면
  if (!isPro) return (
    <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>🔒</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 10 }}>Pro 이상 전용</Text>
      <Text style={{ fontSize: 14, color: Colors.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
        영상 레슨, 드로잉 분석, 영상 업로드 기능은{'\n'}
        <Text style={{ color: Colors.accent, fontWeight: '700' }}>Pro / Team</Text> 플랜에서 사용할 수 있어요.
      </Text>
      <View style={{ gap: 10, width: '100%' }}>
        {[
          { plan: 'Starter', price: '$29', features: ['기본 분석', '10영상/월'] },
          { plan: 'Pro', price: '$59', features: ['무제한 분석', '영상 레슨', 'Draw 공유'], highlight: true },
          { plan: 'Team', price: '$149', features: ['팀 전체', '다중 영상', '전술 추천'], highlight: true },
        ].map((p, i) => (
          <Pressable key={i} style={[{
            borderRadius: 14, padding: 16, borderWidth: p.highlight ? 2 : 1,
            borderColor: p.highlight ? Colors.accent : Colors.border,
            backgroundColor: p.highlight ? Colors.accent + '15' : Colors.card,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }]}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: p.highlight ? Colors.accent : Colors.text }}>{p.plan}</Text>
              <Text style={{ fontSize: 11, color: Colors.subtext }}>{p.features.join(' · ')}</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: p.highlight ? Colors.accent : Colors.text }}>{p.price}<Text style={{ fontSize: 11 }}>/월</Text></Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={{ marginTop: 20, height: 52, borderRadius: 12, backgroundColor: Colors.accent, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.bg, fontSize: 16, fontWeight: '700' }}>업그레이드하기</Text>
      </Pressable>
      <Text style={{ marginTop: 12, fontSize: 11, color: Colors.subtext }}>현재 플랜: Free</Text>
    </View>
  );

  if (step === 'input') return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <Text style={s.title}>🎬 영상 레슨</Text>

      {/* 메인 탭 */}
      <View style={s.mainTabRow}>
        <Pressable style={[s.mainTab, mainTab==='library' && s.mainTabActive]} onPress={() => setMainTab('library')}>
          <Text style={[s.mainTabText, mainTab==='library' && s.mainTabTextActive]}>📚 레슨 라이브러리</Text>
        </Pressable>
        <Pressable style={[s.mainTab, mainTab==='analyze' && s.mainTabActive]} onPress={() => setMainTab('analyze')}>
          <Text style={[s.mainTabText, mainTab==='analyze' && s.mainTabTextActive]}>🔍 내 영상 분석</Text>
        </Pressable>
      </View>

      {/* 라이브러리 탭 */}
      {mainTab === 'library' && (
        <View>
          <Text style={s.libDesc}>레슨을 눌러서 영상을 보고, <Text style={{color:Colors.accent}}>Draw 버튼</Text>으로 멈춘 화면에 그림을 그려 공유할 수 있어요.</Text>
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
                  <View style={[s.diffBadge, { backgroundColor: DIFF_COLOR[item.diff] + '33' }]}>
                    <Text style={[s.diffText, { color: DIFF_COLOR[item.diff] }]}>{item.diff}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* 내 영상 분석 탭 */}
      {mainTab === 'analyze' && (
        <View>
          <Text style={s.subtitle}>영상을 분석하면 선수별 하이라이트와 아이스타임 다이어그램을 자동으로 생성해요.</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>📎 YouTube URL</Text>
        <TextInput
          style={s.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor={Colors.subtext}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={s.orText}>— 또는 —</Text>
        <Pressable style={s.fileBtn} onPress={pickVideo}>
          <Text style={s.fileBtnText}>📁 갤러리에서 선택</Text>
        </Pressable>
      </View>

      <View style={s.howCard}>
        <Text style={s.howTitle}>분석 후 제공되는 것</Text>
        {[
          { icon: '👥', text: '선수별 자동 감지 (등번호 OCR)' },
          { icon: '⏱️', text: '아이스타임 & 시프트 측정' },
          { icon: '🎬', text: '하이라이트 클립 자동 생성' },
          { icon: '🗺️', text: '빙판 이동 경로 다이어그램' },
          { icon: '📊', text: '팀/선수별 통계 리포트' },
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
        </View>
      )}
    </ScrollView>
  );

  // ── STEP 2: 분석 중 ───────────────────────────────────────
  if (step === 'analyzing') return (
    <View style={[s.root, s.center]}>
      <View style={s.analyzeCard}>
        <Text style={s.analyzeIcon}>🏒</Text>
        <Text style={s.analyzeTitle}>AI 분석 중</Text>
        <Text style={s.analyzeMsg}>{progressMsg}</Text>
        {/* 프로그레스 바 */}
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
              <Text style={st.done ? s.stepDone : s.stepPending}>
                {st.done ? '✅' : '⏳'}
              </Text>
              <Text style={[s.stepLabel, st.done && s.stepLabelDone]}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ── STEP 3: 결과 ──────────────────────────────────────────
  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <View style={s.resultHeader}>
        <Text style={s.title}>✅ 분석 완료</Text>
        <Pressable onPress={reset} style={s.resetBtn}>
          <Text style={s.resetText}>새 영상</Text>
        </Pressable>
      </View>

      {/* 선수 목록 */}
      <Text style={s.sectionTitle}>감지된 선수 ({result?.players.length ?? 0}명)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.playerScroll}>
        {result?.players.map((p, i) => (
          <Pressable
            key={i}
            style={[s.playerChip, selectedJersey === p.jersey && s.playerChipActive]}
            onPress={() => loadPlayerShifts(p.jersey)}
          >
            <Text style={s.playerNum}>#{p.jersey}</Text>
            <Text style={s.playerTeam}>{p.team}</Text>
            <Text style={s.playerIce}>{p.total_ice_time_min.toFixed(1)}분</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 선택된 선수 다이어그램 */}
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

      {/* 액션 버튼 */}
      <Text style={s.sectionTitle}>하이라이트</Text>
      <View style={s.actionGrid}>
        {[
          { icon: '🎬', label: '하이라이트 재생',  color: Colors.accent },
          { icon: '🏒', label: '풀타임 재생',      color: '#FF6644' },
          { icon: '📊', label: '팀 리포트 보기',   color: '#FFD700' },
          { icon: '💾', label: '영상 저장',        color: Colors.subtext },
        ].map((btn, i) => (
          <Pressable
            key={i}
            style={[s.actionBtn, { borderColor: btn.color + '66' }]}
            onPress={() => Alert.alert(btn.label, 'RunPod 서버 연결 후 사용 가능')}
          >
            <Text style={s.actionIcon}>{btn.icon}</Text>
            <Text style={[s.actionLabel, { color: btn.color }]}>{btn.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingTop: 60 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.subtext, lineHeight: 20, marginBottom: 24 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  input: { height: 48, backgroundColor: Colors.input, borderRadius: 10, paddingHorizontal: 14, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  orText: { textAlign: 'center', color: Colors.subtext, fontSize: 12 },
  fileBtn: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  fileBtnText: { color: Colors.subtext, fontSize: 14 },
  howCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20, gap: 10 },
  howTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howIcon: { fontSize: 18, width: 26 },
  howText: { fontSize: 13, color: Colors.subtext },
  analyzeBtn: { height: 52, borderRadius: 12, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnText: { fontSize: 17, fontWeight: '700', color: Colors.bg },
  mainTabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mainTab: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' },
  mainTabActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '18' },
  mainTabText: { fontSize: 13, fontWeight: '700', color: Colors.subtext },
  mainTabTextActive: { color: Colors.accent },
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
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '700' },
  // 분석 중
  analyzeCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12, width: '90%' },
  analyzeIcon: { fontSize: 48 },
  analyzeTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  analyzeMsg: { fontSize: 13, color: Colors.subtext },
  barBg: { width: '100%', height: 8, backgroundColor: Colors.input, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 4 },
  pctText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  stepList: { width: '100%', gap: 8, marginTop: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDone: { fontSize: 14 },
  stepPending: { fontSize: 14, opacity: 0.3 },
  stepLabel: { fontSize: 13, color: Colors.subtext },
  stepLabelDone: { color: Colors.text },
  // 결과
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  resetBtn: { backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  resetText: { color: Colors.subtext, fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  playerScroll: { marginBottom: 4 },
  playerChip: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', minWidth: 72, borderWidth: 1, borderColor: Colors.border },
  playerChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  playerNum: { fontSize: 20, fontWeight: '900', color: Colors.accent },
  playerTeam: { fontSize: 10, color: Colors.subtext },
  playerIce: { fontSize: 11, color: Colors.text, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  actionBtn: { width: '47%', backgroundColor: Colors.card, borderRadius: 12, padding: 16, borderWidth: 1, alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 26 },
  actionLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
