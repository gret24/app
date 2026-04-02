import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import Svg, { Rect, Circle, Line, Path, Text as SvgText, Ellipse } from 'react-native-svg';
import { Colors } from '../constants/Colors';

interface Shift {
  shift_number?: number;
  start_time: number;
  end_time: number;
  duration: number;
}

interface Props {
  shifts: Shift[];
  playerJersey: string;
  playerTeam?: 'HOME' | 'AWAY';
  autoPlay?: boolean;
}

// 존 판별: 시프트 시간대 기반 (mock - 실제는 tracks 데이터 활용)
function getZoneForTime(start: number): 'O' | 'N' | 'D' {
  const mod = start % 3;
  if (mod === 0) return 'O';
  if (mod === 1) return 'N';
  return 'D';
}

// 존별 링크 X 좌표 (중앙)
const ZONE_X = { O: 240, N: 160, D: 80 };
const ZONE_COLOR = { O: '#FF335566', N: '#FFD70066', D: '#4488FF66' };
const ZONE_LABEL = { O: '공격 존', N: '뉴트럴', D: '수비 존' };
const RINK_W = 312, RINK_H = 132;

// 하키 링크 SVG
function Rink() {
  return (
    <>
      {/* 존 배경 */}
      <Rect x={4}   y={4} width={103} height={RINK_H} fill="#4488FF18" rx={0} />
      <Rect x={107} y={4} width={106} height={RINK_H} fill="#FFD70018" rx={0} />
      <Rect x={213} y={4} width={103} height={RINK_H} fill="#FF335518" rx={0} />
      {/* 외곽 */}
      <Rect x={4} y={4} width={RINK_W} height={RINK_H} rx={18} fill="none" stroke="#334" strokeWidth={2} />
      {/* 블루 라인 */}
      <Line x1={107} y1={4} x2={107} y2={136} stroke="#4488FF" strokeWidth={2} />
      <Line x1={213} y1={4} x2={213} y2={136} stroke="#4488FF" strokeWidth={2} />
      {/* 센터 */}
      <Line x1={160} y1={4} x2={160} y2={136} stroke="#FF4444" strokeWidth={1.5} />
      <Circle cx={160} cy={70} r={20} stroke="white" strokeWidth={1} fill="none" opacity={0.2} />
      {/* 페이스오프 서클 */}
      {[[45,40],[45,100],[275,40],[275,100]].map(([cx,cy],i) => (
        <Circle key={i} cx={cx} cy={cy} r={14} stroke="white" strokeWidth={1} fill="none" opacity={0.15} />
      ))}
      {/* 골대 */}
      <Rect x={8}   y={58} width={12} height={24} rx={3} fill="none" stroke="#888" strokeWidth={1.5} />
      <Rect x={300} y={58} width={12} height={24} rx={3} fill="none" stroke="#888" strokeWidth={1.5} />
      {/* 존 라벨 */}
      <SvgText x={55}  y={18} fontSize={8} fill="#6699FF" textAnchor="middle" opacity={0.8}>수비 존</SvgText>
      <SvgText x={160} y={18} fontSize={8} fill="#FFD700" textAnchor="middle" opacity={0.8}>뉴트럴</SvgText>
      <SvgText x={265} y={18} fontSize={8} fill="#FF6666" textAnchor="middle" opacity={0.8}>공격 존</SvgText>
    </>
  );
}

