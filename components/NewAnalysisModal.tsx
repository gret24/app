import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { JERSEY_PALETTE } from '../constants/jerseyPalette';
import RinkLinePicker from './RinkLinePicker';
import {
  quickAnalyze,
  getColorPreview,
  analyzeWithRoster,
  getAnalysisStatus,
  uploadAndAnalyze,
  analyzeYoutube,
  prescanVideo,
  RosterEntry,
  FullAnalyzeOptions,
  JobStatus,
  TeamColorInfo,
  PrescanResult,
} from '../api/analysisService';
import { POLL_INTERVAL } from '../api/config';

// ─── Types ───────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface Props {
  visible: boolean;
  onClose: () => void;
  onDone: (stem: string) => void;
  initialUrl?: string;
}

const AWAY_COLOR = '#FF3B30';


// ─── Player Add Form ─────────────────────────────────────────────────

interface PlayerFormState {
  jersey: string;
  name: string;
  age: string;
  team: 'HOME' | 'AWAY';
}

function PlayerAddForm({ onAdd }: { onAdd: (p: PlayerFormState) => void }) {
  const [form, setForm] = useState<PlayerFormState>({
    jersey: '',
    name: '',
    age: '',
    team: 'HOME',
  });

  const handleAdd = () => {
    if (!form.jersey.trim() || !form.name.trim()) {
      Alert.alert('입력 오류', '번호와 이름을 입력해 주세요.');
      return;
    }
    onAdd(form);
    setForm({ jersey: '', name: '', age: '', team: 'HOME' });
  };

  return (
    <View style={pf.container}>
      <View style={pf.row}>
        <TextInput
          style={[pf.input, pf.inputSmall]}
          placeholder="번호"
          placeholderTextColor={Colors.subtext}
          value={form.jersey}
          onChangeText={v => setForm(s => ({ ...s, jersey: v }))}
          keyboardType="numeric"
        />
        <TextInput
          style={[pf.input, pf.inputFlex]}
          placeholder="이름"
          placeholderTextColor={Colors.subtext}
          value={form.name}
          onChangeText={v => setForm(s => ({ ...s, name: v }))}
        />
        <TextInput
          style={[pf.input, pf.inputSmall]}
          placeholder="나이"
          placeholderTextColor={Colors.subtext}
          value={form.age}
          onChangeText={v => setForm(s => ({ ...s, age: v }))}
          keyboardType="numeric"
        />
      </View>
      <View style={pf.row}>
        <Pressable
          style={[pf.teamBtn, form.team === 'HOME' && pf.teamBtnActiveHome]}
          onPress={() => setForm(s => ({ ...s, team: 'HOME' }))}
        >
          <Text style={[pf.teamBtnText, form.team === 'HOME' && { color: Colors.accent }]}>
            홈
          </Text>
        </Pressable>
        <Pressable
          style={[pf.teamBtn, form.team === 'AWAY' && pf.teamBtnActiveAway]}
          onPress={() => setForm(s => ({ ...s, team: 'AWAY' }))}
        >
          <Text style={[pf.teamBtnText, form.team === 'AWAY' && { color: AWAY_COLOR }]}>
            어웨이
          </Text>
        </Pressable>
        <Pressable style={pf.addBtn} onPress={handleAdd}>
          <Text style={pf.addBtnText}>추가</Text>
        </Pressable>
      </View>
    </View>
  );
}

const pf = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    backgroundColor: Colors.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputSmall: { width: 60 },
  inputFlex: { flex: 1 },
  teamBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
  },
  teamBtnActiveHome: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  teamBtnActiveAway: { borderColor: AWAY_COLOR, backgroundColor: AWAY_COLOR + '22' },
  teamBtnText: { fontSize: 13, color: Colors.subtext, fontWeight: '600' },
  addBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addBtnText: { color: Colors.bg, fontWeight: '700', fontSize: 14 },
});

// ─── Main Modal ──────────────────────────────────────────────────────

