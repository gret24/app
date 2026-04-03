import { apiGet, apiPost } from './client';
import { FrameDetection } from './trackingService';

export interface NextMoveRequest {
  video_stem: string;
  player_number: string;
  frame_number: number;
  all_players: FrameDetection[];
  target_player_bbox: number[];
  zone: string;
  situation: string;
}

export interface NextMoveResponse {
  situation_analysis: string;
  primary_recommendation: {
    action: string;
    description: string;
    player_move: string;
    direction?: { dx: number; dy: number };
  };
  alternative: string;
  danger_zones: string[];
  pass_targets?: Array<{ jersey: string; direction: { dx: number; dy: number } }>;
  related_tactic: string;
}

export const getNextMove = async (
  videoStem: string,
  playerNumber: string,
  frameNumber: number,
  allPlayers: FrameDetection[],
  targetBbox: number[],
  zone: string,
  situation: string,
): Promise<NextMoveResponse> =>
  apiPost('/ai/next-move', {
    video_stem: videoStem,
    player_number: playerNumber,
    frame_number: frameNumber,
    all_players: allPlayers,
    target_player_bbox: targetBbox,
    zone,
    situation,
  });

export const getFrameTrackingData = async (
  videoStem: string,
  frameNumber: number,
): Promise<{ detections: FrameDetection[] }> =>
  apiGet(`/tracking/${encodeURIComponent(videoStem)}/frame/${frameNumber}`);
