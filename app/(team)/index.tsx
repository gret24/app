import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { useRoster } from '../../contexts/RosterContext';
import PlayerForm from '../../components/PlayerForm';
import TacticsDiagram from '../../components/TacticsDiagram';

type TeamSide = 'HOME' | 'AWAY';
type TeamMenu = 'tactics' | 'recommendation' | 'players';
type Position = 'ALL' | 'LW' | 'RW' | 'C' | 'D' | 'G';
type SpeedFilter = 'ALL' | 'fast' | 'normal' | 'slow';
type AgeFilter = 'ALL' | 'U8' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | '18-25' | '26-32' | '33+';

interface PlayerStats {
  jersey: string;
  team: TeamSide;
  total_ice_time_min: number;
  total_shifts: number;
  total_ice_time_sec: number;
  position: Exclude<Position, 'ALL'>;
  age: number;
  shoot: 'L' | 'R';  // 레프트/라이트
}

const MOCK_VIDEOS = [
  { id: 'game1_val', label: 'Game 1 — KAHL DIV4', duration: '44:34' },
  { id: 'game2_4fps', label: 'Game 2 — Bluewhales', duration: '52:05' },
  { id: 'aigis_g18', label: 'Aigis G18', duration: '64:00' },
];

const MOCK_PLAYERS: Record<string, PlayerStats[]> = {
  game1_val: [
    { jersey: '91', team: 'HOME', total_ice_time_min: 37.4, total_shifts: 3,  total_ice_time_sec: 2244, position: 'C',  age: 28, shoot: 'L' },
    { jersey: '24', team: 'HOME', total_ice_time_min: 25.9, total_shifts: 21, total_ice_time_sec: 1554, position: 'LW', age: 22, shoot: 'L' },
    { jersey: '96', team: 'HOME', total_ice_time_min: 30.2, total_shifts: 18, total_ice_time_sec: 1812, position: 'D',  age: 31, shoot: 'R' },
    { jersey: '2',  team: 'HOME', total_ice_time_min: 20.7, total_shifts: 18, total_ice_time_sec: 1242, position: 'D',  age: 26, shoot: 'R' },
    { jersey: '21', team: 'HOME', total_ice_time_min: 24.6, total_shifts: 22, total_ice_time_sec: 1476, position: 'RW', age: 19, shoot: 'R' },
    { jersey: '5',  team: 'AWAY', total_ice_time_min: 18.0, total_shifts: 25, total_ice_time_sec: 1080, position: 'LW', age: 24, shoot: 'L' },
    { jersey: '91', team: 'AWAY', total_ice_time_min: 39.2, total_shifts: 2,  total_ice_time_sec: 2352, position: 'G',  age: 34, shoot: 'L' },
    { jersey: '24', team: 'AWAY', total_ice_time_min: 38.0, total_shifts: 7,  total_ice_time_sec: 2280, position: 'C',  age: 29, shoot: 'R' },
    { jersey: '96', team: 'AWAY', total_ice_time_min: 16.1, total_shifts: 26, total_ice_time_sec: 966,  position: 'RW', age: 17, shoot: 'L' },
  ],
  game2_4fps: [
    { jersey: '19', team: 'AWAY', total_ice_time_min: 8.1,  total_shifts: 11, total_ice_time_sec: 486,  position: 'C',  age: 23, shoot: 'L' },
    { jersey: '40', team: 'HOME', total_ice_time_min: 12.3, total_shifts: 15, total_ice_time_sec: 738,  position: 'D',  age: 27, shoot: 'R' },
    { jersey: '89', team: 'AWAY', total_ice_time_min: 6.5,  total_shifts: 8,  total_ice_time_sec: 390,  position: 'LW', age: 20, shoot: 'L' },
  ],
  aigis_g18: [
    { jersey: '47', team: 'HOME', total_ice_time_min: 24.9, total_shifts: 41, total_ice_time_sec: 1494, position: 'RW', age: 25, shoot: 'R' },
  ],
};

