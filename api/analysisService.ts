import { apiGet, apiPost, apiUpload } from './client';
import { POLL_INTERVAL, TIMEOUTS } from './config';

export interface JobStatus {
  status: 'queued' | 'processing' | 'done' | 'error';
  message: string;
  progress: number;
  video_stem: string;
}

export interface PlayerInfo {
  jersey: string;
  detections: number;
  teams: Record<string, number>;
}

export interface PlayersResponse {
  video_stem: string;
  total_tracks: number;
  players: PlayerInfo[];
}

export interface PlayerStat {
  jersey: string;
  team: string;
  total_frames: number;
  total_shifts: number;
  total_ice_time_sec: number;
  total_ice_time_min: number;
}

export interface ReportResponse {
  video_stem: string;
  total_players: number;
  home_players: number;
  away_players: number;
  players: PlayerStat[];
}

export interface AnalyzeOptions {
  fps?: number;
  home_roster?: string;
  away_roster?: string;
}

// 경로 기반 분석 (서버에 이미 있는 영상)
export const analyzeVideo = async (
  videoPath: string,
  options: AnalyzeOptions = {}
): Promise<{ job_id: string; video_stem: string }> => {
  return apiPost('/analyze', {
    video_path: videoPath,
    fps: options.fps ?? 4,
    home_roster: options.home_roster ?? '',
    away_roster: options.away_roster ?? '',
  }, TIMEOUTS.analysis);
};

// 파일 업로드 + 분석
export const uploadAndAnalyze = async (
  fileUri: string,
  fileName: string,
  options: AnalyzeOptions = {},
  onProgress?: (pct: number) => void,
): Promise<{ job_id: string; video_stem: string; filename: string }> => {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: 'video/mp4' } as any);
  formData.append('fps', String(options.fps ?? 4));
  formData.append('home_roster', options.home_roster ?? '');
  formData.append('away_roster', options.away_roster ?? '');

  return apiUpload('/analyze/upload', formData, onProgress, TIMEOUTS.upload);
};

// 분석 상태 조회
export const getAnalysisStatus = async (jobId: string): Promise<JobStatus> => {
  return apiGet(`/status/${jobId}`);
};

// 분석 완료까지 폴링 (Promise 방식)
export const waitForAnalysis = (
  jobId: string,
  onProgress: (status: JobStatus) => void,
  intervalMs = POLL_INTERVAL,
): Promise<JobStatus> => {
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        const status = await getAnalysisStatus(jobId);
        onProgress(status);
        if (status.status === 'done') {
          clearInterval(poll);
          resolve(status);
        } else if (status.status === 'error') {
          clearInterval(poll);
          reject(new Error(status.message));
        }
      } catch (e) {
        // 네트워크 오류는 폴링 계속
        console.warn('폴링 오류:', e);
      }
    }, intervalMs);
  });
};

// 선수 목록 조회
export const getPlayers = async (videoStem: string): Promise<PlayersResponse> => {
  return apiGet(`/players/${videoStem}`);
};

// 리포트 조회
export const getReport = async (videoStem: string): Promise<ReportResponse> => {
  return apiGet(`/report/${videoStem}`);
};
