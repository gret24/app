import { apiGet } from './client';

// ─── Types ────────────────────────────────────────────────────────────

export interface SpeedMetrics {
  avg_px_per_frame: number;
  max_px_per_frame: number;
  sprint_count: number;
  sprint_threshold: number;
}

export interface DistanceMetrics {
  total_px: number;
  avg_per_shift_px: number;
  shift_distances: number[];
}

export interface TransitionMetrics {
  avg_backcheck_sec: number;
  avg_rush_sec: number;
  backcheck_count: number;
  rush_count: number;
}

export interface PositioningMetrics {
  zone_pct: { OZ: number; NZ: number; DZ: number };
  high_slot_pct: number;
  nz_time_sec: number;
}

export interface StaminaMetrics {
  avg_decay_pct: number;
  per_shift_decay: number[];
}

export interface PlayerMetrics {
  jersey: string;
  team: string;
  total_frames: number;
  total_ice_time_sec: number;
  total_shifts: number;
  auto_position: 'F' | 'D' | 'G';
  style_tags: string[];
  speed: SpeedMetrics;
  distance: DistanceMetrics;
  transition: TransitionMetrics;
  positioning: PositioningMetrics;
  stamina: StaminaMetrics;
}

export interface PlayerProfile {
  jersey: string;
  team: string;
  position: string;
  style: string[];
  ice_time_min: number;
  shifts: number;
  avg_speed: number;
  max_speed: number;
  sprints: number;
  total_distance: number;
  backcheck_sec: number;
  zone_pct: { OZ: number; NZ: number; DZ: number };
  high_slot_pct: number;
  stamina_decay_pct: number;
}

export interface GameMetricsResponse {
  video_stem: string;
  fps: number;
  frame_count: number;
  total_players: number;
  players: PlayerMetrics[];
}

// ─── API calls ────────────────────────────────────────────────────────

/** 특정 선수 파생 지표 조회 */
export const getPlayerMetrics = async (
  videoStem: string,
  jersey: string,
): Promise<PlayerMetrics> => {
  return apiGet(`/metrics/${videoStem}/${jersey}`);
};

/** 전체 선수 지표 조회 */
export const getGameMetrics = async (
  videoStem: string,
): Promise<GameMetricsResponse> => {
  return apiGet(`/metrics/${videoStem}`);
};

/** 선수 프로필 요약 조회 */
export const getPlayerProfile = async (
  videoStem: string,
  jersey: string,
): Promise<PlayerProfile> => {
  return apiGet(`/profile/${videoStem}/${jersey}`);
};

// ─── Style tag 한글 변환 ──────────────────────────────────────────────

export const STYLE_TAG_KO: Record<string, string> = {
  explosive: '폭발형',
  endurance: '지구력형',
  transition: '전환형',
  slot_presence: '슬롯 침투형',
  responsible_def: '책임 수비형',
  balanced: '밸런스형',
  unknown: '분석 중',
};

export const translateStyle = (tag: string): string =>
  STYLE_TAG_KO[tag] ?? tag;
