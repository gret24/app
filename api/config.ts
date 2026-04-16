// IceIQ API 설정
// APP_ENV는 eas.json의 env에서 주입됨 (preview/development = RunPod, production = 프로덕션)
const APP_ENV = process.env.APP_ENV || 'preview';

// RunPod 서버 URL (포트 8000 노출됨)
export const API_BASE_URL = APP_ENV === 'production'
  ? 'https://iceiq-api.com'       // 프로덕션 (추후 변경)
  : 'https://qmea4juu93pr04-8000.proxy.runpod.net';  // 개발: RunPod 서버

// API 키
export const API_KEY = 'iceiq-dev-key-2026';

// 타임아웃 설정
export const TIMEOUTS = {
  default:   30_000,   // 30초
  upload:   120_000,   // 2분
  analysis: 600_000,   // 10분 (분석은 오래 걸림)
  highlight: 300_000,  // 5분
};

// 폴링 간격
export const POLL_INTERVAL = 5_000; // 5초
