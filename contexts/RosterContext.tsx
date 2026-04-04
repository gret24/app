import React, { createContext, useContext, useState } from 'react';

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
  addPlayer: (p: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, p: Partial<Player>) => void;
  removePlayer: (id: string) => void;
}

const RosterContext = createContext<RosterContextType | null>(null);

// 기본 mock 선수 목록
const DEFAULT_PLAYERS: Player[] = [];

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);

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
    <RosterContext.Provider value={{ players, addPlayer, updatePlayer, removePlayer }}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error('useRoster must be within RosterProvider');
  return ctx;
}
