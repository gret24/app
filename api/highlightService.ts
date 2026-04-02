import { apiPost } from './client';
import { getStreamUrl } from './client';
import { TIMEOUTS } from './config';

export interface ShiftInfo {
  start: number;
  end: number;
  duration: number;
}

export interface HighlightResult {
  player: string;
  shifts: number;
  total_ice_time_min: number;
  file_path: string;
  file_size_mb: number;
  stream_url: string;   // /video/... 상대경로
  shift_detail: ShiftInfo[];
}

export interface HighlightOptions {
  gap?: number;   // 시프트 구분 기준 초 (기본 30)
  buf?: number;   // 앞뒤 버퍼 초 (기본 5)
}

// 하이라이트 생성 요청
export const generateHighlight = async (
  videoPath: string,
  videoStem: string,
  playerNumber: string,
  options: HighlightOptions = {},
): Promise<HighlightResult> => {
  const result = await apiPost<HighlightResult>('/highlight', {
    video_path: videoPath,
    video_stem: videoStem,
    player: playerNumber,
    gap: options.gap ?? 30,
    buf: options.buf ?? 5,
  }, TIMEOUTS.highlight);

  // stream_url을 절대 URL로 변환
  return {
    ...result,
    stream_url: getStreamUrl(result.file_path),
  };
};

// 영상 스트리밍 URL 반환 (expo-av에 바로 넣을 수 있는 URL)
export const getVideoStreamUrl = (filepath: string): string => {
  return getStreamUrl(filepath);
};