export default function IceTimeDiagram({ shifts, playerJersey, playerTeam = 'HOME', autoPlay = true }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const playerX = useRef(new Animated.Value(160)).current;
  const playerY = useRef(new Animated.Value(70)).current;
  const [displayX, setDisplayX] = useState(160);
  const [displayY, setDisplayY] = useState(70);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const color = playerTeam === 'HOME' ? Colors.accent : '#FF6644';

  const goToShift = (idx: number) => {
    if (!shifts.length) return;
    const shift = shifts[idx];
    const zone = getZoneForTime(shift.start_time);
    const targetX = ZONE_X[zone] + (Math.random() - 0.5) * 30;
    const targetY = 50 + Math.random() * 40;

    Animated.parallel([
      Animated.timing(playerX, { toValue: targetX, duration: 800, useNativeDriver: false }),
      Animated.timing(playerY, { toValue: targetY,  duration: 800, useNativeDriver: false }),
    ]).start();

    playerX.addListener(({ value }) => setDisplayX(value));
    playerY.addListener(({ value }) => setDisplayY(value));
  };

  useEffect(() => {
    if (shifts.length > 0) goToShift(0);
    return () => {
      playerX.removeAllListeners();
      playerY.removeAllListeners();
    };
  }, [shifts]);

  useEffect(() => {
    if (playing && shifts.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          const next = (prev + 1) % shifts.length;
          goToShift(next);
          return next;
        });
      }, 2000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, shifts]);

  if (!shifts.length) return null;

  const shift = shifts[currentIdx];
  const zone = getZoneForTime(shift.start_time);
  const fmtTime = (sec: number) => `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;

  return (
    <View style={s.container}>
      <Text style={s.title}>📍 아이스타임 다이어그램</Text>
      <Text style={s.subtitle}>
        Shift {(shift.shift_number ?? currentIdx + 1)}  |  {fmtTime(shift.start_time)} ~ {fmtTime(shift.end_time)}  |  {shift.duration}초
      </Text>

      {/* 링크 SVG */}
      <View style={s.rinkWrap}>
        <Svg width="100%" height={150} viewBox="0 0 320 140">
          <Rink />
          {/* 존 하이라이트 */}
          <Rect
            x={zone === 'D' ? 4 : zone === 'N' ? 107 : 213}
            y={4}
            width={106}
            height={RINK_H}
            fill={ZONE_COLOR[zone]}
            rx={0}
          />
          {/* 선수 점 (실제 좌표는 Animated가 따로 관리) */}
          <Circle cx={displayX} cy={displayY} r={12} fill={color} opacity={0.9} />
          <SvgText x={displayX} y={displayY + 4} fontSize={9} fill="black" textAnchor="middle" fontWeight="bold">
            #{playerJersey}
          </SvgText>
        </Svg>
      </View>

      {/* 존 표시 */}
      <View style={[s.zoneBadge, { backgroundColor: ZONE_COLOR[zone] }]}>
        <Text style={s.zoneBadgeText}>{ZONE_LABEL[zone]}</Text>
      </View>

      {/* 시프트 타임라인 */}
      <View style={s.timeline}>
        {shifts.map((sh, i) => {
          const z = getZoneForTime(sh.start_time);
          return (
            <Pressable
              key={i}
              style={[s.timelineSeg,
                { flex: sh.duration, backgroundColor: z === 'O' ? '#FF3355' : z === 'N' ? '#FFD700' : '#4488FF',
                  opacity: i === currentIdx ? 1 : 0.3 }]}
              onPress={() => { setCurrentIdx(i); goToShift(i); }}
            />
          );
        })}
      </View>
      <Text style={s.timelineHint}>전체 {shifts.length}개 시프트 · 탭으로 이동</Text>

      {/* 컨트롤 */}
      <View style={s.controls}>
        <Pressable style={s.ctrlBtn} onPress={() => {
          const prev = (currentIdx - 1 + shifts.length) % shifts.length;
          setCurrentIdx(prev); goToShift(prev);
        }}>
          <Text style={s.ctrlText}>‹</Text>
        </Pressable>
        <Pressable style={[s.ctrlBtn, s.playBtn]} onPress={() => setPlaying(p => !p)}>
          <Text style={s.playText}>{playing ? '⏸' : '▶'}</Text>
        </Pressable>
        <Pressable style={s.ctrlBtn} onPress={() => {
          const next = (currentIdx + 1) % shifts.length;
          setCurrentIdx(next); goToShift(next);
        }}>
          <Text style={s.ctrlText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.subtext },
  rinkWrap: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#0a1628' },
  zoneBadge: { alignSelf: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  zoneBadgeText: { fontSize: 13, fontWeight: '700', color: 'white' },
  timeline: { height: 12, flexDirection: 'row', borderRadius: 6, overflow: 'hidden', gap: 2 },
  timelineSeg: { borderRadius: 3 },
  timelineHint: { fontSize: 11, color: Colors.subtext, textAlign: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  ctrlBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  ctrlText: { fontSize: 22, color: Colors.text },
  playBtn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  playText: { fontSize: 18, color: Colors.bg },
});
