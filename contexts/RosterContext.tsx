import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveRoster, loadRoster } from '../lib/userPlayer';

export type Position = 'LW' | 'RW' | 'C' | 'D' | 'G';
export type Shoot = 'L' | 'R';
export type TeamSide = 'HOME' | 'AWAY';

export interface Player {
  id: string;
  name: string;
  jersey: string;
  position: Position;
  shoot: Shoot;
  age: number;
  team: TeamSide;
}

interface RosterContextType {
  players: Player[];
  loaded: boolean;                              // AsyncStorage 로드 완료 여부
  addPlayer: (p: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, p: Partial<Player>) => void;
  removePlayer: (id: string) => void;
}

const RosterContext = createContext<RosterContextType | null>(null);

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 앱 시작 시 AsyncStorage에서 로드
  useEffect(() => {
    loadRoster().then(saved => {
      if (saved.length > 0) setPlayers(saved);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // 변경될 때마다 AsyncStorage에 저장
  useEffect(() => {
    if (loaded) saveRoster(players).catch(() => {});
  }, [players, loaded]);

  const addPlayer = (p: Omit<Player, 'id'>) => {
    setPlayers(prev => [...prev, { ...p, id: Date.now().toString() }]);
  };

  const updatePlayer = (id: string, p: Partial<Player>) => {
    setPlayers(prev => prev.map(pl => pl.id === id ? { ...pl, ...p } : pl));
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(pl => pl.id !== id));
  };

  return (
    <RosterContext.Provider value={{ players, loaded, addPlayer, updatePlayer, removePlayer }}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error('useRoster must be within RosterProvider');
  return ctx;
}
