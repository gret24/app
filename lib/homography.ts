/**
 * IceIQ Homography Transform
 * 영상 픽셀 좌표 → 2D 링크 좌표 실시간 변환
 *
 * 서버에서 3x3 호모그래피 행렬을 받아서
 * 클라이언트에서 프레임마다 변환 수행
 */

// 3x3 호모그래피 행렬 타입 (row-major)
export type HomographyMatrix = [
  number, number, number,
  number, number, number,
  number, number, number,
];

// 링크 표준 크기 (IIHF: 60m x 30m → px 비율)
export const RINK_WIDTH = 600;
export const RINK_HEIGHT = 300;

/**
 * 호모그래피 행렬로 점 변환
 * (x, y) in video pixels → (rx, ry) in rink coordinates
 */
export function transformPoint(
  x: number,
  y: number,
  H: HomographyMatrix,
): { rx: number; ry: number } {
  const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = H;

  const w = h6 * x + h7 * y + h8;
  if (Math.abs(w) < 1e-10) {
    return { rx: 0, ry: 0 };
  }

  const rx = (h0 * x + h1 * y + h2) / w;
  const ry = (h3 * x + h4 * y + h5) / w;

  return { rx, ry };
}

/**
 * bbox 중심점 → 링크 좌표 변환
 */
export function bboxToRink(
  bbox: [number, number, number, number],
  H: HomographyMatrix,
): { rx: number; ry: number } {
  // 발 위치 (bbox 하단 중심) 사용 — 빙판 위치에 더 정확
  const cx = (bbox[0] + bbox[2]) / 2;
  const cy = bbox[3]; // bottom center
  return transformPoint(cx, cy, H);
}

/**
 * 링크 좌표를 렌더 좌표로 변환
 * rink coords (0~600, 0~300) → display coords (0~displayW, 0~displayH)
 */
export function rinkToDisplay(
  rx: number,
  ry: number,
  displayWidth: number,
  displayHeight: number,
  rinkWidth: number = RINK_WIDTH,
  rinkHeight: number = RINK_HEIGHT,
): { dx: number; dy: number } {
  const dx = (rx / rinkWidth) * displayWidth;
  const dy = (ry / rinkHeight) * displayHeight;
  return { dx, dy };
}

/**
 * 링크 범위 내인지 확인 (경계 밖 = 벤치 등)
 */
export function isInRink(
  rx: number,
  ry: number,
  margin: number = 20,
  rinkWidth: number = RINK_WIDTH,
  rinkHeight: number = RINK_HEIGHT,
): boolean {
  return (
    rx >= -margin &&
    rx <= rinkWidth + margin &&
    ry >= -margin &&
    ry <= rinkHeight + margin
  );
}

/**
 * 2P 반전 (피리어드별 공격 방향 통일)
 * x좌표를 링크 중앙 기준으로 좌우 반전
 */
export function flipForPeriod(
  rx: number,
  ry: number,
  period: number,
  rinkWidth: number = RINK_WIDTH,
  rinkHeight: number = RINK_HEIGHT,
): { rx: number; ry: number } {
  if (period % 2 === 0) {
    // 짝수 피리어드: 좌우 반전
    return { rx: rinkWidth - rx, ry: rinkHeight - ry };
  }
  return { rx, ry };
}

/**
 * 단위 행렬 (변환 없음 - fallback)
 */
export const IDENTITY_MATRIX: HomographyMatrix = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];
