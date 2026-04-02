import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated, Pressable, StyleSheet, Text, View, ScrollView,
} from 'react-native';
import Svg, {
  Circle, Defs, Line, Marker, Path, Polygon, Rect,
  Text as SvgText,
} from 'react-native-svg';
import { TACTICS, TACTICS_BY_ID, type Tactic, type Position, type PlayerPositions } from '../tactics/data/tactics';
import { Colors } from '../constants/Colors';

// ─── Rink constants (viewBox 200 × 85) ──────────────────────────────────────
export const RINK_W = 200;
export const RINK_H = 85;

// ─── RinkSVG — exported so Feature 6 can reuse ────────────────────────────
export function RinkSVG({ style }: { style?: object }) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${RINK_W} ${RINK_H}`}
      style={[StyleSheet.absoluteFillObject, style]}
    >
      {/* Background */}
      <Rect x={0} y={0} width={RINK_W} height={RINK_H} fill="#0D1B2A" />
      {/* Rink border */}
      <Rect
        x={1} y={1} width={RINK_W - 2} height={RINK_H - 2}
        rx={10} fill="#0D1B2A"
        stroke="rgba(255,255,255,0.6)" strokeWidth={1}
      />

      {/* Blue lines */}
      <Line x1={67} y1={1} x2={67} y2={RINK_H - 1} stroke="#4488FF" strokeWidth={2} />
      <Line x1={133} y1={1} x2={133} y2={RINK_H - 1} stroke="#4488FF" strokeWidth={2} />

      {/* Red centre line */}
      <Line x1={100} y1={1} x2={100} y2={RINK_H - 1} stroke="#FF4444" strokeWidth={2} />

      {/* Centre circle */}
      <Circle cx={100} cy={42.5} r={12} stroke="#FF4444" strokeWidth={1.2} fill="none" opacity={0.8} />
      <Circle cx={100} cy={42.5} r={1.8} fill="#FF4444" />

      {/* Home goal (left) */}
      <Rect x={1} y={37} width={5} height={11} rx={1}
        fill="#4488FF22" stroke="#4488FFCC" strokeWidth={1} />

      {/* Away goal (right) */}
      <Rect x={RINK_W - 6} y={37} width={5} height={11} rx={1}
        fill="#FF444422" stroke="#FF4444CC" strokeWidth={1} />

      {/* Faceoff circles — 4 corners */}
      <Circle cx={40}  cy={21}   r={9} stroke="#FF4444" strokeWidth={1} fill="none" opacity={0.55} />
      <Circle cx={40}  cy={64}   r={9} stroke="#FF4444" strokeWidth={1} fill="none" opacity={0.55} />
      <Circle cx={160} cy={21}   r={9} stroke="#FF4444" strokeWidth={1} fill="none" opacity={0.55} />
      <Circle cx={160} cy={64}   r={9} stroke="#FF4444" strokeWidth={1} fill="none" opacity={0.55} />

      {/* Faceoff dots */}
      <Circle cx={40}  cy={21}   r={1.5} fill="#FF4444" opacity={0.7} />
      <Circle cx={40}  cy={64}   r={1.5} fill="#FF4444" opacity={0.7} />
      <Circle cx={160} cy={21}   r={1.5} fill="#FF4444" opacity={0.7} />
      <Circle cx={160} cy={64}   r={1.5} fill="#FF4444" opacity={0.7} />

      {/* Home crease */}
      <Path
        d={`M 6 37 Q 18 42.5 6 48`}
        stroke="#4488FFBB" strokeWidth={1} fill="#4488FF18"
      />
      {/* Away crease */}
      <Path
        d={`M ${RINK_W - 6} 37 Q ${RINK_W - 18} 42.5 ${RINK_W - 6} 48`}
        stroke="#FF4444BB" strokeWidth={1} fill="#FF444418"
      />
    </Svg>
  );
}

// ─── Arrow SVG layer ─────────────────────────────────────────────────────────
interface ArrowLayerProps {
  tactic: Tactic;
  stepIdx: number;
}

function ArrowLayer({ tactic, stepIdx }: ArrowLayerProps) {
  const step = tactic.steps[stepIdx];
  if (!step || step.arrows.length === 0) return null;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${RINK_W} ${RINK_H}`}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <Marker
          id="arrowhead-pass"
          markerWidth="6" markerHeight="6"
          refX="5" refY="3"
          orient="auto"
        >
          <Polygon points="0,0 6,3 0,6" fill="rgba(255,255,180,0.85)" />
        </Marker>
        <Marker
          id="arrowhead-skate"
          markerWidth="6" markerHeight="6"
          refX="5" refY="3"
          orient="auto"
        >
          <Polygon points="0,0 6,3 0,6" fill="rgba(180,220,255,0.75)" />
        </Marker>
      </Defs>
      {step.arrows.map((arrow, i) => {
        const isPass = arrow.type === 'pass';
        return (
          <Line
            key={i}
            x1={arrow.from.x} y1={arrow.from.y}
            x2={arrow.to.x}   y2={arrow.to.y}
            stroke={isPass ? 'rgba(255,255,150,0.8)' : 'rgba(150,210,255,0.7)'}
            strokeWidth={isPass ? 1.5 : 1.2}
            strokeDasharray={isPass ? undefined : '4,3'}
            markerEnd={isPass ? 'url(#arrowhead-pass)' : 'url(#arrowhead-skate)'}
          />
        );
      })}
    </Svg>
  );
}

