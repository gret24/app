import { apiPost, apiGet } from './client';

export interface ReapplyResult {
  filename: string;
  updated: number;
  skipped: number;
  errors: number;
}

export interface RosterFile {
  filename: string;
  player_count: number;
  last_modified: string;
}

// 로스터 재적용 — 해당 파일을 참조하는 모든 분석에 선수 정보 재매핑
export const reapplyRoster = async (filename: string): Promise<ReapplyResult> => {
  return apiPost(`/api/rosters/${encodeURIComponent(filename)}/reapply`, {});
};

// 서버에 저장된 로스터 파일 목록 조회
export const listRosters = async (): Promise<RosterFile[]> => {
  return apiGet<RosterFile[]>('/api/rosters');
};
