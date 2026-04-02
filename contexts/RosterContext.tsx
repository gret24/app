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
const DEFAULT_PLAYERS: Player[] = [
  { id: '1', name: 'Alex Smith',   jersey: '91', position: 'C',  shoot: 'L', age: 28, team: 'HOME' },
  { id: '2', name: 'Marc Lee',     jersey: '24', position: 'LW', shoot: 'L', age: 22, team: 'HOME' },
  { id: '3', name: 'Tyler Brown',  jersey: '96', position: 'D',  shoot: 'R', age: 31, team: 'HOME' },
  { id: '4', name: 'Chris Park',   jersey: '2',  position: 'D',  shoot: 'R', age: 26, team: 'HOME' },
  { id: '5', name: 'Ryan Kim',     jersey: '21', position: 'RW', shoot: 'R', age: 19, team: 'HOME' },
  { id: '6', name: 'Sam Johnson',  jersey: '5',  position: 'LW', shoot: 'L', age: 24, team: 'AWAY' },
];

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