// 속도 분류 (평균 시프트 길이 기준)
const getSpeed = (p: PlayerStats): 'fast' | 'normal' | 'slow' => {
  const avg = p.total_ice_time_sec / p.total_shifts;
  if (avg < 40) return 'fast';
  if (avg < 90) return 'normal';
  return 'slow';
};
const getAgeGroup = (age: number): AgeFilter => {
  if (age < 8)  return 'U8';
  if (age < 10) return 'U8';
  if (age < 12) return 'U10';
  if (age < 14) return 'U12';
  if (age < 16) return 'U14';
  if (age < 18) return 'U16';
  if (age < 18) return 'U18';
  if (age <= 25) return '18-25';
  if (age <= 32) return '26-32';
  return '33+';
};

// 모의 전술 데이터
const MOCK_TACTICS = {
  home: { offensive: 40, neutral: 25, defensive: 35, breakout: 72, faceoffWin: 55 },
  away: { offensive: 38, neutral: 28, defensive: 34, breakout: 68, faceoffWin: 45 },
};

const MOCK_RECOMMENDATIONS = [
  { icon: '⚡', title: '갭 컨트롤 개선 필요', desc: '#96이 뉴트럴 존에서 갭이 넓어짐. 상대 속공 허용 위험.', severity: 'high' },
  { icon: '🔄', title: '라인 체인지 타이밍', desc: '4번째 라인 평균 시프트 41초. 피로도 관리 필요.', severity: 'med' },
  { icon: '🎯', title: '오펜시브 존 유지율', desc: '공격 존 체류 40%는 리그 평균 이상. 유지 권장.', severity: 'good' },
  { icon: '🥅', title: '페이스오프 전략', desc: '홈팀 페이스오프 승률 55%. 수비 존 페이스오프 집중 훈련 권장.', severity: 'med' },
];

// 하키 링크 미니 SVG
function MiniRink({ homeO, homeN, homeD }: { homeO: number; homeN: number; homeD: number }) {
  const W = 280, H = 110;
  const oW = W * homeO / 100;
  const nW = W * homeN / 100;
  const dW = W * homeD / 100;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={oW} height={H} fill="#FF335533" rx={0} />
      <Rect x={oW} y={0} width={nW} height={H} fill="#FFD70033" rx={0} />
      <Rect x={oW+nW} y={0} width={dW} height={H} fill="#0044FF33" rx={0} />
      <Rect x={0} y={0} width={W} height={H} stroke="#444" strokeWidth={1.5} fill="none" rx={8} />
      <Line x1={oW} y1={0} x2={oW} y2={H} stroke="#4488FF" strokeWidth={2} />
      <Line x1={oW+nW} y1={0} x2={oW+nW} y2={H} stroke="#4488FF" strokeWidth={2} />
      <Line x1={W/2} y1={0} x2={W/2} y2={H} stroke="#FF4444" strokeWidth={1.5} />
      <Circle cx={W/2} cy={H/2} r={18} stroke="white" strokeWidth={1} fill="none" opacity={0.3} />
      <SvgText x={oW/2} y={H/2+5} fontSize={11} fill="#FF6666" textAnchor="middle" fontWeight="bold">{homeO}%</SvgText>
      <SvgText x={oW+nW/2} y={H/2+5} fontSize={11} fill="#FFD700" textAnchor="middle" fontWeight="bold">{homeN}%</SvgText>
      <SvgText x={oW+nW+dW/2} y={H/2+5} fontSize={11} fill="#6699FF" textAnchor="middle" fontWeight="bold">{homeD}%</SvgText>
    </Svg>
  );
}