// ─── Animated player dot ─────────────────────────────────────────────────────
const PLAYER_KEYS = [
  'home_g', 'home_d1', 'home_d2', 'home_lw', 'home_c', 'home_rw',
  'away_g', 'away_d1', 'away_d2', 'away_lw', 'away_c', 'away_rw',
] as const;
type PlayerKey = typeof PLAYER_KEYS[number];

const PLAYER_LABELS: Record<PlayerKey, string> = {
  home_g: 'G', home_d1: 'D', home_d2: 'D',
  home_lw: 'L', home_c: 'C', home_rw: 'R',
  away_g: 'G', away_d1: 'D', away_d2: 'D',
  away_lw: 'L', away_c: 'C', away_rw: 'R',
};

const OFF_POS: Position = { x: -12, y: 42 };

function getPos(positions: PlayerPositions, key: PlayerKey): Position {
  return (positions as any)[key] ?? OFF_POS;
}

interface PlayerIconProps {
  animX: Animated.Value;
  animY: Animated.Value;
  label: string;
  isHome: boolean;
  visible: boolean;
}

function PlayerIcon({ animX, animY, label, isHome, visible }: PlayerIconProps) {
  if (!visible) return null;
  const color = isHome ? '#00D4FF' : '#FF3B30';
  return (
    <Animated.View
      style={[
        styles.playerIcon,
        {
          backgroundColor: color,
          left: animX.interpolate({ inputRange: [0, RINK_W], outputRange: ['0%', '100%'] }),
          top:  animY.interpolate({ inputRange: [0, RINK_H], outputRange: ['0%', '100%'] }),
          transform: [{ translateX: -8 }, { translateY: -8 }],
        },
      ]}
    >
      <Text style={styles.playerIconText}>{label}</Text>
    </Animated.View>
  );
}

// ─── Puck dot ────────────────────────────────────────────────────────────────
interface PuckProps { animX: Animated.Value; animY: Animated.Value }

