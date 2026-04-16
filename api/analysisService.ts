import { apiGet, apiPost, apiUpload } from './client';
import { API_BASE_URL, API_KEY, POLL_INTERVAL, TIMEOUTS } from './config';

export interface JobStatus {
  status: 'queued' | 'processing' | 'done' | 'error';
  message: string;
  progress: number;
  video_stem: string;
}

export interface PlayerInfo {
  jersey: string;
  name?: string;
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
  team_name?: string;
  roster_file?: string;
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

// 파일 업로드 + 분석 (레거시 — 직접 서버 업로드, Cloudflare 100MB 제한 있음)
export const uploadAndAnalyze = async (
  fileUri: string,
  fileName: string,
  options: AnalyzeOptions = {},
  onProgress?: (pct: number) => void,
): Promise<{ job_id: string; video_stem?: string; filename?: string }> => {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: 'video/mp4' } as any);
  formData.append('team_name', 'Aigis');
  formData.append('roster_file', 'aigis.json');

  const res = await apiUpload<any>('/api/analyze', formData, onProgress, TIMEOUTS.upload);
  return {
    job_id: res.job_id,
    video_stem: res.video_stem || res.job_id,
    filename: fileName,
  };
};

// R2 Presigned 업로드 + 분석 (권장 — Cloudflare 제한 없음, 최대 파일크기 무제한)
export const uploadViaR2 = async (
  fileUri: string,
  fileName: string,
  options: AnalyzeOptions = {},
  onProgress?: (pct: number) => void,
): Promise<{ job_id: string; video_stem: string }> => {
  // Step 1: Presigned URL 발급
  onProgress?.(2);
  const presignForm = new FormData();
  presignForm.append('filename', fileName);
  presignForm.append('content_type', 'video/mp4');
  const presigned = await apiUpload<{ job_id: string; upload_url: string; r2_key: string }>(
    '/api/upload/presigned', presignForm, undefined, TIMEOUTS.default,
  );

  // Step 2: R2에 직접 PUT (XHR — progress 지원, 인증 헤더 없음)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presigned.upload_url);
    xhr.setRequestHeader('Content-Type', 'video/mp4');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // 5% ~ 80% 구간을 업로드 진행률로 매핑
        onProgress(5 + Math.round((e.loaded / e.total) * 75));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(82);
        resolve();
      } else {
        reject(new Error(`R2 upload failed: HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('R2 upload network error'));
    xhr.ontimeout = () => reject(new Error('R2 upload timeout'));
    xhr.timeout = TIMEOUTS.upload;
    // React Native: uri 객체를 직접 전송 (파일 스트림으로 읽힘)
    xhr.send({ uri: fileUri, type: 'video/mp4', name: fileName } as any);
  });

  // Step 3: 서버에 분석 트리거
  onProgress?.(85);
  const triggerForm = new FormData();
  triggerForm.append('job_id', presigned.job_id);
  triggerForm.append('r2_key', presigned.r2_key);
  triggerForm.append('team_name', options.team_name ?? 'Aigis');
  triggerForm.append('roster_file', options.roster_file ?? 'aigis.json');
  const result = await apiUpload<{ job_id: string; video_stem: string }>(
    '/api/analyze/r2', triggerForm, undefined, TIMEOUTS.default,
  );

  onProgress?.(90);
  return {
    job_id: result.job_id,
    video_stem: result.video_stem || result.job_id,
  };
};

// R2 presigned 업로드 + 분석 (fetch + blob 방식 — React Native 권장)
export const uploadAndAnalyzeR2 = async (
  fileUri: string,
  fileName: string,
  options: AnalyzeOptions = {},
  onProgress?: (pct: number) => void,
): Promise<{ job_id: string; video_stem: string }> => {
  const authHeaders = { 'X-API-Key': API_KEY };

  // Step 1: Presigned URL 발급
  const res1 = await fetch(`${API_BASE_URL}/api/upload/presigned`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `filename=${encodeURIComponent(fileName)}&content_type=video%2Fmp4`,
  });
  if (!res1.ok) throw new Error(`presigned 발급 실패: HTTP ${res1.status}`);
  const { job_id, upload_url, r2_key } = await res1.json();

  // Step 2: 파일을 blob으로 읽어 R2에 직접 PUT (인증 헤더 없음)
  onProgress?.(10);
  const blob = await fetch(fileUri).then(r => r.blob());
  onProgress?.(30);

  const putRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: blob,
  });
  if (!putRes.ok) throw new Error(`R2 업로드 실패: HTTP ${putRes.status}`);
  onProgress?.(80);

  // Step 3: 서버에 분석 트리거
  const res3 = await fetch(`${API_BASE_URL}/api/analyze/r2`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `job_id=${encodeURIComponent(job_id)}&r2_key=${encodeURIComponent(r2_key)}&team_name=${encodeURIComponent(options.team_name ?? 'Aigis')}&roster_file=${encodeURIComponent(options.roster_file ?? 'aigis.json')}`,
  });
  if (!res3.ok) throw new Error(`분석 트리거 실패: HTTP ${res3.status}`);
  onProgress?.(90);

  const result = await res3.json();
  return { job_id: result.job_id, video_stem: result.video_stem || result.job_id };
};

// YouTube URL 분석
export const analyzeYoutube = async (
  youtubeUrl: string,
  options: AnalyzeOptions = {},
  onProgress?: (pct: number) => void,
): Promise<{ job_id: string; video_stem: string }> => {
  const formData = new FormData();
  formData.append('youtube_url', youtubeUrl);
  formData.append('team_name', options.team_name ?? 'Aigis');
  formData.append('roster_file', options.roster_file ?? 'aigis.json');

  const res = await apiUpload<any>('/api/analyze/youtube', formData, onProgress, TIMEOUTS.upload);
  return {
    job_id: res.job_id,
    video_stem: res.video_stem || res.job_id,
  };
};

// 분석 상태 조회
export const getAnalysisStatus = async (jobId: string): Promise<JobStatus> => {
  return apiGet(`/api/jobs/${jobId}`);
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

// 선수 목록 조회 (→ /metrics로 대체)
export const getPlayers = async (videoStem: string): Promise<PlayersResponse> => {
  const metrics = await apiGet<any>(`/metrics/${videoStem}`);
  return {
    video_stem: videoStem,
    total_tracks: (metrics as any)?.total_players || 0,
    players: ((metrics as any)?.players || []).map((p: any) => ({
      jersey: p.jersey || '?',
      name: p.name,
      detections: p.total_frames || 0,
      teams: { [p.team]: p.total_frames },
    })),
  };
};

// 리포트 조회 (→ /metrics로 대체)
export const getReport = async (videoStem: string): Promise<ReportResponse> => {
  const metrics = await apiGet<any>(`/metrics/${videoStem}`);
  const metricsData = metrics as any;
  return {
    video_stem: videoStem,
    total_players: metricsData?.total_players || 0,
    home_players: (metricsData?.players || []).filter((p: any) => p.team === 'HOME').length,
    away_players: (metricsData?.players || []).filter((p: any) => p.team === 'AWAY').length,
    players: (metricsData?.players || []).map((p: any) => ({
      jersey: p.jersey || '?',
      team: p.team,
      total_frames: p.total_frames || 0,
      total_shifts: p.total_shifts || 0,
      total_ice_time_sec: p.total_ice_time_sec || 0,
      total_ice_time_min: p.total_ice_time_min || 0,
    })),
  };
};

// ─── 3단계 분석 플로우 ───────────────────────────────────────────────

export interface RosterEntry {
  jersey: string;
  name: string;
  age?: string;
  team: 'HOME' | 'AWAY';
  color_cluster: number; // 0 or 1 (quick 분석 결과에서 선택)
}

export interface FullAnalyzeOptions {
  fps?: number;
  home_color_cluster?: number; // 0 or 1
  away_color_cluster?: number;
  home_color?: string; // palette name from user selection
  away_color?: string; // palette name from user selection
  home_jersey_hex?: string;  // "#ffffff"
  away_jersey_hex?: string;  // "#cc0000"
  bench_config?: {
    preset?: string;                 // "top"|"bottom"|"left"|"right"
    home_bench?: { x_min: number; y_min: number; x_max: number; y_max: number };
    away_bench?: { x_min: number; y_min: number; x_max: number; y_max: number };
  } | null;
}

// 빠른 색상 추출
export const quickAnalyze = async (
  youtubeUrl: string,
  minutes = 5,
): Promise<{ job_id: string; video_stem: string }> => {
  return apiPost('/analyze/quick', { youtube_url: youtubeUrl, minutes });
};

export interface TeamColorInfo {
  cluster_id: number;
  hex: string;         // "#66745b"
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  sample_count: number;
}

// 색상 결과 조회
export const getColorPreview = async (
  videoStem: string,
): Promise<{ colors: string[]; team_colors: TeamColorInfo[] }> => {
  const raw = await apiGet<{ team_colors: TeamColorInfo[]; total_samples: number }>(`/color-preview/${videoStem}`);
  return {
    team_colors: raw.team_colors ?? [],
    colors: (raw.team_colors ?? []).map(c => c.hex),
  };
};

// roster 포함 전체 분석
export const analyzeWithRoster = async (
  youtubeUrl: string,
  roster: RosterEntry[],
  colorOptions: FullAnalyzeOptions,
): Promise<{ job_id: string; video_stem: string }> => {
  const homeRoster = roster
    .filter(p => p.team === 'HOME')
    .map(p => p.jersey)
    .join(',');
  const awayRoster = roster
    .filter(p => p.team === 'AWAY')
    .map(p => p.jersey)
    .join(',');
  return apiPost('/analyze/url', {
    youtube_url: youtubeUrl,
    fps: colorOptions.fps ?? 4,
    home_roster: homeRoster,
    away_roster: awayRoster,
    home_color_cluster: colorOptions.home_color_cluster ?? 0,
    home_jersey_hex: colorOptions.home_jersey_hex ?? '',
    away_jersey_hex: colorOptions.away_jersey_hex ?? '',
    bench_config: colorOptions.bench_config ?? null,
  });
};

// ─── Prescan ─────────────────────────────────────────────────────────

export interface PrescanResult {
  verdict: "PASS" | "PARTIAL" | "LIMITED" | "FAIL";
  score: number;
  max_score: number;
  checks: {
    player_size:       { grade: string; score: number; median_height_px: number; detail: string };
    detection_count:   { grade: string; score: number; avg_count: number; detail: string };
    ocr_readability:   { grade: string; score: number; success_rate_pct: number; detail: string };
    team_distinction:  { grade: string; score: number; hsv_distance: number; detail: string };
    camera_stability:  { grade: string; score: number; avg_movement_px: number; detail: string };
    rink_coverage:     { grade: string; score: number; coverage_pct: number; detail: string };
  };
  features: Record<string, string>;
  tips: { title: string; solutions: string[] }[];
  ideal_guide: { title: string; tips: string[] };
}

export const prescanVideo = async (videoStem: string, homeHex?: string, awayHex?: string): Promise<PrescanResult> => {
  const params: Record<string, string> = {
    video_url: `https://youtube.com/watch?v=${videoStem}`,
  };
  if (homeHex) params.home_hex = homeHex;
  if (awayHex) params.away_hex = awayHex;
  return apiPost("/prescan", params);
};

// 선수 이름 배정
export const assignPlayers = async (
  videoStem: string,
  players: RosterEntry[],
): Promise<void> => {
  return apiPost(`/players/${videoStem}/assign`, { players });
};