export default function NewAnalysisModal({ visible, onClose, onDone, initialUrl }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [inputMode, setInputMode] = useState<'file' | 'youtube'>('file');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [step1Loading, setStep1Loading] = useState(false);

  // Step 2
  const [videoStem, setVideoStem] = useState('');
  const [showRinkPicker, setShowRinkPicker] = useState(false);
  const [homographyMatrix, setHomographyMatrix] = useState<number[] | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [teamColors, setTeamColors] = useState<TeamColorInfo[]>([]);
  const [homeColorIdx, setHomeColorIdx] = useState<number | null>(null);
  const [homePickedColor, setHomePickedColor] = useState<string | null>(null);
  const [awayPickedColor, setAwayPickedColor] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState<'home' | 'away' | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [step2Loading, setStep2Loading] = useState(false);
  const [prescanResult, setPrescanResult] = useState<PrescanResult | null>(null);
  const [prescanLoading, setPrescanLoading] = useState(false);
  const [firstFrameUri, setFirstFrameUri] = useState<string>('');
  const [benchConfig, setBenchConfig] = useState<any>(null);
  const [showBenchSetup, setShowBenchSetup] = useState(false);

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

  // Step 3
  const [jobId, setJobId] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('분석 중...');
  const [done, setDone] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setStep(1);
    setInputMode('file');
    setUrl('');
    setYoutubeUrl('');
    setStep1Loading(false);
    setVideoStem('');
    setShowRinkPicker(false);
    setHomographyMatrix(null);
    setColors([]);
    setTeamColors([]);
    setHomeColorIdx(null);
    setHomePickedColor(null);
    setAwayPickedColor(null);
    setShowPalette(null);
    setRoster([]);
    setStep2Loading(false);
    setPrescanResult(null);
    setPrescanLoading(false);
    setBenchConfig(null);
    setShowBenchSetup(false);
    setJobId('');
    setProgress(0);
    setStatusMsg('분석 중...');
    setDone(false);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Step 1: YouTube 분석 ──────────────────────────────────────────

  const handleYoutubeAnalyze = async () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('오류', 'YouTube URL을 입력해주세요.');
      return;
    }
    setStep1Loading(true);
    try {
      const result = await analyzeYoutube(youtubeUrl.trim());
      setVideoStem(result.video_stem);
      await pollUntilDone(result.job_id, () => {});
      const preview = await getColorPreview(result.video_stem);
      setColors(preview.colors ?? []);
      setTeamColors(preview.team_colors ?? []);
      const { API_BASE_URL } = await import('../api/config');
      setFirstFrameUri(`${API_BASE_URL}/frame/${result.video_stem}/first`);
      setHomeColorIdx(0);
      setShowRinkPicker(true);
      setStep(2);
      setPrescanLoading(true);
      try {
        const ps = await prescanVideo(result.video_stem, homePickedColor ?? undefined, awayPickedColor ?? undefined);
        setPrescanResult(ps);
      } catch {}
      setPrescanLoading(false);
    } catch (e: any) {
      Alert.alert('분석 오류', e.message || JSON.stringify(e));
    } finally {
      setStep1Loading(false);
    }
  };

  // ── Step 1: 빠른 색상 분석 ────────────────────────────────────────

  const handleQuickAnalyze = async () => {
    if (!url.trim()) {
      Alert.alert('오류', '영상을 선택해주세요.');
      return;
    }
    setStep1Loading(true);
    try {
      // 파일 업로드 + 분석
      const filename = url.split('/').pop() || 'video.mp4';
      const result = await uploadAndAnalyze(url.trim(), filename, { fps: 4 });
      setVideoStem(result.video_stem);
      // 완료까지 폴링
      await pollUntilDone(result.job_id, () => {});
      // 색상 조회
      const preview = await getColorPreview(result.video_stem);
      setColors(preview.colors ?? []);
      setTeamColors(preview.team_colors ?? []);
      // 첫 프레임 이미지 URL 설정
      const { API_BASE_URL } = await import('../api/config');
      setFirstFrameUri(`${API_BASE_URL}/frame/${result.video_stem}/first`);
      setHomeColorIdx(0);
      setShowRinkPicker(true);
      setStep(2);
      // prescan 자동 실행
      setPrescanLoading(true);
      try {
        const ps = await prescanVideo(result.video_stem, homePickedColor ?? undefined, awayPickedColor ?? undefined);
        setPrescanResult(ps);
      } catch {}
      setPrescanLoading(false);
    } catch (e: any) {
      const errorMsg = e.message || JSON.stringify(e);
      console.error('[Step 1] 분석 오류:', errorMsg);
      Alert.alert('분석 오류', errorMsg);
    } finally {
      setStep1Loading(false);
    }
  };

  const pollUntilDone = (jid: string, onTick: (s: JobStatus) => void) =>
    new Promise<JobStatus>((resolve, reject) => {
      const iv = setInterval(async () => {
        try {
          const s = await getAnalysisStatus(jid);
          onTick(s);
          if (s.status === 'done') {
            clearInterval(iv);
            resolve(s);
          } else if (s.status === 'error') {
            clearInterval(iv);
            reject(new Error(s.message));
          }
        } catch {
          // 네트워크 일시 오류 무시, 계속 폴링
        }
      }, POLL_INTERVAL);
    });

  // ── Step 2: roster + 전체 분석 시작 ─────────────────────────────

  const handleAddPlayer = (p: { jersey: string; name: string; age: string; team: 'HOME' | 'AWAY' }) => {
    const awayColorIdx = homeColorIdx !== null ? (homeColorIdx === 0 ? 1 : 0) : 1;
    const entry: RosterEntry = {
      jersey: p.jersey,
      name: p.name,
      age: p.age || undefined,
      team: p.team,
      color_cluster: p.team === 'HOME' ? (homeColorIdx ?? 0) : awayColorIdx,
    };
    setRoster(r => [...r, entry]);
  };

  const handleRemovePlayer = (idx: number) => {
    setRoster(r => r.filter((_, i) => i !== idx));
  };

  const handleFullAnalyze = async () => {
    setStep2Loading(true);
    try {
      const resolvedHomeIdx = homeColorIdx ?? 0;
      const awayColorIdx = resolvedHomeIdx === 0 ? 1 : 0;
      const opts: FullAnalyzeOptions = {
        fps: 4,
        home_color_cluster: resolvedHomeIdx,
        away_color_cluster: awayColorIdx,
        ...(homePickedColor && {
          home_color: JERSEY_PALETTE.find(p => p.hex === homePickedColor)?.name ?? homePickedColor,
        }),
        ...(awayPickedColor && {
          away_color: JERSEY_PALETTE.find(p => p.hex === awayPickedColor)?.name ?? awayPickedColor,
        }),
        home_jersey_hex: homePickedColor ?? '',
        away_jersey_hex: awayPickedColor ?? '',
      };
      const result = await analyzeWithRoster(videoStem, roster, opts);
      setJobId(result.job_id);
      setStep(3);
      startPollingStep3(result.job_id);
    } catch (e: any) {
      const errorMsg = e.message || JSON.stringify(e);
      console.error('[Step 2] 분석 오류:', errorMsg);
      Alert.alert('분석 오류', errorMsg);
    } finally {
      setStep2Loading(false);
    }
  };

  // ── Step 3: 진행률 폴링 ───────────────────────────────────────────

  const startPollingStep3 = (jid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const s = await getAnalysisStatus(jid);
        setProgress(s.progress ?? 0);
        setStatusMsg(s.message ?? '분석 중...');
        if (s.status === 'done') {
          clearInterval(pollRef.current!);
          setProgress(100);
          setStatusMsg('분석 완료!');
          setDone(true);
        } else if (s.status === 'error') {
          clearInterval(pollRef.current!);
          setStatusMsg(`오류: ${s.message}`);
        }
      } catch (e: any) {
        const errorMsg = e.message || JSON.stringify(e);
        console.error('[Step 3 폴링] 오류:', errorMsg);
        setStatusMsg(`폴링 오류: ${errorMsg}`);
      }
    }, POLL_INTERVAL);
  };

  const handleDone = () => {
    const stem = videoStem;
    reset();
    onDone(stem);
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={s.root}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>새 경기 분석</Text>
          <Pressable onPress={handleClose} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Step indicator */}
        <View style={s.stepRow}>
          {[1, 2, 3].map(n => (
            <View key={n} style={s.stepItem}>
              <View style={[s.stepDot, step >= n && s.stepDotActive]}>
                <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
              </View>
              <Text style={[s.stepLabel, step >= n && s.stepLabelActive]}>
                {n === 1 ? 'URL 입력'
                 : n === 2 ? (step === 2 && showRinkPicker ? '라인 지정' : '색상 & 선수')
                 : '분석'}
              </Text>
              {n < 3 && <View style={[s.stepLine, step > n && s.stepLineActive]} />}
            </View>
          ))}
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.bodyContent} keyboardShouldPersistTaps="handled">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>📹 경기 영상 선택</Text>

              {/* 입력 모드 토글 */}
              <View style={s.modeToggle}>
                <Pressable
                  style={[s.modeBtn, inputMode === 'file' && s.modeBtnActive]}
                  onPress={() => setInputMode('file')}
                >
                  <Text style={[s.modeBtnText, inputMode === 'file' && s.modeBtnTextActive]}>
                    📁 갤러리
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.modeBtn, inputMode === 'youtube' && s.modeBtnActive]}
                  onPress={() => setInputMode('youtube')}
                >
                  <Text style={[s.modeBtnText, inputMode === 'youtube' && s.modeBtnTextActive]}>
                    🎥 YouTube
                  </Text>
                </Pressable>
              </View>

              {/* 갤러리 모드 */}
              {inputMode === 'file' && (
                <>
                  <Pressable
                    style={[s.filePickerBtn, url ? { borderColor: Colors.accent } : {}]}
                    onPress={pickVideo}
                  >
                    <Text style={[s.filePickerText, url ? { color: Colors.accent } : {}]}>
                      {url ? `✅ ${url.split('/').pop()}` : '📁 갤러리에서 영상 선택'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[s.primaryBtn, (!url || step1Loading) && s.primaryBtnDisabled]}
                    onPress={handleQuickAnalyze}
                    disabled={!url || step1Loading}
                  >
                    {step1Loading
                      ? <ActivityIndicator color={Colors.bg} />
                      : <Text style={s.primaryBtnText}>업로드 & 분석 시작</Text>
                    }
                  </Pressable>
                  {step1Loading && (
                    <Text style={s.hintText}>영상을 업로드하고 팀 색상을 추출 중입니다...</Text>
                  )}
                </>
              )}

              {/* YouTube 모드 */}
              {inputMode === 'youtube' && (
                <>
                  <TextInput
                    style={s.urlInput}
                    placeholder="https://youtube.com/watch?v=..."
                    placeholderTextColor={Colors.subtext}
                    value={youtubeUrl}
                    onChangeText={setYoutubeUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <Pressable
                    style={[s.primaryBtn, (!youtubeUrl.trim() || step1Loading) && s.primaryBtnDisabled]}
                    onPress={handleYoutubeAnalyze}
                    disabled={!youtubeUrl.trim() || step1Loading}
                  >
                    {step1Loading
                      ? <ActivityIndicator color={Colors.bg} />
                      : <Text style={s.primaryBtnText}>YouTube 분석 시작</Text>
                    }
                  </Pressable>
                  {step1Loading && (
                    <Text style={s.hintText}>YouTube에서 영상 다운로드 중입니다... (수 분 소요)</Text>
                  )}
                </>
              )}
            </View>
          )}

          {/* ── Step 2: 링크 라인 지정 (서브스텝) ── */}
          {step === 2 && showRinkPicker && (
            <View style={s.card}>
              <RinkLinePicker
                videoStem={videoStem}
                frameUri={firstFrameUri || undefined}
                onSave={(matrix) => {
                  setHomographyMatrix(matrix);
                  setShowRinkPicker(false);
                }}
                onSkip={() => setShowRinkPicker(false)}
              />
            </View>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && !showRinkPicker && (
            <>
              {/* prescan 결과 */}
              {prescanLoading && (
                <View style={s.card}>
                  <ActivityIndicator color={Colors.accent} />
                  <Text style={{ color: Colors.subtext, marginTop: 8, textAlign: "center" }}>영상 품질 분석 중...</Text>
                </View>
              )}
              {prescanResult && !prescanLoading && (
                <View style={[s.card, {
                  borderColor:
                    prescanResult.verdict === "PASS" ? "#34C759" :
                    prescanResult.verdict === "FAIL" ? "#FF3B30" : "#FFD700",
                  borderWidth: 2,
                }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.text }}>
                      {prescanResult.verdict === "PASS" ? "✅" :
                       prescanResult.verdict === "FAIL" ? "❌" : "⚠️"} 영상 품질: {prescanResult.verdict}
                    </Text>
                    <Text style={{ color: Colors.subtext }}>{prescanResult.score}/{prescanResult.max_score}점</Text>
                  </View>

                  {/* 항목별 간략 표시 */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {Object.entries(prescanResult.checks).map(([key, val]) => {
                      const label: Record<string, string> = {
                        player_size: "선수크기", detection_count: "감지수",
                        ocr_readability: "번호인식", team_distinction: "팀구분",
                        camera_stability: "안정성", rink_coverage: "커버리지",
                      };
                      const emoji = val.grade === "excellent" ? "⭐" : val.grade === "good" ? "✅" : val.grade === "fair" ? "⚠️" : "❌";
                      return (
                        <View key={key} style={{ backgroundColor: Colors.input, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 11, color: Colors.text }}>{emoji} {label[key]}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* 개선 팁 */}
                  {prescanResult.tips.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      {prescanResult.tips.slice(0, 2).map((tip, i) => (
                        <Text key={i} style={{ color: "#FFD700", fontSize: 12, marginTop: 4 }}>
                          {tip.title}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* 가능 기능 */}
                  <Text style={{ color: Colors.subtext, fontSize: 11, marginTop: 8 }}>
                    가능: {Object.entries(prescanResult.features).filter(([, v]) => v.startsWith("✅")).map(([k]) => k).join(", ")}
                  </Text>
                </View>
              )}

              {/* 색상 선택 */}
              <View style={s.card}>
                <Text style={s.cardTitle}>🎨 팀 색상 선택</Text>
                <Text style={s.cardSubtitle}>서버 분석 결과와 직접 선택을 비교해보세요</Text>

                {/* 홈팀 */}
                <View style={{ marginTop: 12, gap: 8 }}>
                  <Text style={{ color: Colors.accent, fontWeight: '700' }}>🏠 홈팀</Text>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {colors.length > 0 && (
                      <View style={{ alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors[homeColorIdx ?? 0], borderWidth: 2, borderColor: Colors.border }} />
                        <Text style={{ fontSize: 9, color: Colors.subtext }}>AI 추출</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => setShowPalette(showPalette === 'home' ? null : 'home')}
                      style={{ alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: homePickedColor ?? '#cccccc', borderWidth: 2, borderColor: Colors.accent }} />
                      <Text style={{ fontSize: 9, color: Colors.accent }}>직접 선택</Text>
                    </Pressable>
                    {homePickedColor && (
                      <Text style={{ color: Colors.text, fontSize: 12 }}>
                        {JERSEY_PALETTE.find(p => p.hex === homePickedColor)?.label ?? homePickedColor}
                      </Text>
                    )}
                  </View>

                  {showPalette === 'home' && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {JERSEY_PALETTE.map(p => (
                        <Pressable
                          key={p.name}
                          onPress={() => { setHomePickedColor(p.hex); setShowPalette(null); }}
                          style={{ alignItems: 'center', gap: 2 }}>
                          <View style={[
                            { width: 36, height: 36, borderRadius: 18, backgroundColor: p.hex, borderWidth: 2 },
                            homePickedColor === p.hex ? { borderColor: Colors.accent } : { borderColor: Colors.border },
                          ]} />
                          <Text style={{ fontSize: 8, color: Colors.subtext, width: 36, textAlign: 'center' }}>{p.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* 어웨이팀 */}
                <View style={{ marginTop: 16, gap: 8 }}>
                  <Text style={{ color: AWAY_COLOR, fontWeight: '700' }}>✈️ 어웨이팀</Text>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {colors.length > 1 && (
                      <View style={{ alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors[homeColorIdx !== null ? (homeColorIdx === 0 ? 1 : 0) : 1], borderWidth: 2, borderColor: Colors.border }} />
                        <Text style={{ fontSize: 9, color: Colors.subtext }}>AI 추출</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => setShowPalette(showPalette === 'away' ? null : 'away')}
                      style={{ alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: awayPickedColor ?? '#cccccc', borderWidth: 2, borderColor: AWAY_COLOR }} />
                      <Text style={{ fontSize: 9, color: AWAY_COLOR }}>직접 선택</Text>
                    </Pressable>
                    {awayPickedColor && (
                      <Text style={{ color: Colors.text, fontSize: 12 }}>
                        {JERSEY_PALETTE.find(p => p.hex === awayPickedColor)?.label ?? awayPickedColor}
                      </Text>
                    )}
                  </View>

                  {showPalette === 'away' && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {JERSEY_PALETTE.map(p => (
                        <Pressable
                          key={p.name}
                          onPress={() => { setAwayPickedColor(p.hex); setShowPalette(null); }}
                          style={{ alignItems: 'center', gap: 2 }}>
                          <View style={[
                            { width: 36, height: 36, borderRadius: 18, backgroundColor: p.hex, borderWidth: 2 },
                            awayPickedColor === p.hex ? { borderColor: AWAY_COLOR } : { borderColor: Colors.border },
                          ]} />
                          <Text style={{ fontSize: 8, color: Colors.subtext, width: 36, textAlign: 'center' }}>{p.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* 선수 입력 */}
              <View style={s.card}>
                <Text style={s.cardTitle}>선수 등록 (선택)</Text>
                <PlayerAddForm onAdd={handleAddPlayer} />
                {roster.length > 0 && (
                  <View style={s.rosterList}>
                    {roster.map((p, idx) => (
                      <View key={idx} style={s.rosterItem}>
                        <View
                          style={[
                            s.rosterTeamDot,
                            { backgroundColor: p.team === 'HOME' ? Colors.accent : AWAY_COLOR },
                          ]}
                        />
                        <Text style={s.rosterText}>
                          #{p.jersey} {p.name}
                          {p.age ? ` (${p.age})` : ''}
                        </Text>
                        <Text style={[s.rosterTeamTag, { color: p.team === 'HOME' ? Colors.accent : AWAY_COLOR }]}>
                          {p.team === 'HOME' ? '홈' : '어웨이'}
                        </Text>
                        <Pressable onPress={() => handleRemovePlayer(idx)} style={s.rosterDelete}>
                          <Text style={s.rosterDeleteText}>✕</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Pressable
                style={[s.primaryBtn, (step2Loading || !homePickedColor || !awayPickedColor) && s.primaryBtnDisabled]}
                onPress={handleFullAnalyze}
                disabled={step2Loading || !homePickedColor || !awayPickedColor}
              >
                {step2Loading ? (
                  <ActivityIndicator color={Colors.bg} />
                ) : !homePickedColor || !awayPickedColor ? (
                  <Text style={s.primaryBtnText}>홈/어웨이 색상을 선택하세요</Text>
                ) : (
                  <Text style={s.primaryBtnText}>전체 분석 시작</Text>
                )}
              </Pressable>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>분석 진행 중</Text>

              {/* 진행률 바 */}
              <View style={s.progressBarBg}>
                <View style={[s.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
              </View>
              <Text style={s.progressPct}>{Math.round(progress)}%</Text>
              <Text style={s.statusMsg}>{statusMsg}</Text>

              {!done && <ActivityIndicator color={Colors.accent} style={{ marginTop: 24 }} />}

              {done && (
                <Pressable style={[s.primaryBtn, { marginTop: 32 }]} onPress={handleDone}>
                  <Text style={s.primaryBtnText}>완료 — 분석 탭으로</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 18, color: Colors.subtext },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 0,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  stepNum: { fontSize: 12, fontWeight: '700', color: Colors.subtext },
  stepNumActive: { color: Colors.accent },
  stepLabel: { fontSize: 11, color: Colors.subtext, marginLeft: 6 },
  stepLabelActive: { color: Colors.text },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: Colors.accent },

  body: { flex: 1 },
  bodyContent: { padding: 20, gap: 16, paddingBottom: 48 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.subtext, marginTop: -8 },

  filePickerBtn: {
    backgroundColor: Colors.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center' as const,
  },
  filePickerText: {
    color: Colors.subtext,
    fontSize: 14,
    fontWeight: '600' as const,
  },

  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 16 },

  hintText: { fontSize: 13, color: Colors.subtext, textAlign: 'center' },

  modeToggle: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.input, alignItems: 'center',
  },
  modeBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.subtext },
  modeBtnTextActive: { color: Colors.accent },

  urlInput: {
    backgroundColor: Colors.input, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: Colors.text, fontSize: 13,
    borderWidth: 1, borderColor: Colors.border,
  },

  // Color selection
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorOption: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
  },
  colorOptionSelected: { borderColor: Colors.accent },
  colorBadge: { width: 48, height: 48, borderRadius: 24 },
  colorBadgeSmall: { width: 20, height: 20, borderRadius: 10 },
  colorHex: { fontSize: 12, color: Colors.subtext, fontFamily: 'monospace' },
  colorTeamLabel: { fontSize: 13, fontWeight: '700', color: Colors.subtext },

  colorSummary: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    paddingTop: 4,
  },
  colorSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorSummaryText: { fontSize: 14, fontWeight: '700' },

  // Roster list
  rosterList: { gap: 8, marginTop: 4 },
  rosterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rosterTeamDot: { width: 10, height: 10, borderRadius: 5 },
  rosterText: { flex: 1, fontSize: 14, color: Colors.text },
  rosterTeamTag: { fontSize: 12, fontWeight: '600' },
  rosterDelete: { padding: 4 },
  rosterDeleteText: { fontSize: 14, color: Colors.subtext },

  // Step 3 progress
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.input,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  progressPct: { fontSize: 28, fontWeight: '800', color: Colors.accent, textAlign: 'center' },
  statusMsg: { fontSize: 14, color: Colors.subtext, textAlign: 'center' },
});