function Puck({ animX, animY }: PuckProps) {
  return (
    <Animated.View
      style={[
        styles.puck,
        {
          left: animX.interpolate({ inputRange: [0, RINK_W], outputRange: ['0%', '100%'] }),
          top:  animY.interpolate({ inputRange: [0, RINK_H], outputRange: ['0%', '100%'] }),
          transform: [{ translateX: -5 }, { translateY: -5 }],
        },
      ]}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  tacticId?: string;            // show a single tactic; if omitted, show selector
  autoPlay?: boolean;
  compact?: boolean;            // hide tactic picker (used in curriculum screen)
}

export default function TacticsAnimator({ tacticId, autoPlay = false, compact = false }: Props) {
  const [selectedId, setSelectedId] = useState(
    tacticId ?? TACTICS[0].id
  );
  const tactic = TACTICS_BY_ID[selectedId] ?? TACTICS[0];

  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);

  // Per-player animated values
  const animRefs = useRef<Record<PlayerKey, { x: Animated.Value; y: Animated.Value }>>(
    {} as any
  );
  const puckAnim = useRef({
    x: new Animated.Value(tactic.steps[0].puck.x),
    y: new Animated.Value(tactic.steps[0].puck.y),
  }).current;

  if (!animRefs.current.home_d1) {
    const step0 = tactic.steps[0];
    for (const key of PLAYER_KEYS) {
      const pos = getPos(step0.players, key);
      animRefs.current[key] = {
        x: new Animated.Value(pos.x),
        y: new Animated.Value(pos.y),
      };
    }
  }

  const animateToStep = useCallback(
    (idx: number, tac: Tactic, spd: number) => {
      const step = tac.steps[idx];
      if (!step) return;
      const dur = step.duration / spd;

      const anims: Animated.CompositeAnimation[] = [];
      for (const key of PLAYER_KEYS) {
        const pos = getPos(step.players, key);
        anims.push(
          Animated.timing(animRefs.current[key].x, { toValue: pos.x, duration: dur, useNativeDriver: false }),
          Animated.timing(animRefs.current[key].y, { toValue: pos.y, duration: dur, useNativeDriver: false }),
        );
      }
      anims.push(
        Animated.timing(puckAnim.x, { toValue: step.puck.x, duration: dur, useNativeDriver: false }),
        Animated.timing(puckAnim.y, { toValue: step.puck.y, duration: dur, useNativeDriver: false }),
      );
      Animated.parallel(anims).start();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Reset when tactic changes
  useEffect(() => {
    setStepIdx(0);
    setPlaying(autoPlay);
    const step0 = tactic.steps[0];
    for (const key of PLAYER_KEYS) {
      const pos = getPos(step0.players, key);
      animRefs.current[key].x.setValue(pos.x);
      animRefs.current[key].y.setValue(pos.y);
    }
    puckAnim.x.setValue(step0.puck.x);
    puckAnim.y.setValue(step0.puck.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Auto-advance
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!playing) { if (timerRef.current) clearTimeout(timerRef.current); return; }
    animateToStep(stepIdx, tactic, speed);
    const dur = (tactic.steps[stepIdx]?.duration ?? 1000) / speed;
    timerRef.current = setTimeout(() => {
      setStepIdx(i => {
        const next = i + 1;
        if (next >= tactic.steps.length) { setPlaying(false); return 0; }
        return next;
      });
    }, dur + 150);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, stepIdx, selectedId, speed]);

  const goToStep = (idx: number) => {
    const clamped = Math.max(0, Math.min(tactic.steps.length - 1, idx));
    setPlaying(false);
    setStepIdx(clamped);
    animateToStep(clamped, tactic, speed);
  };

  const step = tactic.steps[stepIdx];
  const totalSteps = tactic.steps.length;

  const diffColor = tactic.difficulty === 'beginner' ? '#00CC66'
    : tactic.difficulty === 'intermediate' ? '#FFD700' : '#FF3B30';

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tacticTitle}>{tactic.title}</Text>
          <Text style={[styles.diffBadge, { color: diffColor }]}>
            {tactic.difficulty.charAt(0).toUpperCase() + tactic.difficulty.slice(1)}
            {' · '}{tactic.category.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.stepCounter}>{stepIdx + 1} / {totalSteps}</Text>
      </View>

      {/* Rink */}
      <View style={styles.rinkContainer}>
        <RinkSVG />
        <ArrowLayer tactic={tactic} stepIdx={stepIdx} />
        {PLAYER_KEYS.map(key => {
          const pos0 = getPos(tactic.steps[0].players, key);
          const visible = pos0.x >= 0;
          return (
            <PlayerIcon
              key={key}
              animX={animRefs.current[key].x}
              animY={animRefs.current[key].y}
              label={PLAYER_LABELS[key]}
              isHome={key.startsWith('home')}
              visible={visible}
            />
          );
        })}
        <Puck animX={puckAnim.x} animY={puckAnim.y} />
      </View>

      {/* Step description */}
      {step && (
        <View style={styles.descBox}>
          <Text style={styles.descStep}>Step {stepIdx + 1}</Text>
          <Text style={styles.descText}>{step.description}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Prev */}
        <Pressable style={styles.ctrlBtn} onPress={() => goToStep(stepIdx - 1)}>
          <Text style={styles.ctrlText}>‹</Text>
        </Pressable>

        {/* Play/Pause */}
        <Pressable
          style={[styles.ctrlBtn, styles.ctrlPlay]}
          onPress={() => {
            if (playing) {
              setPlaying(false);
            } else {
              if (stepIdx >= totalSteps - 1) setStepIdx(0);
              setPlaying(true);
            }
          }}
        >
          <Text style={[styles.ctrlText, { color: Colors.bg }]}>
            {playing ? '⏸' : '▶'}
          </Text>
        </Pressable>

        {/* Next */}
        <Pressable style={styles.ctrlBtn} onPress={() => goToStep(stepIdx + 1)}>
          <Text style={styles.ctrlText}>›</Text>
        </Pressable>

        {/* Speed selector */}
        {([0.5, 1, 2] as const).map(s => (
          <Pressable
            key={s}
            style={[styles.speedBtn, speed === s && styles.speedBtnActive]}
            onPress={() => setSpeed(s)}
          >
            <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>
              {s}×
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00D4FF' }]} />
          <Text style={styles.legendLabel}>Home</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendLabel}>Away</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDash} />
          <Text style={styles.legendLabel}>Skate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendSolid} />
          <Text style={styles.legendLabel}>Pass</Text>
        </View>
      </View>

      {/* Tactic selector (shown unless compact) */}
      {!compact && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pickerScroll}
          contentContainerStyle={{ gap: 8 }}
        >
          {TACTICS.map(t => (
            <Pressable
              key={t.id}
              style={[styles.pickerItem, selectedId === t.id && styles.pickerItemActive]}
              onPress={() => setSelectedId(t.id)}
            >
              <Text style={[styles.pickerText, selectedId === t.id && styles.pickerTextActive]}>
                {t.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0D1B2A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tacticTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#e0f0ff',
    letterSpacing: 0.3,
  },
  diffBadge: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  stepCounter: {
    fontSize: 11,
    color: '#4a7aa0',
    fontWeight: '600',
    marginTop: 2,
  },
  rinkContainer: {
    width: '100%',
    aspectRatio: RINK_W / RINK_H,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  playerIcon: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  playerIconText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#fff',
  },
  puck: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#111',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  descBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  descStep: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  descText: {
    fontSize: 12,
    color: '#c0d8ee',
    lineHeight: 17,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e5a8f',
  },
  ctrlPlay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  ctrlText: {
    fontSize: 18,
    color: '#a0c8e8',
    fontWeight: '700',
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2e5a8f',
    backgroundColor: '#1e3a5f',
  },
  speedBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  speedText: {
    fontSize: 11,
    color: '#4a7aa0',
    fontWeight: '700',
  },
  speedTextActive: {
    color: Colors.accent,
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(150,210,255,0.7)',
    borderStyle: 'dashed',
  },
  legendSolid: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,150,0.8)',
  },
  legendLabel: {
    fontSize: 9,
    color: '#6888aa',
    fontWeight: '600',
  },
  pickerScroll: {
    marginTop: 4,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
    borderWidth: 1,
    borderColor: '#2e5a8f',
  },
  pickerItemActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  pickerText: {
    fontSize: 11,
    color: '#6888aa',
    fontWeight: '600',
  },
  pickerTextActive: {
    color: Colors.accent,
  },
});
