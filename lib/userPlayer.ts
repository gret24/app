/**
 * AsyncStorage 기반 "내 선수" 영구 저장
 * 앱 재시작 후에도 등록한 선수 정보가 유지됩니다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Player } from '../contexts/RosterContext';

const PLAYER_KEY   = '@iceiq_my_player';   // 단일 "내 선수"
const ROSTER_KEY   = '@iceiq_my_roster';   // 전체 로스터 (복수)

// ─── 단일 "내 선수" ────────────────────────────────────────────────────

export const savePlayer = async (player: Player): Promise<void> => {
  await AsyncStorage.setItem(PLAYER_KEY, JSON.stringify(player));
};

export const loadPlayer = async (): Promise<Player | null> => {
  const raw = await AsyncStorage.getItem(PLAYER_KEY);
  return raw ? (JSON.parse(raw) as Player) : null;
};

export const clearPlayer = async (): Promise<void> => {
  await AsyncStorage.removeItem(PLAYER_KEY);
};

// ─── 로스터 전체 ──────────────────────────────────────────────────────

export const saveRoster = async (players: Player[]): Promise<void> => {
  await AsyncStorage.setItem(ROSTER_KEY, JSON.stringify(players));
};

export const loadRoster = async (): Promise<Player[]> => {
  const raw = await AsyncStorage.getItem(ROSTER_KEY);
  return raw ? (JSON.parse(raw) as Player[]) : [];
};
