import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Svg, {
  Rect, Line, Circle, Ellipse, G, Text as SvgText, Defs, RadialGradient, Stop,
} from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { getAllTracks, getAllPlayersAtTime, type AllTracksResponse, type FrameDetection } from '../api/trackingService';
import {
  transformPoint, bboxToRink, rinkToDisplay, isInRink, flipForPeriod,
  type HomographyMatrix, IDENTITY_MATRIX, RINK_WIDTH, RINK_HEIGHT,
} from '../lib/homography';
import { apiGet } from '../api/client';

const { width: SCREEN_W } = Dimensions.get('window');
const DIAGRAM_W = SCREEN_W - 40;
const DIAGRAM_H = DIAGRAM_W / 2; // 2:1 aspect ratio

const HOME_COLOR = '#00D4FF';
const AWAY_COLOR = '#FF3B30';
const PUCK_COLOR = '#FFD700';

// ─── Props ───────────────────────────────────────────────────────

interface Props {
  videoStem: string;
  currentTimeMs: number;
  fps?: number;
  period?: number;
  showTrails?: boolean;
  showLabels?: boolean;
  showOri?: boolean;          // 시선 방향 화살표
  onPlayerPress?: (jersey: string, team: string) => void;
}

// ─── Rink SVG Template ───────────────────────────────────────────

function RinkTemplate({ width, height }: { width: number; height: number }) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h / 2;
  const r = 8; // corner radius scaled
  const blueL = w * 0.31;
  const blueR = w * 0.69;
  const goalL = w * 0.04;
  const goalR = w * 0.96;
  const circleR = h * 0.15;

  return (
    <G>
      {/* Ice surface */}
      <Rect x={0} y={0} width={w} height={h} rx={r} fill="#0A1A0A" stroke="#1A3A2A" strokeWidth={1} />

      {/* Center line */}
      <Line x1={cx} y1={0} x2={cx} y2={h} stroke="#CC000044" strokeWidth={1.5} />

      {/* Blue lines */}
      <Line x1={blueL} y1={0} x2={blueL} y2={h} stroke="#0066FF66" strokeWidth={2} />
      <Line x1={blueR} y1={0} x2={blueR} y2={h} stroke="#0066FF66" strokeWidth={2} />

      {/* Goal lines */}
      <Line x1={goalL} y1={h*0.15} x2={goalL} y2={h*0.85} stroke="#CC000044" strokeWidth={1} />
      <Line x1={goalR} y1={h*0.15} x2={goalR} y2={h*0.85} stroke="#CC000044" strokeWidth={1} />

      {/* Center circle */}
      <Circle cx={cx} cy={cy} r={circleR} fill="none" stroke="#0066FF33" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={2} fill="#0066FF44" />

      {/* Faceoff circles */}
      {[
        [blueL * 0.6, cy - h*0.28], [blueL * 0.6, cy + h*0.28],
        [w - blueL * 0.6, cy - h*0.28], [w - blueL * 0.6, cy + h*0.28],
      ].map(([fx, fy], i) => (
        <Circle key={i} cx={fx} cy={fy} r={circleR * 0.9} fill="none" stroke="#0066FF22" strokeWidth={0.5} />
      ))}

      {/* Goals */}
      <Rect x={goalL - 3} y={cy - 6} width={6} height={12} rx={1} fill="none" stroke="#CC000066" strokeWidth={1} />
      <Rect x={goalR - 3} y={cy - 6} width={6} height={12} rx={1} fill="none" stroke="#CC000066" strokeWidth={1} />
    </G>
  );
}

// ─── Player Dot ──────────────────────────────────────────────────

interface PlayerDotProps {
  x: number;
  y: number;
  jersey: string;
  team: string;
  showLabel: boolean;
  showOri: boolean;
  oriDx?: number;
  oriDy?: number;
  trail?: { x: number; y: number }[];
  onPress?: () => void;
}

