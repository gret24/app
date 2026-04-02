// IceIQ API 설정
const __DEV__ = process.env.NODE_ENV !== 'production';

// RunPod 서버 URL (포트 8000 노출됨)
export const API_BASE_URL = __DEV__
  ? 'http://216.81.151.44:8000'   // 개발: RunPod 직접 접속
  : 'https://iceiq-api.com';       // 프로덕션 (추후 변경)

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
