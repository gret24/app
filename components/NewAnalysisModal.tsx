import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { JERSEY_PALETTE } from '../constants/jerseyPalette';
import BenchSetupScreen, { BenchConfig } from './BenchSetupScreen';
import {
  quickAnalyze,
  getColorPreview,
  analyzeWithRoster,
  getAnalysisStatus,
  RosterEntry,
  FullAnalyzeOptions,
  JobStatus,
  TeamColorInfo,
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
  const [url, setUrl] = useState(initialUrl ?? '');
  const [step1Loading, setStep1Loading] = useState(false);

  // Step 2
  const [videoStem, setVideoStem] = useState('');
  const [quickJobId, setQuickJobId] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [teamColors, setTeamColors] = useState<TeamColorInfo[]>([]);
  const [homeColorIdx, setHomeColorIdx] = useState<number | null>(null);
  const [homePickedColor, setHomePickedColor] = useState<string | null>(null);
  const [awayPickedColor, setAwayPickedColor] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState<'home' | 'away' | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [step2Loading, setStep2Loading] = useState(false);
  const [showBenchSetup, setShowBenchSetup] = useState(false);
  const [benchConfig, setBenchConfig] = useState<BenchConfig | null>(null);
  const [firstFrameUri, setFirstFrameUri] = useState<string>('');

  // Step 3
  const [jobId, setJobId] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('분석 중...');
  const [done, setDone] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setStep(1);
    setUrl('');
    setStep1Loading(false);
    setVideoStem('');
    setQuickJobId('');
    setColors([]);
    setTeamColors([]);
    setHomeColorIdx(null);
    setHomePickedColor(null);
    setAwayPickedColor(null);
    setShowPalette(null);
    setRoster([]);
    setStep2Loading(false);
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

  // ── Step 1: 빠른 색상 분석 ────────────────────────────────────────

  const handleQuickAnalyze = async () => {
    if (!url.trim()) {
      Alert.alert('오류', 'YouTube URL을 입력해 주세요.');
      return;
    }
    setStep1Loading(true);
    try {
      const result = await quickAnalyze(url.trim());
      setQuickJobId(result.job_id);
      setVideoStem(result.video_stem);
      // 완료까지 폴링
      await pollUntilDone(result.job_id, () => {});
      // 색상 조회
      const preview = await getColorPreview(result.video_stem);
      setColors(preview.colors ?? []);
      setTeamColors(preview.team_colors ?? []);
      // 첫 프레임 이미지 URL 설정 (벤치 지정용)
      const { API_BASE_URL } = await import('../api/config');
      setFirstFrameUri(`${API_BASE_URL}/frame/${result.video_stem}/first`);
      setHomeColorIdx(0);
      setStep(2);
    } catch (e: any) {
      Alert.alert('분석 오류', e.message ?? '빠른 분석에 실패했습니다.');
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
        bench_config: benchConfig,
      };
      const result = await analyzeWithRoster(url.trim(), roster, opts);
      setJobId(result.job_id);
      setStep(3);
      startPollingStep3(result.job_id);
    } catch (e: any) {
      Alert.alert('분석 오류', e.message ?? '전체 분석 시작에 실패했습니다.');
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
      } catch {
        // 무시
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
                {n === 1 ? 'URL 입력' : n === 2 ? '색상 & 선수' : '분석'}
              </Text>
              {n < 3 && <View style={[s.stepLine, step > n && s.stepLineActive]} />}
            </View>
          ))}
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.bodyContent} keyboardShouldPersistTaps="handled">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>YouTube URL 입력</Text>
              <TextInput
                style={s.urlInput}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={Colors.subtext}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Pressable
                style={[s.primaryBtn, step1Loading && s.primaryBtnDisabled]}
                onPress={handleQuickAnalyze}
                disabled={step1Loading}
              >
                {step1Loading ? (
                  <ActivityIndicator color={Colors.bg} />
                ) : (
                  <Text style={s.primaryBtnText}>색상 분석 시작</Text>
                )}
              </Pressable>
              {step1Loading && (
                <Text style={s.hintText}>영상에서 팀 색상을 추출 중입니다. 잠시만 기다려 주세요...</Text>
              )}
            </View>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
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

              {/* 벤치 위치 */}
              <View style={s.card}>
                <Text style={s.cardTitle}>🏒 벤치 위치 (선택)</Text>
                <Text style={s.cardSubtitle}>지정하면 아이스타임 정확도가 향상됩니다</Text>
                {benchConfig ? (
                  <View style={{flexDirection:"row",alignItems:"center",gap:10,marginTop:8}}>
                    <Text style={{color:"#34C759",fontWeight:"700"}}>
                      ✅ {benchConfig.preset ? `${benchConfig.preset} 프리셋` : "수동 지정 완료"}
                    </Text>
                    <Pressable onPress={()=>setBenchConfig(null)}>
                      <Text style={{color:Colors.subtext,fontSize:12}}>초기화</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={{marginTop:8,backgroundColor:Colors.input,borderRadius:10,
                            padding:12,alignItems:"center",borderWidth:1,borderColor:Colors.border}}
                    onPress={()=>setShowBenchSetup(true)}>
                    <Text style={{color:Colors.accent,fontWeight:"700"}}>📍 벤치 위치 지정하기</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                style={[s.primaryBtn, step2Loading && s.primaryBtnDisabled]}
                onPress={handleFullAnalyze}
                disabled={step2Loading}
              >
                {step2Loading ? (
                  <ActivityIndicator color={Colors.bg} />
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

      <BenchSetupScreen
        visible={showBenchSetup}
        frameUri={firstFrameUri}
        onDone={(cfg) => { setBenchConfig(cfg); setShowBenchSetup(false); }}
        onSkip={() => setShowBenchSetup(false)}
      />
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

  urlInput: {
    backgroundColor: Colors.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
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