export default function TeamScreen() {
  const router = useRouter();
  const { players: rosterPlayers, addPlayer } = useRoster();
  const [showForm, setShowForm] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<typeof MOCK_VIDEOS[0] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamSide>('HOME');
  const [activeMenu, setActiveMenu] = useState<TeamMenu>('tactics');
  const [step, setStep] = useState<1 | 2>(1);
  const [posFilter, setPosFilter] = useState<Position>('ALL');
  const [speedFilter, setSpeedFilter] = useState<SpeedFilter>('ALL');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('ALL');

  const players = selectedVideo ? (MOCK_PLAYERS[selectedVideo.id] || []) : [];
  const teamPlayers = players
    .filter(p => p.team === selectedTeam)
    .filter(p => posFilter === 'ALL' || p.position === posFilter)
    .filter(p => speedFilter === 'ALL' || getSpeed(p) === speedFilter)
    .filter(p => ageFilter === 'ALL' || getAgeGroup(p.age) === ageFilter)
    .sort((a, b) => b.total_ice_time_min - a.total_ice_time_min);
  const maxIce = teamPlayers[0]?.total_ice_time_min || 1;

  const MENUS = [
    { key: 'tactics' as TeamMenu, label: '전술 분석', icon: '🗺️' },
    { key: 'recommendation' as TeamMenu, label: '전술 추천', icon: '💡' },
    { key: 'players' as TeamMenu, label: '선수 분석', icon: '👥' },
  ];

  return (
    <>
    <PlayerForm visible={showForm} onClose={() => setShowForm(false)} onSave={(p) => { addPlayer(p); setShowForm(false); }} />
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </Pressable>
        <Text style={styles.title}>🏟️ 팀 분석</Text>
      </View>

      {/* STEP 1: 영상 선택 */}
      {step === 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>경기 선택</Text>
          <View style={styles.videoList}>
            {MOCK_VIDEOS.map(v => (
              <Pressable
                key={v.id}
                style={styles.videoCard}
                onPress={() => { setSelectedVideo(v); setStep(2); }}
              >
                <View style={styles.videoThumb}><Text style={{ fontSize: 26 }}>🏒</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.videoLabel}>{v.label}</Text>
                  <Text style={styles.videoDur}>{v.duration}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* STEP 2: 팀 선택 + 메뉴 */}
      {step === 2 && selectedVideo && (
        <>
          {/* 팀 토글 */}
          <View style={styles.teamToggle}>
            {(['HOME', 'AWAY'] as TeamSide[]).map(t => (
              <Pressable
                key={t}
                style={[styles.teamToggleBtn, selectedTeam === t && styles.teamToggleBtnActive]}
                onPress={() => setSelectedTeam(t)}
              >
                <Text style={[styles.teamToggleText, selectedTeam === t && styles.teamToggleTextActive]}>
                  {t === 'HOME' ? '🏠 홈팀' : '✈️ 어웨이팀'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 메뉴 탭 */}
          <View style={styles.menuRow}>
            {MENUS.map(m => (
              <Pressable
                key={m.key}
                style={[styles.menuTab, activeMenu === m.key && styles.menuTabActive]}
                onPress={() => setActiveMenu(m.key)}
              >
                <Text style={styles.menuIcon}>{m.icon}</Text>
                <Text style={[styles.menuLabel, activeMenu === m.key && styles.menuLabelActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── 전술 분석 ── */}
          {activeMenu === 'tactics' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{selectedTeam === 'HOME' ? '홈팀' : '어웨이팀'} 존 점유율</Text>
              <View style={styles.rinkCard}>
                <MiniRink
                  homeO={selectedTeam === 'HOME' ? MOCK_TACTICS.home.offensive : MOCK_TACTICS.away.offensive}
                  homeN={selectedTeam === 'HOME' ? MOCK_TACTICS.home.neutral : MOCK_TACTICS.away.neutral}
                  homeD={selectedTeam === 'HOME' ? MOCK_TACTICS.home.defensive : MOCK_TACTICS.away.defensive}
                />
                <View style={styles.zoneLegend}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF3355' }]} /><Text style={styles.legendText}>공격 존</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} /><Text style={styles.legendText}>뉴트럴</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4488FF' }]} /><Text style={styles.legendText}>수비 존</Text></View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                {[
                  { label: '브레이크아웃 성공률', value: `${selectedTeam === 'HOME' ? MOCK_TACTICS.home.breakout : MOCK_TACTICS.away.breakout}%`, icon: '🚀' },
                  { label: '페이스오프 승률', value: `${selectedTeam === 'HOME' ? MOCK_TACTICS.home.faceoffWin : MOCK_TACTICS.away.faceoffWin}%`, icon: '🎯' },
                  { label: '공격 존 체류', value: `${selectedTeam === 'HOME' ? MOCK_TACTICS.home.offensive : MOCK_TACTICS.away.offensive}%`, icon: '⚔️' },
                  { label: '수비 존 체류', value: `${selectedTeam === 'HOME' ? MOCK_TACTICS.home.defensive : MOCK_TACTICS.away.defensive}%`, icon: '🛡️' },
                ].map((s, i) => (
                  <View key={i} style={styles.statCard}>
                    <Text style={styles.statIcon}>{s.icon}</Text>
                    <Text style={styles.statVal}>{s.value}</Text>
                    <Text style={styles.statLbl}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* 존 전환 흐름 */}
              <View style={styles.flowCard}>
                <Text style={styles.flowTitle}>존 전환 흐름</Text>
                {[
                  { from: 'D', to: 'N', count: 18, label: '수비→뉴트럴' },
                  { from: 'N', to: 'O', count: 14, label: '뉴트럴→공격' },
                  { from: 'O', to: 'N', count: 12, label: '공격→뉴트럴' },
                  { from: 'N', to: 'D', count: 9,  label: '뉴트럴→수비' },
                ].map((f, i) => (
                  <View key={i} style={styles.flowRow}>
                    <Text style={styles.flowLabel}>{f.label}</Text>
                    <View style={styles.flowBar}>
                      <View style={[styles.flowBarFill, { width: `${f.count / 20 * 100}%` as any }]} />
                    </View>
                    <Text style={styles.flowCount}>{f.count}회</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── 전술 추천 ── */}
          {activeMenu === 'recommendation' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>AI 전술 추천</Text>
              <View style={styles.recList}>
                {MOCK_RECOMMENDATIONS.map((r, i) => (
                  <View key={i} style={[styles.recCard,
                    r.severity === 'high' ? styles.recHigh :
                    r.severity === 'good' ? styles.recGood : styles.recMed]}>
                    <Text style={styles.recIcon}>{r.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.recHeader}>
                        <Text style={styles.recTitle}>{r.title}</Text>
                        <View style={[styles.recBadge,
                          { backgroundColor: r.severity === 'high' ? '#FF335533' : r.severity === 'good' ? '#00FF8833' : '#FFD70033' }]}>
                          <Text style={[styles.recBadgeText,
                            { color: r.severity === 'high' ? '#FF3355' : r.severity === 'good' ? '#00CC66' : '#FFD700' }]}>
                            {r.severity === 'high' ? '주의' : r.severity === 'good' ? '양호' : '보통'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.recDesc}>{r.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.sectionLabel}>전술 다이어그램</Text>
              <TacticsDiagram team={selectedTeam} autoPlay={true} />
            </View>
          )}

          {/* ── 선수 분석 ── */}
          {activeMenu === 'players' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {selectedTeam === 'HOME' ? '홈팀' : '어웨이팀'} 선수 분석
              </Text>

              {/* 포지션 필터 */}
              <Text style={styles.filterLabel}>포지션</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <View style={styles.filterRow}>
                  {(['ALL','LW','RW','C','D','G'] as Position[]).map(pos => (
                    <Pressable key={pos} style={[styles.filterChip, posFilter===pos && styles.filterChipActive]} onPress={() => setPosFilter(pos)}>
                      <Text style={[styles.filterChipText, posFilter===pos && styles.filterChipTextActive]}>
                        {pos === 'ALL' ? '전체' : pos === 'LW' ? '🏒L 레프트윙' : pos === 'RW' ? '🏒R 라이트윙' : pos === 'C' ? '🎯 센터' : pos === 'D' ? '🛡️ 수비' : '🥅 골리'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* 속도 필터 */}
              <Text style={styles.filterLabel}>속도</Text>
              <View style={[styles.filterRow, { marginBottom: 10 }]}>
                {(['ALL','fast','normal','slow'] as SpeedFilter[]).map(s => (
                  <Pressable key={s} style={[styles.filterChip, speedFilter===s && styles.filterChipActive]} onPress={() => setSpeedFilter(s)}>
                    <Text style={[styles.filterChipText, speedFilter===s && styles.filterChipTextActive]}>
                      {s==='ALL'?'전체': s==='fast'?'⚡ 빠름': s==='normal'?'🚶 보통':'🐢 느림'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* 나이대 필터 */}
              <Text style={styles.filterLabel}>나이대</Text>
              <View style={[styles.filterRow, { marginBottom: 16 }]}>
                {(['ALL','U8','U10','U12','U14','U16','U18','18-25','26-32','33+'] as AgeFilter[]).map(a => (
                  <Pressable key={a} style={[styles.filterChip, ageFilter===a && styles.filterChipActive]} onPress={() => setAgeFilter(a)}>
                    <Text style={[styles.filterChipText, ageFilter===a && styles.filterChipTextActive]}>
                      {a==='ALL'?'전체':
                       a==='U8'?'U8 (~7세)':
                       a==='U10'?'U10 (8~9세)':
                       a==='U12'?'U12 (10~11세)':
                       a==='U14'?'U14 (12~13세)':
                       a==='U16'?'U16 (14~15세)':
                       a==='U18'?'U18 (16~17세)':
                       a==='18-25'?'18~25세':
                       a==='26-32'?'26~32세':'33세~'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.resultCount}>{teamPlayers.length}명 해당</Text>

              {teamPlayers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>이 경기에 감지된 선수 없음</Text>
                </View>
              ) : (
                <View style={styles.playerList}>
                  {teamPlayers.map((p, i) => (
                    <View key={i} style={styles.playerRow}>
                      <View style={[styles.jerseyBadge, { backgroundColor: Colors.accent + '22' }]}>
                        <Text style={styles.jerseyNum}>#{p.jersey}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={styles.playerTagRow}>
                          <View style={styles.posBadge}><Text style={styles.posBadgeText}>{p.position}</Text></View>
                          <View style={[styles.shootBadge, { backgroundColor: p.shoot === 'L' ? '#00D4FF22' : '#FF664422' }]}>
                            <Text style={[styles.shootText, { color: p.shoot === 'L' ? Colors.accent : '#FF6644' }]}>{p.shoot === 'L' ? '레프트' : '라이트'}</Text>
                          </View>
                          <Text style={styles.ageText}>{p.age}세</Text>
                          <View style={[styles.speedBadge, { backgroundColor: getSpeed(p) === 'fast' ? '#00FF8822' : getSpeed(p) === 'normal' ? '#FFD70022' : '#88888822' }]}>
                            <Text style={[styles.speedText, { color: getSpeed(p) === 'fast' ? '#00CC66' : getSpeed(p) === 'normal' ? '#FFD700' : '#888' }]}>
                              {getSpeed(p) === 'fast' ? '⚡빠름' : getSpeed(p) === 'normal' ? '🚶보통' : '🐢느림'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.iceBarBg}>
                          <View style={[styles.iceBarFill, { width: `${p.total_ice_time_min / maxIce * 100}%` as any }]} />
                        </View>
                        <Text style={styles.playerStats}>
                          {p.total_ice_time_min.toFixed(1)}분 · {p.total_shifts}시프트
                        </Text>
                      </View>
                      <Text style={styles.iceTimeVal}>{p.total_ice_time_min.toFixed(1)}분</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 영상 변경 버튼 */}
          <Pressable style={styles.changeBtn} onPress={() => { setStep(1); setSelectedVideo(null); }}>
            <Text style={styles.changeBtnText}>다른 경기 선택</Text>
          </Pressable>

          {/* 선수 등록 버튼 */}
          <Pressable style={[styles.changeBtn, { borderColor: Colors.accent, marginTop: 8 }]} onPress={() => setShowForm(true)}>
            <Text style={{ color: Colors.accent, fontSize: 14, fontWeight: '700' }}>+ 선수 등록</Text>
          </Pressable>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  backBtn: { padding: 4 },
  backText: { color: Colors.accent, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.subtext, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  // 영상 목록
  videoList: { gap: 10 },
  videoCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12 },
  videoThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center' },
  videoLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  videoDur: { fontSize: 12, color: Colors.subtext },
  chevron: { fontSize: 22, color: Colors.subtext },
  // 팀 토글
  teamToggle: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, gap: 4 },
  teamToggleBtn: { flex: 1, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  teamToggleBtnActive: { backgroundColor: Colors.accent },
  teamToggleText: { fontSize: 14, fontWeight: '700', color: Colors.subtext },
  teamToggleTextActive: { color: Colors.bg },
  // 메뉴 탭
  menuRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  menuTab: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 4 },
  menuTabActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  menuIcon: { fontSize: 20 },
  menuLabel: { fontSize: 11, fontWeight: '700', color: Colors.subtext, textAlign: 'center' },
  menuLabelActive: { color: Colors.accent },
  // 링크 카드
  rinkCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginBottom: 16 },
  zoneLegend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.subtext },
  // 스탯 그리드
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '47%', backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 22 },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  statLbl: { fontSize: 11, color: Colors.subtext, textAlign: 'center' },
  // 존 전환
  flowCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  flowTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flowLabel: { fontSize: 12, color: Colors.subtext, width: 90 },
  flowBar: { flex: 1, height: 6, backgroundColor: Colors.input, borderRadius: 3, overflow: 'hidden' },
  flowBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  flowCount: { fontSize: 12, fontWeight: '700', color: Colors.text, width: 30, textAlign: 'right' },
  // 추천 카드
  recList: { gap: 10 },
  recCard: { flexDirection: 'row', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12, alignItems: 'flex-start' },
  recHigh: { backgroundColor: '#FF335511', borderColor: '#FF335544' },
  recMed:  { backgroundColor: '#FFD70011', borderColor: '#FFD70044' },
  recGood: { backgroundColor: '#00CC6611', borderColor: '#00CC6644' },
  recIcon: { fontSize: 24 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  recTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1 },
  recBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  recBadgeText: { fontSize: 10, fontWeight: '700' },
  recDesc: { fontSize: 12, color: Colors.subtext, lineHeight: 18 },
  // 필터
  filterLabel: { fontSize: 11, fontWeight: '700', color: Colors.subtext, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  filterChipText: { fontSize: 12, color: Colors.subtext, fontWeight: '600' },
  filterChipTextActive: { color: Colors.accent },
  resultCount: { fontSize: 12, color: Colors.subtext, marginBottom: 10 },
  // 선수 태그
  playerTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  posBadge: { backgroundColor: Colors.input, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  posBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.text },
  shootBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  shootText: { fontSize: 10, fontWeight: '700' },
  ageText: { fontSize: 10, color: Colors.subtext },
  speedBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  speedText: { fontSize: 10, fontWeight: '700' },
  // 선수 분석
  playerList: { gap: 8 },
  playerRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 10 },
  jerseyBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  jerseyNum: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  iceBarBg: { height: 6, backgroundColor: Colors.input, borderRadius: 3, overflow: 'hidden' },
  iceBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  playerStats: { fontSize: 11, color: Colors.subtext },
  iceTimeVal: { fontSize: 14, fontWeight: '700', color: Colors.text, minWidth: 40, textAlign: 'right' },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.subtext },
  // 기타
  changeBtn: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  changeBtnText: { color: Colors.subtext, fontSize: 14 },
});
