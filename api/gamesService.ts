import {
  collection, doc, addDoc, getDocs, updateDoc,
  onSnapshot, serverTimestamp, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type UserRole = 'player' | 'coach' | 'team';
export type GameStatus = 'analyzing' | 'done' | 'error';

export interface GameRecord {
  id?: string;
  videoStem: string;
  title: string;
  youtubeUrl?: string;
  status: GameStatus;
  uploadedAt?: Timestamp;
  playerCount?: number;
  topPlayers?: string[];  // TOP3 jersey numbers
}

// 게임 추가
export const addGame = async (uid: string, game: Omit<GameRecord, "id">) => {
  const ref = collection(db, "users", uid, "games");
  const docRef = await addDoc(ref, {
    ...game,
    uploadedAt: serverTimestamp(),
  });
  return docRef.id;
};

// 게임 목록 조회
export const getGames = async (uid: string): Promise<GameRecord[]> => {
  const q = query(collection(db, "users", uid, "games"), orderBy("uploadedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as GameRecord));
};

// 게임 상태 업데이트
export const updateGame = async (uid: string, gameId: string, data: Partial<GameRecord>) => {
  await updateDoc(doc(db, "users", uid, "games", gameId), data);
};

// 실시간 게임 목록
export const onGamesChange = (
  uid: string,
  callback: (games: GameRecord[]) => void,
) => {
  const q = query(collection(db, "users", uid, "games"), orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as GameRecord)));
  });
};
