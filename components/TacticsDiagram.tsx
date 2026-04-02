import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  Marker,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

type TeamSide = 'HOME' | 'AWAY';

interface Play {
  name: string;
  starts: [number, number][];
  ends: [number, number][];
  jerseys: string[];
}

const PLAYS: Play[] = [
  {
    name: 'Breakout',
    starts: [[40,70],[60,40],[60,100],[90,70],[30,70]],
    ends:   [[200,70],[180,35],[180,105],[160,70],[240,70]],
    jerseys: ['91','24','96','2','21'],
  },
  {
    name: 'Power Play',
    starts: [[200,70],[180,35],[180,105],[160,70],[240,70]],
    ends:   [[240,70],[210,30],[210,110],[260,50],[260,90]],
    jerseys: ['91','24','96','2','21'],
  },
  {
    name: 'Forecheck',
    starts: [[200,70],[180,35],[180,105],[160,70],[240,70]],
    ends:   [[270,45],[270,95],[230,70],[200,35],[200,105]],
    jerseys: ['91','24','96','2','21'],
  },
];

const RINK_W = 320;
const RINK_H = 140;

// Animate between two numeric values
function useAnimatedPos(start: number, end: number, trigger: number, duration: number) {
  const anim = useRef(new Animated.Value(start)).current;
  useEffect(() => {
    anim.setValue(start);
    Animated.timing(anim, {
      toValue: end,
      duration,
      useNativeDriver: false,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return anim;
}

interface PlayerDotProps {
  sx: number; sy: number;
  ex: number; ey: number;
  color: string;
  jersey: string;
  trigger: number;
}

function PlayerDot({ sx, sy, ex, ey, color, jersey, trigger }: PlayerDotProps) {
  const x = useAnimatedPos(sx, ex, trigger, 1500);
  const y = useAnimatedPos(sy, ey, trigger, 1500);

  // We render using a foreign-object-like approach: absolute positioned View over SVG
  // Use percentage of viewBox mapped to container width
  return (
    <Animated.View
      style={[
        styles.playerDot,
        {
          backgroundColor: color,
          left: x.interpolate({ inputRange: [0, RINK_W], outputRange: ['0%', '100%'] }),
          top:  y.interpolate({ inputRange: [0, RINK_H], outputRange: ['0%', '100%'] }),
          transform: [{ translateX: -12 }, { translateY: -12 }],
        },
      ]}
    >
      <Text style={styles.playerDotText}>{jersey}</Text>
    </Animated.View>
  );
}

interface ArrowLayerProps {
  play: Play;
  phase: 'start' | 'end';
}

function ArrowLayer({ play, phase }: ArrowLayerProps) {
  const positions = phase === 'start' ? play.starts : play.ends;
  const paths = play.starts.map((s, i) => {
    const [x1, y1] = s;
    const [x2, y2] = play.ends[i];
    // midpoint for slight curve
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 15;
    return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  });

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${RINK_W} ${RINK_H}`}
      style={StyleSheet.absoluteFillObject}
    >
      <Defs>
        <Marker
          id="arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <Path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.7)" />
        </Marker>
      </Defs>
      {paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.5}
          strokeDasharray="5,4"
          fill="none"
          markerEnd="url(#arrow)"
        />
      ))}
    </Svg>
  );
}

function HockeyRink() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${RINK_W} ${RINK_H}`}
      style={StyleSheet.absoluteFillObject}
    >
      {/* Rink background */}
      <Rect x={4} y={4} width={312} height={132} rx={20} fill="#0a1628" stroke="#333" strokeWidth={1.5} />

      {/* Blue lines */}
      <Line x1={107} y1={4} x2={107} y2={136} stroke="#4488FF" strokeWidth={2} />
      <Line x1={213} y1={4} x2={213} y2={136} stroke="#4488FF" strokeWidth={2} />

      {/* Red center line */}
      <Line x1={160} y1={4} x2={160} y2={136} stroke="#FF4444" strokeWidth={2} />

      {/* Center faceoff circle */}
      <Circle cx={160} cy={70} r={22} stroke="#FF4444" strokeWidth={1.5} fill="none" opacity={0.8} />
      <Circle cx={160} cy={70} r={2} fill="#FF4444" />

      {/* Left goal crease */}
      <Rect x={4} y={53} width={16} height={34} rx={4} fill="#4488FF22" stroke="#4488FF" strokeWidth={1} />
      <Circle cx={40} cy={70} r={2.5} fill="#FF4444" />

      {/* Right goal crease */}
      <Rect x={300} y={53} width={16} height={34} rx={4} fill="#4488FF22" stroke="#4488FF" strokeWidth={1} />
      <Circle cx={280} cy={70} r={2.5} fill="#FF4444" />

      {/* Faceoff circles */}
      <Circle cx={70}  cy={42}  r={10} stroke="#FF4444" strokeWidth={1} fill="none" opacity={0.6} />
      <Circle cx={70}  cy={98}  r={10} stroke="#FF4444" strokeWidth={1} fill="none" opacity={0.6} />
      <Circle cx={250} cy={42}  r={10} stroke="#FF4444" strokeWidth={1} fill="none" opacity={0.6} />
      <Circle cx={250} cy={98}  r={10} stroke="#FF4444" strokeWidth={1} fill="none" opacity={0.6} />
    </Svg>
  );
}

interface Props {
  team?: TeamSide;
  autoPlay?: boolean;
}

export default function TacticsDiagram({ team = 'HOME', autoPlay = true }: Props) {
  const [playIdx, setPlayIdx] = useState(0);
  const [trigger, setTrigger]   = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [phase, setPhase] = useState<'start' | 'end'>('start');

  const color = team === 'HOME' ? '#00D4FF' : '#FF6644';
  const play = PLAYS[playIdx];

  // Auto-cycle
  useEffect(() => {
    if (!isPlaying) return;
    setPhase('start');
    setTrigger(t => t + 1);

    const toEnd = setTimeout(() => setPhase('end'), 100);
    const toNext = setTimeout(() => {
      setPlayIdx(i => (i + 1) % PLAYS.length);
    }, 3200);

    return () => { clearTimeout(toEnd); clearTimeout(toNext); };
  }, [isPlaying, playIdx]);

  const goTo = (idx: number) => {
    setPlayIdx(((idx % PLAYS.length) + PLAYS.length) % PLAYS.length);
    setPhase('start');
    setTrigger(t => t + 1);
    setTimeout(() => setPhase('end'), 100);
  };

  return (
    <View style={styles.wrapper}>
      {/* Play name label */}
      <View style={styles.labelRow}>
        <Text style={styles.playName}>{play.name}</Text>
        <Text style={styles.playCounter}>{playIdx + 1} / {PLAYS.length}</Text>
      </View>

      {/* Rink container */}
      <View style={styles.rinkContainer}>
        <HockeyRink />
        <ArrowLayer play={play} phase={phase} />
        {play.starts.map((s, i) => {
          const e = play.ends[i];
          return (
            <PlayerDot
              key={i}
              sx={s[0]} sy={s[1]}
              ex={e[0]} ey={e[1]}
              color={color}
              jersey={play.jerseys[i]}
              trigger={trigger + (phase === 'end' ? 1 : 0)}
            />
          );
        })}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable style={styles.ctrlBtn} onPress={() => goTo(playIdx - 1)}>
          <Text style={styles.ctrlText}>‹</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, styles.ctrlBtnMain]}
          onPress={() => setIsPlaying(p => !p)}
        >
          <Text style={[styles.ctrlText, { color: '#0a1628', fontWeight: '800' }]}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={() => goTo(playIdx + 1)}>
          <Text style={styles.ctrlText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0d1f38',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#e0f0ff',
    letterSpacing: 0.5,
  },
  playCounter: {
    fontSize: 11,
    color: '#4a7aa0',
    fontWeight: '600',
  },
  rinkContainer: {
    width: '100%',
    aspectRatio: RINK_W / RINK_H,
    position: 'relative',
  },
  playerDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  playerDotText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  ctrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e5a8f',
  },
  ctrlBtnMain: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  ctrlText: {
    fontSize: 20,
    color: '#a0c8e8',
    fontWeight: '700',
  },
});
