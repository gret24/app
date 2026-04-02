import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable, Modal } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { getAllTracks, getAllPlayersAtTime, type AllTracksResponse, type FrameDetection } from '../api/trackingService';
import { Colors } from '../constants/Colors';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  videoStem: string;
  currentTimeMs: number;         // playback position in ms
  videoWidth: number;            // original video pixel width
  videoHeight: number;           // original video pixel height
  playerWidth: number;           // display (rendered) width
  playerHeight: number;          // display (rendered) height
  trackedIds?: number[];         // if omitted, show all
  fps?: number;
  showLabels?: 'ALL' | 'HOME' | 'AWAY' | 'OFF';
}

// ─── Track trail: last 3 seconds of positions (at fps sampling) ───────────────
interface TrailPoint { x: number; y: number; t: number }

// ─── Info popup ───────────────────────────────────────────────────────────────
interface PopupInfo {
  trackId: number;
  jersey: string | null;
  team: string | null;
  x: number;
  y: number;
}

const HOME_COLOR = '#00D4FF';
const AWAY_COLOR = '#FF3B30';

function playerColor(team: string | null) {
  if (team === 'HOME') return HOME_COLOR;
  if (team === 'AWAY') return AWAY_COLOR;
  return '#AAAAAA';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PlayerTracker({
  videoStem,
  currentTimeMs,
  videoWidth,
  videoHeight,
  playerWidth,
  playerHeight,
  trackedIds,
  fps = 4,
  showLabels = 'ALL',
}: Props) {
  const [tracks, setTracks] = useState<AllTracksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<FrameDetection[]>([]);
  const [popup, setPopup] = useState<PopupInfo | null>(null);

  // Trail: Map<trackId, TrailPoint[]>
  const trailRef = useRef<Map<number, TrailPoint[]>>(new Map());

  // Throttle: last update time
  const lastUpdateRef = useRef<number>(0);

  // Fetch tracks on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllTracks(videoStem)
      .then(data => { setTracks(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [videoStem]);

  // Scale helper: video coords → display coords
  const scaleX = playerWidth  / videoWidth;
  const scaleY = playerHeight / videoHeight;

  const scaleDetection = (d: FrameDetection) => {
    const cx = ((d.bbox[0] + d.bbox[2]) / 2) * scaleX;
    const cy = ((d.bbox[1] + d.bbox[3]) / 2) * scaleY;
    return { cx, cy };
  };

  // Update detections with 250ms throttle
  const updateDetections = useCallback(() => {
    if (!tracks) return;
    const now = Date.now();
    if (now - lastUpdateRef.current < 250) return;
    lastUpdateRef.current = now;

    const timeSec = currentTimeMs / 1000;
    let all = getAllPlayersAtTime(tracks, timeSec, fps);

    // Filter by trackedIds if provided
    if (trackedIds && trackedIds.length > 0) {
      all = all.filter(d => trackedIds.includes(d.track_id));
    }

    // Update trails
    const trailWindow = 3 * fps; // frames in 3 seconds
    all.forEach(d => {
      const { cx, cy } = scaleDetection(d);
      const trail = trailRef.current.get(d.track_id) ?? [];
      trail.push({ x: cx, y: cy, t: timeSec });
      // Keep only last 3 seconds
      const cutoff = timeSec - 3;
      const trimmed = trail.filter(p => p.t >= cutoff);
      trailRef.current.set(d.track_id, trimmed);
    });

    setDetections(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, currentTimeMs, trackedIds, fps, scaleX, scaleY]);

  useEffect(() => {
    updateDetections();
  }, [updateDetections]);

  if (loading) return (
    <View style={[styles.overlay, { width: playerWidth, height: playerHeight }]} pointerEvents="none">
      <Text style={styles.loadingText}>Tracking...</Text>
    </View>
  );

  if (error) return (
    <View style={[styles.overlay, { width: playerWidth, height: playerHeight }]} pointerEvents="none">
      <Text style={styles.errorText}>⚠ {error}</Text>
    </View>
  );

  return (
    <>
      <View style={[styles.overlay, { width: playerWidth, height: playerHeight }]}>
        <Svg width={playerWidth} height={playerHeight} style={StyleSheet.absoluteFillObject}>
          {detections.map(d => {
            if (showLabels === 'OFF') return null;
            if (showLabels === 'HOME' && d.team !== 'HOME') return null;
            if (showLabels === 'AWAY' && d.team !== 'AWAY') return null;

            const { cx, cy } = scaleDetection(d);
            const color = playerColor(d.team);
            const trail = trailRef.current.get(d.track_id) ?? [];

            return (
              <G key={d.track_id}>
                {/* Trail lines */}
                {trail.length > 1 && trail.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = trail[i - 1];
                  const alpha = (i / trail.length) * 0.5;
                  return (
                    <Line
                      key={`trail-${d.track_id}-${i}`}
                      x1={prev.x} y1={prev.y}
                      x2={pt.x}   y2={pt.y}
                      stroke={color}
                      strokeWidth={2}
                      strokeOpacity={alpha}
                    />
                  );
                })}

                {/* Player dot */}
                <Pressable onPress={() => setPopup({
                  trackId: d.track_id,
                  jersey: d.jersey,
                  team: d.team,
                  x: cx,
                  y: cy,
                })}>
                  <G>
                    <Circle cx={cx} cy={cy} r={10} fill={color} fillOpacity={0.85} />
                    <Circle cx={cx} cy={cy} r={10} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="none" />
                    <SvgText
                      x={cx} y={cy + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={8}
                      fontWeight="900"
                    >
                      {d.jersey ?? '?'}
                    </SvgText>
                  </G>
                </Pressable>

                {/* Bbox label */}
                <SvgText
                  x={d.bbox[0] * scaleX}
                  y={(d.bbox[1] * scaleY) - 4}
                  fill={color}
                  fontSize={9}
                  fontWeight="700"
                  fillOpacity={0.9}
                >
                  {d.team === 'HOME' ? '#' : '#'}{d.jersey ?? '?'}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Info popup */}
      {popup && (
        <Modal transparent animationType="fade" onRequestClose={() => setPopup(null)}>
          <Pressable style={styles.popupBackdrop} onPress={() => setPopup(null)}>
            <View style={styles.popupCard}>
              <View style={[styles.popupDot, { backgroundColor: playerColor(popup.team) }]} />
              <Text style={styles.popupJersey}>#{popup.jersey ?? '?'}</Text>
              <Text style={styles.popupTeam}>{popup.team ?? 'Unknown'}</Text>
              <Text style={styles.popupId}>Track ID: {popup.trackId}</Text>
              <Pressable onPress={() => setPopup(null)} style={styles.popupClose}>
                <Text style={styles.popupCloseText}>닫기</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

// ─── Team roster list (used in diagram view) ─────────────────────────────────
export function TeamRosterList({
  detections,
  team,
  side,
}: {
  detections: FrameDetection[];
  team: 'HOME' | 'AWAY';
  side: 'left' | 'right';
}) {
  const players = detections.filter(d => d.team === team);
  const color = team === 'HOME' ? HOME_COLOR : AWAY_COLOR;

  return (
    <View style={[roster.container, side === 'right' ? roster.right : roster.left]}>
      <Text style={[roster.teamLabel, { color }]}>
        {team === 'HOME' ? '🏠 HOME' : '✈️ AWAY'}
      </Text>
      {players.map(p => (
        <View key={p.track_id} style={roster.row}>
          <View style={[roster.dot, { backgroundColor: color }]} />
          <Text style={roster.text}>#{p.jersey ?? '?'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0,
  },
  loadingText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '600',
    padding: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 11,
    padding: 8,
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  popupDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  popupJersey: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
  },
  popupTeam: {
    fontSize: 14,
    color: Colors.subtext,
    fontWeight: '600',
  },
  popupId: {
    fontSize: 11,
    color: Colors.subtext,
  },
  popupClose: {
    marginTop: 8,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  popupCloseText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: 14,
  },
});

const roster = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    padding: 8,
    gap: 4,
    minWidth: 70,
  },
  left: { left: 8 },
  right: { right: 8 },
  teamLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, color: 'white', fontWeight: '700' },
});