function PlayerDot({ x, y, jersey, team, showLabel, showOri, oriDx, oriDy, trail, onPress }: PlayerDotProps) {
  const color = team === 'HOME' ? HOME_COLOR : team === 'AWAY' ? AWAY_COLOR : '#888';
  const dotR = 6;
  const arrowLen = 18;

  return (
    <G onPress={onPress}>
      {/* Trail */}
      {trail && trail.length > 1 && trail.map((p, i) => {
        if (i === 0) return null;
        const opacity = (i / trail.length) * 0.4;
        return (
          <Line
            key={i}
            x1={trail[i-1].x} y1={trail[i-1].y}
            x2={p.x} y2={p.y}
            stroke={color} strokeWidth={1.5} opacity={opacity}
          />
        );
      })}

      {/* Glow */}
      <Circle cx={x} cy={y} r={dotR + 4} fill={color} opacity={0.15} />

      {/* Dot */}
      <Circle cx={x} cy={y} r={dotR} fill={color} opacity={0.9} />

      {/* Orientation arrow */}
      {showOri && oriDx !== undefined && oriDy !== undefined && (
        <Line
          x1={x} y1={y}
          x2={x + oriDx * arrowLen} y2={y + oriDy * arrowLen}
          stroke={color} strokeWidth={1.5} opacity={0.6}
        />
      )}

      {/* Label */}
      {showLabel && jersey && jersey !== '?' && (
        <SvgText
          x={x} y={y - dotR - 4}
          fill={color} fontSize={8} fontWeight="bold"
          textAnchor="middle"
        >
          #{jersey}
        </SvgText>
      )}
    </G>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function LiveRinkDiagram({
  videoStem,
  currentTimeMs,
  fps = 4,
  period = 1,
  showTrails = true,
  showLabels = true,
  showOri = true,
  onPlayerPress,
}: Props) {
  const [tracks, setTracks] = useState<AllTracksResponse | null>(null);
  const [H, setH] = useState<HomographyMatrix>(IDENTITY_MATRIX);
  const [hasHomography, setHasHomography] = useState(false);
  const [detections, setDetections] = useState<FrameDetection[]>([]);
  const trailsRef = useRef<Map<number, { x: number; y: number }[]>>(new Map());
  const lastUpdateRef = useRef(0);

  // Load tracks
  useEffect(() => {
    getAllTracks(videoStem)
      .then(setTracks)
      .catch(() => {});
  }, [videoStem]);

  // Load homography matrix from server
  useEffect(() => {
    apiGet<{ matrix: number[] }>(`/homography/${videoStem}`)
      .then(data => {
        if (data.matrix && data.matrix.length === 9) {
          setH(data.matrix as HomographyMatrix);
          setHasHomography(true);
        }
      })
      .catch(() => {
        // No homography available — use identity (scale-only)
        setHasHomography(false);
      });
  }, [videoStem]);

  // Update positions (throttled)
  const updatePositions = useCallback(() => {
    if (!tracks) return;
    const now = Date.now();
    if (now - lastUpdateRef.current < 200) return;
    lastUpdateRef.current = now;

    const timeSec = currentTimeMs / 1000;
    const all = getAllPlayersAtTime(tracks, timeSec, fps);
    setDetections(all);

    // Update trails
    all.forEach(d => {
      let rinkPos: { rx: number; ry: number };

      if (hasHomography) {
        rinkPos = bboxToRink(d.bbox, H);
        rinkPos = flipForPeriod(rinkPos.rx, rinkPos.ry, period);
      } else {
        // Fallback: simple scale
        const cx = (d.bbox[0] + d.bbox[2]) / 2;
        const cy = (d.bbox[1] + d.bbox[3]) / 2;
        rinkPos = { rx: cx, ry: cy };
      }

      if (!isInRink(rinkPos.rx, rinkPos.ry)) return;

      const display = rinkToDisplay(rinkPos.rx, rinkPos.ry, DIAGRAM_W, DIAGRAM_H);
      const trail = trailsRef.current.get(d.track_id) ?? [];
      trail.push({ x: display.dx, y: display.dy });
      if (trail.length > 12) trail.shift(); // Keep last 3 seconds at fps=4
      trailsRef.current.set(d.track_id, trail);
    });
  }, [tracks, currentTimeMs, fps, H, hasHomography, period]);

  useEffect(() => {
    updatePositions();
  }, [updatePositions]);

  // Render player positions on rink
  const renderPlayers = () => {
    return detections.map(d => {
      let rinkPos: { rx: number; ry: number };

      if (hasHomography) {
        rinkPos = bboxToRink(d.bbox, H);
        rinkPos = flipForPeriod(rinkPos.rx, rinkPos.ry, period);
      } else {
        const cx = (d.bbox[0] + d.bbox[2]) / 2;
        const cy = (d.bbox[1] + d.bbox[3]) / 2;
        // Scale to rink dimensions
        rinkPos = { rx: (cx / 1920) * RINK_WIDTH, ry: (cy / 1080) * RINK_HEIGHT };
      }

      if (!isInRink(rinkPos.rx, rinkPos.ry)) return null;

      const display = rinkToDisplay(rinkPos.rx, rinkPos.ry, DIAGRAM_W, DIAGRAM_H);
      const trail = showTrails ? trailsRef.current.get(d.track_id) : undefined;

      // ori from tracks data (if available)
      const trackData = tracks?.tracks.find(t => t.track_id === d.track_id);
      let oriDx: number | undefined;
      let oriDy: number | undefined;
      if (showOri && trackData) {
        const pts = trackData.points as any[];
        const frame = Math.round(currentTimeMs / 1000 * fps);
        const pt = pts.find((p: any) => Math.abs(p.frame - frame) <= 1);
        if (pt?.ori) {
          oriDx = pt.ori[2];
          oriDy = pt.ori[3];
        }
      }

      return (
        <PlayerDot
          key={d.track_id}
          x={display.dx}
          y={display.dy}
          jersey={d.jersey ?? '?'}
          team={d.team ?? 'HOME'}
          showLabel={showLabels}
          showOri={showOri}
          oriDx={oriDx}
          oriDy={oriDy}
          trail={trail}
          onPress={() => onPlayerPress?.(d.jersey ?? '', d.team ?? '')}
        />
      );
    });
  };

  const timeSec = currentTimeMs / 1000;
  const homeCount = detections.filter(d => d.team === 'HOME').length;
  const awayCount = detections.filter(d => d.team === 'AWAY').length;

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>TACTICAL VIEW</Text>
        <View style={st.headerRight}>
          <View style={st.liveDot} />
          <Text style={st.timeText}>{Math.floor(timeSec/60)}:{String(Math.floor(timeSec%60)).padStart(2,'0')}</Text>
        </View>
      </View>

      {/* Rink SVG */}
      <View style={st.rinkWrapper}>
        <Svg width={DIAGRAM_W} height={DIAGRAM_H} viewBox={`0 0 ${DIAGRAM_W} ${DIAGRAM_H}`}>
          <RinkTemplate width={DIAGRAM_W} height={DIAGRAM_H} />
          {renderPlayers()}
        </Svg>
      </View>

      {/* Footer: player counts */}
      <View style={st.footer}>
        <View style={st.teamCount}>
          <View style={[st.teamDot, { backgroundColor: HOME_COLOR }]} />
          <Text style={[st.teamLabel, { color: HOME_COLOR }]}>HOME {homeCount}</Text>
        </View>
        <Text style={st.statusText}>
          {hasHomography ? '📐 Homography' : '📏 Scaled'} · {detections.length} players
        </Text>
        <View style={st.teamCount}>
          <Text style={[st.teamLabel, { color: AWAY_COLOR }]}>AWAY {awayCount}</Text>
          <View style={[st.teamDot, { backgroundColor: AWAY_COLOR }]} />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLow,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.subtext,
    fontVariant: ['tabular-nums'],
  },
  rinkWrapper: {
    paddingHorizontal: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teamCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusText: {
    fontSize: 9,
    color: Colors.outline,
  },
});
