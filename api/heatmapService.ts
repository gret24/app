import { API_BASE_URL, API_KEY } from './config';
import { apiGet } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeatmapInfo {
  jersey: string;
  name: string;
  points: number; // 히트맵에 찍힌 총 포인트 수
  image_url: string; // 상대 경로: /heatmap/waves_g18/homo_47_Han.png
}

export interface HeatmapListResponse {
  video_stem: string;
  total: number;
  heatmaps: HeatmapInfo[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * 특정 경기의 모든 선수 히트맵 목록 조회
 */
export const getHeatmaps = async (videoStem: string): Promise<HeatmapListResponse> => {
  return apiGet(`/heatmaps/${videoStem}`);
};

/**
 * 히트맵 이미지의 절대 URL 생성
 * 서버가 /heatmap/{video_stem}/{filename} 으로 이미지를 서빙한다고 가정
 */
export const getHeatmapImageUrl = (videoStem: string, jersey: string, name?: string): string => {
  const label = name ? `${jersey}_${name}` : jersey;
  return `${API_BASE_URL}/heatmap/${videoStem}/homo_${label}.png?api_key=${API_KEY}`;
};

/**
 * 단일 선수 히트맵 URL (서버에서 목록 응답의 image_url 사용)
 */
export const resolveHeatmapUrl = (relativePath: string): string => {
  const clean = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${API_BASE_URL}/${clean}?api_key=${API_KEY}`;
};
