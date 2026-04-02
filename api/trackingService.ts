import { API_BASE_URL, API_KEY } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BBox { x1: number; y1: number; x2: number; y2: number }

export interface FrameDetection {
  track_id: number;
  jersey: string | null;
  team: 'HOME' | 'AWAY' | null;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in pixel coords
}

export interface TrackPoint {
  frame: number;
  bbox: [number, number, number, number];
}

export interface PlayerTrack {
  track_id: number;
  jersey: string | null;
  team: 'HOME' | 'AWAY' | null;
  points: TrackPoint[];
}

export interface AllTracksResponse {
  video_stem: string;
  fps: number;
  frame_count: number;
  tracks: PlayerTrack[];
  jersey_map: Record<number, { jersey: string | null; team: 'HOME' | 'AWAY' | null }>;
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
const trackCache: Map<string, AllTracksResponse> = new Map();

const headers = { 'X-API-Key': API_KEY, 'Accept': 'application/json' };

// ─── Fetch a single frame's detections ───────────────────────────────────────
export async function getFrameDetections(
  videoStem: string,
  frameNumber: number
): Promise<FrameDetection[]> {
  const url = `${API_BASE_URL}/tracking/${encodeURIComponent(videoStem)}/frame/${frameNumber}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Tracking frame fetch failed: ${res.status}`);
  const data: FrameDetection[] = await res.json();
  return data;
}

// ─── Fetch and cache all tracks for a video ──────────────────────────────────
export async function getAllTracks(videoStem: string): Promise<AllTracksResponse> {
  const cached = trackCache.get(videoStem);
  if (cached) return cached;

  const url = `${API_BASE_URL}/tracking/${encodeURIComponent(videoStem)}/all_tracks`;
  const res = await fetch(url, {
    headers: {
      ...headers,
      'Accept-Encoding': 'gzip',
    },
  });
  if (!res.ok) throw new Error(`Tracking all_tracks fetch failed: ${res.status}`);
  const data: AllTracksResponse = await res.json();
  trackCache.set(videoStem, data);
  return data;
}

// ─── Binary search: find bbox for a given track at a given time ──────────────
export function getPlayerAtTime(
  tracks: AllTracksResponse,
  trackId: number,
  timeSec: number,
  fps: number = 4
): FrameDetection | null {
  const track = tracks.tracks.find(t => t.track_id === trackId);
  if (!track || track.points.length === 0) return null;

  const targetFrame = Math.round(timeSec * fps);

  // Binary search for closest frame
  let lo = 0;
  let hi = track.points.length - 1;
  let best = track.points[0];
  let bestDist = Math.abs(track.points[0].frame - targetFrame);

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const pt = track.points[mid];
    const dist = Math.abs(pt.frame - targetFrame);
    if (dist < bestDist) { best = pt; bestDist = dist; }
    if (pt.frame < targetFrame) lo = mid + 1;
    else if (pt.frame > targetFrame) hi = mid - 1;
    else break;
  }

  // Return null if closest frame is >2 seconds away (player off ice)
  if (bestDist > fps * 2) return null;

  const meta = tracks.jersey_map[trackId];
  return {
    track_id: trackId,
    jersey: meta?.jersey ?? null,
    team: meta?.team ?? null,
    bbox: best.bbox,
  };
}

// ─── Get all players visible at a given time ─────────────────────────────────
export function getAllPlayersAtTime(
  tracks: AllTracksResponse,
  timeSec: number,
  fps: number = 4
): FrameDetection[] {
  return tracks.tracks
    .map(t => getPlayerAtTime(tracks, t.track_id, timeSec, fps))
    .filter((d): d is FrameDetection => d !== null);
}

// ─── Clear cache ─────────────────────────────────────────────────────────────
export function clearTrackCache(videoStem?: string) {
  if (videoStem) trackCache.delete(videoStem);
  else trackCache.clear();
}
