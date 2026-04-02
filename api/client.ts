import { API_BASE_URL, API_KEY, TIMEOUTS } from './config';
import { auth } from '../lib/firebase';

// 공통 헤더
const getHeaders = async (extra?: Record<string, string>): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    ...extra,
  };
  // Firebase 토큰 첨부 (로그인된 경우)
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (_) {}
  return headers;
};

// 공통 에러 처리
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// GET 요청
export const apiGet = async <T>(path: string, timeout = TIMEOUTS.default): Promise<T> => {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { headers, signal: controller.signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(err.detail || '서버 오류', res.status);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
};

// POST JSON 요청
export const apiPost = async <T>(path: string, body: object, timeout = TIMEOUTS.default): Promise<T> => {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(err.detail || '서버 오류', res.status);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
};

// POST multipart (파일 업로드)
export const apiUpload = async <T>(
  path: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
  timeout = TIMEOUTS.upload
): Promise<T> => {
  const headers = await getHeaders(); // Content-Type은 fetch가 자동 설정
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST', headers, body: formData, signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(err.detail || '업로드 오류', res.status);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
};

// 스트리밍 URL 생성 (직접 URL 반환)
export const getStreamUrl = (filepath: string): string => {
  const clean = filepath.startsWith('/') ? filepath.slice(1) : filepath;
  return `${API_BASE_URL}/video/${clean}?api_key=${API_KEY}`;
};

export { ApiError };
