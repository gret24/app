// Tactics data — viewBox 200×85
// x: 0 = home-goal end, 200 = away-goal end  |  y: 0 = top, 85 = bottom
// Home attacks left→right. Blue lines: x=67 / x=133. Red centre: x=100.

export interface Position { x: number; y: number }

export interface PlayerPositions {
  home_g?:   Position;
  home_d1?:  Position;
  home_d2?:  Position;
  home_lw?:  Position;
  home_c?:   Position;
  home_rw?:  Position;
  away_g?:   Position;
  away_d1?:  Position;
  away_d2?:  Position;
  away_lw?:  Position;
  away_c?:   Position;
  away_rw?:  Position;
}

export interface Arrow {
  from: Position;
  to: Position;
  type: 'pass' | 'skate';
}

export interface TacticStep {
  duration: number;       // ms
  description: string;
  players: PlayerPositions;
  puck: Position;
  arrows: Arrow[];
}

export type TacticCategory = 'breakout' | 'forecheck' | 'powerplay' | 'penaltykill' | 'neutral';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Tactic {
  id: string;
  title: string;
  category: TacticCategory;
  difficulty: Difficulty;
  description: string;
  steps: TacticStep[];
}

// ─── shared default "hidden" position (off-screen left) ───────────────────────
const OFF: Position = { x: -12, y: 42 };

// ─────────────────────────────────────────────────────────────────────────────
// 1. BASIC BREAKOUT
// ─────────────────────────────────────────────────────────────────────────────
const basicBreakout: Tactic = {
  id: 'basic_breakout',
  title: 'Basic Breakout',
  category: 'breakout',
  difficulty: 'beginner',
  description: 'Standard 5-player breakout using wide lanes. D2 picks up puck in corner and passes to a swinging winger.',
  steps: [
    {
      duration: 1000,
      description: 'Puck recovered in corner. Away team forechecking 2-1-2.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 24, y: 22 },
        home_d2: { x: 24, y: 62 },
        home_lw: { x: 18, y: 15 },
        home_c:  { x: 32, y: 42 },
        home_rw: { x: 18, y: 70 },
        away_lw: { x: 50, y: 22 },
        away_c:  { x: 55, y: 42 },
        away_rw: { x: 50, y: 62 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 18, y: 70 },
      arrows: [],
    },
    {
      duration: 1000,
      description: 'D2 skates to corner, picks up puck.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 24, y: 22 },
        home_d2: { x: 16, y: 70 },
        home_lw: { x: 18, y: 15 },
        home_c:  { x: 32, y: 42 },
        home_rw: { x: 30, y: 68 },
        away_lw: { x: 50, y: 22 },
        away_c:  { x: 52, y: 42 },
        away_rw: { x: 38, y: 65 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 16, y: 70 },
      arrows: [{ from: { x: 24, y: 62 }, to: { x: 16, y: 70 }, type: 'skate' }],
    },
    {
      duration: 1200,
      description: 'D2 passes to LW swinging wide up the left.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 24, y: 22 },
        home_d2: { x: 16, y: 70 },
        home_lw: { x: 45, y: 18 },
        home_c:  { x: 40, y: 42 },
        home_rw: { x: 28, y: 68 },
        away_lw: { x: 52, y: 20 },
        away_c:  { x: 55, y: 42 },
        away_rw: { x: 42, y: 62 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 45, y: 18 },
      arrows: [
        { from: { x: 16, y: 70 }, to: { x: 45, y: 18 }, type: 'pass' },
        { from: { x: 18, y: 15 }, to: { x: 45, y: 18 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'LW carries into neutral zone. C and RW fill middle and right lanes.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 45, y: 25 },
        home_d2: { x: 45, y: 60 },
        home_lw: { x: 88, y: 18 },
        home_c:  { x: 78, y: 42 },
        home_rw: { x: 78, y: 68 },
        away_lw: { x: 72, y: 22 },
        away_c:  { x: 75, y: 42 },
        away_rw: { x: 72, y: 62 },
        away_d1: { x: 85, y: 28 },
        away_d2: { x: 85, y: 56 },
      },
      puck: { x: 88, y: 18 },
      arrows: [
        { from: { x: 45, y: 18 }, to: { x: 88, y: 18 }, type: 'skate' },
        { from: { x: 40, y: 42 }, to: { x: 78, y: 42 }, type: 'skate' },
        { from: { x: 28, y: 68 }, to: { x: 78, y: 68 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'Three-lane entry into offensive zone. D trail for support.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 108, y: 25 },
        home_d2: { x: 108, y: 60 },
        home_lw: { x: 145, y: 18 },
        home_c:  { x: 142, y: 42 },
        home_rw: { x: 145, y: 67 },
        away_lw: { x: 95,  y: 20 },
        away_c:  { x: 98,  y: 42 },
        away_rw: { x: 95,  y: 65 },
        away_d1: { x: 105, y: 28 },
        away_d2: { x: 105, y: 57 },
      },
      puck: { x: 145, y: 18 },
      arrows: [
        { from: { x: 88,  y: 18 }, to: { x: 145, y: 18 }, type: 'skate' },
        { from: { x: 78,  y: 42 }, to: { x: 142, y: 42 }, type: 'skate' },
        { from: { x: 78,  y: 68 }, to: { x: 145, y: 67 }, type: 'skate' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. REVERSE BREAKOUT
// ─────────────────────────────────────────────────────────────────────────────
const reverseBreakout: Tactic = {
  id: 'reverse_breakout',
  title: 'Reverse Breakout',
  category: 'breakout',
  difficulty: 'beginner',
  description: 'D1 passes back to goalie who reverses to D2 on weak side, then chips to breaking center.',
  steps: [
    {
      duration: 1000,
      description: 'D1 under pressure in top corner. Goalie ready to receive.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 18, y: 15 },
        home_d2: { x: 22, y: 62 },
        home_lw: { x: 22, y: 18 },
        home_c:  { x: 32, y: 42 },
        home_rw: { x: 35, y: 70 },
        away_lw: { x: 32, y: 20 },
        away_c:  { x: 55, y: 42 },
        away_rw: { x: 50, y: 62 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 18, y: 15 },
      arrows: [],
    },
    {
      duration: 1000,
      description: 'D1 passes back to goalie — away forechecker commits.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 18, y: 15 },
        home_d2: { x: 22, y: 62 },
        home_lw: { x: 22, y: 18 },
        home_c:  { x: 32, y: 42 },
        home_rw: { x: 35, y: 70 },
        away_lw: { x: 24, y: 18 },
        away_c:  { x: 50, y: 42 },
        away_rw: { x: 50, y: 62 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 6, y: 42 },
      arrows: [{ from: { x: 18, y: 15 }, to: { x: 6, y: 42 }, type: 'pass' }],
    },
    {
      duration: 1200,
      description: 'Goalie reverses to D2 on strong side. Away LW overcommitted.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 18, y: 15 },
        home_d2: { x: 18, y: 70 },
        home_lw: { x: 30, y: 20 },
        home_c:  { x: 35, y: 42 },
        home_rw: { x: 35, y: 70 },
        away_lw: { x: 15, y: 18 },
        away_c:  { x: 50, y: 42 },
        away_rw: { x: 50, y: 62 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 18, y: 70 },
      arrows: [{ from: { x: 6, y: 42 }, to: { x: 18, y: 70 }, type: 'pass' }],
    },
    {
      duration: 1000,
      description: 'D2 chips up-ice to breaking center.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 28, y: 20 },
        home_d2: { x: 18, y: 70 },
        home_lw: { x: 52, y: 18 },
        home_c:  { x: 60, y: 42 },
        home_rw: { x: 52, y: 66 },
        away_lw: { x: 20, y: 18 },
        away_c:  { x: 58, y: 42 },
        away_rw: { x: 55, y: 65 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 60, y: 42 },
      arrows: [
        { from: { x: 18, y: 70 }, to: { x: 60, y: 42 }, type: 'pass' },
        { from: { x: 32, y: 42 }, to: { x: 60, y: 42 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'Center leads three-lane rush through neutral zone.',
      players: {
        home_g:  { x: 6,   y: 42 },
        home_d1: { x: 52,  y: 25 },
        home_d2: { x: 52,  y: 60 },
        home_lw: { x: 92,  y: 18 },
        home_c:  { x: 95,  y: 42 },
        home_rw: { x: 92,  y: 67 },
        away_lw: { x: 85,  y: 22 },
        away_c:  { x: 88,  y: 42 },
        away_rw: { x: 85,  y: 62 },
        away_d1: { x: 102, y: 28 },
        away_d2: { x: 102, y: 56 },
      },
      puck: { x: 95, y: 42 },
      arrows: [
        { from: { x: 60, y: 42 }, to: { x: 95, y: 42 }, type: 'skate' },
        { from: { x: 52, y: 18 }, to: { x: 92, y: 18 }, type: 'skate' },
        { from: { x: 52, y: 66 }, to: { x: 92, y: 67 }, type: 'skate' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. WHEEL
// ─────────────────────────────────────────────────────────────────────────────
const wheel: Tactic = {
  id: 'wheel',
  title: 'Wheel Breakout',
  category: 'breakout',
  difficulty: 'intermediate',
  description: 'D2 wheels behind the net to escape pressure, emerges on opposite side and leads the rush.',
  steps: [
    {
      duration: 900,
      description: 'D2 stopped in corner. Forecheck pressure coming.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 24, y: 22 },
        home_d2: { x: 14, y: 70 },
        home_lw: { x: 20, y: 15 },
        home_c:  { x: 35, y: 42 },
        home_rw: { x: 38, y: 68 },
        away_lw: { x: 28, y: 68 },
        away_c:  { x: 52, y: 42 },
        away_rw: { x: 50, y: 20 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 14, y: 70 },
      arrows: [],
    },
    {
      duration: 1200,
      description: 'D2 wheels behind net — away forechecker commits to corner.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 24, y: 22 },
        home_d2: { x: 8,  y: 52 },
        home_lw: { x: 20, y: 15 },
        home_c:  { x: 35, y: 42 },
        home_rw: { x: 38, y: 68 },
        away_lw: { x: 16, y: 68 },
        away_c:  { x: 52, y: 42 },
        away_rw: { x: 50, y: 20 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 8, y: 52 },
      arrows: [{ from: { x: 14, y: 70 }, to: { x: 8, y: 52 }, type: 'skate' }],
    },
    {
      duration: 1200,
      description: 'D2 continues wheel to top of zone.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 24, y: 22 },
        home_d2: { x: 18, y: 15 },
        home_lw: { x: 32, y: 18 },
        home_c:  { x: 35, y: 42 },
        home_rw: { x: 38, y: 68 },
        away_lw: { x: 12, y: 68 },
        away_c:  { x: 52, y: 42 },
        away_rw: { x: 48, y: 20 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 18, y: 15 },
      arrows: [{ from: { x: 8, y: 52 }, to: { x: 18, y: 15 }, type: 'skate' }],
    },
    {
      duration: 1000,
      description: 'D2 passes to breaking LW who swings through neutral zone.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 28, y: 22 },
        home_d2: { x: 18, y: 15 },
        home_lw: { x: 50, y: 18 },
        home_c:  { x: 45, y: 42 },
        home_rw: { x: 45, y: 65 },
        away_lw: { x: 12, y: 68 },
        away_c:  { x: 52, y: 42 },
        away_rw: { x: 52, y: 22 },
        away_d1: { x: 72, y: 28 },
        away_d2: { x: 72, y: 56 },
      },
      puck: { x: 50, y: 18 },
      arrows: [
        { from: { x: 18, y: 15 }, to: { x: 50, y: 18 }, type: 'pass' },
        { from: { x: 32, y: 18 }, to: { x: 50, y: 18 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'LW leads rush. C and RW fill lanes. D trail.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_d1: { x: 55, y: 28 },
        home_d2: { x: 50, y: 58 },
        home_lw: { x: 95, y: 18 },
        home_c:  { x: 85, y: 42 },
        home_rw: { x: 85, y: 65 },
        away_lw: { x: 80, y: 22 },
        away_c:  { x: 82, y: 42 },
        away_rw: { x: 78, y: 62 },
        away_d1: { x: 98, y: 28 },
        away_d2: { x: 98, y: 56 },
      },
      puck: { x: 95, y: 18 },
      arrows: [
        { from: { x: 50, y: 18 }, to: { x: 95, y: 18 }, type: 'skate' },
        { from: { x: 45, y: 42 }, to: { x: 85, y: 42 }, type: 'skate' },
        { from: { x: 45, y: 65 }, to: { x: 85, y: 65 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'Three-on-two rush into offensive zone.',
      players: {
        home_g:  { x: 6,   y: 42 },
        home_d1: { x: 108, y: 28 },
        home_d2: { x: 105, y: 58 },
        home_lw: { x: 148, y: 18 },
        home_c:  { x: 142, y: 42 },
        home_rw: { x: 145, y: 65 },
        away_lw: { x: 122, y: 22 },
        away_c:  { x: 125, y: 42 },
        away_rw: { x: 120, y: 62 },
        away_d1: { x: 135, y: 28 },
        away_d2: { x: 135, y: 56 },
      },
      puck: { x: 148, y: 18 },
      arrows: [
        { from: { x: 95, y: 18 }, to: { x: 148, y: 18 }, type: 'skate' },
        { from: { x: 85, y: 42 }, to: { x: 142, y: 42 }, type: 'skate' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. FORECHECK 1-2-2
// ─────────────────────────────────────────────────────────────────────────────
const forecheck122: Tactic = {
  id: 'forecheck_122',
  title: 'Forecheck 1-2-2',
  category: 'forecheck',
  difficulty: 'beginner',
  description: 'Single forechecker pressures puck carrier while two wings support and two D hold the blue line.',
  steps: [
    {
      duration: 1000,
      description: '1-2-2 setup: C as single forechecker, wings support, D at blue line.',
      players: {
        home_lw: { x: 148, y: 20 },
        home_c:  { x: 152, y: 42 },
        home_rw: { x: 148, y: 65 },
        home_d1: { x: 128, y: 25 },
        home_d2: { x: 128, y: 60 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 178, y: 22 },
        away_d2: { x: 178, y: 63 },
        away_lw: { x: 162, y: 20 },
        away_c:  { x: 158, y: 42 },
        away_rw: { x: 162, y: 65 },
      },
      puck: { x: 158, y: 42 },
      arrows: [],
    },
    {
      duration: 1000,
      description: 'C pressures away puck carrier (away C). Wings contract.',
      players: {
        home_lw: { x: 152, y: 28 },
        home_c:  { x: 156, y: 42 },
        home_rw: { x: 152, y: 57 },
        home_d1: { x: 128, y: 25 },
        home_d2: { x: 128, y: 60 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 178, y: 22 },
        away_d2: { x: 178, y: 63 },
        away_lw: { x: 160, y: 20 },
        away_c:  { x: 158, y: 42 },
        away_rw: { x: 160, y: 65 },
      },
      puck: { x: 158, y: 42 },
      arrows: [
        { from: { x: 152, y: 42 }, to: { x: 156, y: 42 }, type: 'skate' },
        { from: { x: 148, y: 20 }, to: { x: 152, y: 28 }, type: 'skate' },
        { from: { x: 148, y: 65 }, to: { x: 152, y: 57 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'Away C passes to D1 in corner. Home LW follows.',
      players: {
        home_lw: { x: 162, y: 22 },
        home_c:  { x: 158, y: 42 },
        home_rw: { x: 155, y: 60 },
        home_d1: { x: 130, y: 25 },
        home_d2: { x: 130, y: 60 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 178, y: 22 },
        away_d2: { x: 175, y: 63 },
        away_lw: { x: 165, y: 20 },
        away_c:  { x: 162, y: 42 },
        away_rw: { x: 162, y: 65 },
      },
      puck: { x: 178, y: 22 },
      arrows: [
        { from: { x: 158, y: 42 }, to: { x: 178, y: 22 }, type: 'pass' },
        { from: { x: 152, y: 28 }, to: { x: 162, y: 22 }, type: 'skate' },
      ],
    },
    {
      duration: 1000,
      description: 'Home LW pressures away D1 in corner. D hold gap.',
      players: {
        home_lw: { x: 170, y: 22 },
        home_c:  { x: 158, y: 42 },
        home_rw: { x: 160, y: 62 },
        home_d1: { x: 132, y: 28 },
        home_d2: { x: 132, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 178, y: 22 },
        away_d2: { x: 175, y: 63 },
        away_lw: { x: 168, y: 20 },
        away_c:  { x: 165, y: 42 },
        away_rw: { x: 165, y: 65 },
      },
      puck: { x: 178, y: 22 },
      arrows: [{ from: { x: 162, y: 22 }, to: { x: 170, y: 22 }, type: 'skate' }],
    },
    {
      duration: 1200,
      description: 'Turnover! Home C wins puck. Transition attack begins.',
      players: {
        home_lw: { x: 155, y: 20 },
        home_c:  { x: 150, y: 42 },
        home_rw: { x: 152, y: 62 },
        home_d1: { x: 128, y: 28 },
        home_d2: { x: 128, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 175, y: 25 },
        away_d2: { x: 172, y: 62 },
        away_lw: { x: 168, y: 20 },
        away_c:  { x: 165, y: 42 },
        away_rw: { x: 168, y: 65 },
      },
      puck: { x: 150, y: 42 },
      arrows: [
        { from: { x: 158, y: 42 }, to: { x: 150, y: 42 }, type: 'skate' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. FORECHECK 2-1-2
// ─────────────────────────────────────────────────────────────────────────────
const forecheck212: Tactic = {
  id: 'forecheck_212',
  title: 'Forecheck 2-1-2',
  category: 'forecheck',
  difficulty: 'intermediate',
  description: 'Two wings pressure the corners while C supports behind, trapping the opposing D-men.',
  steps: [
    {
      duration: 1000,
      description: '2-1-2 setup: LW and RW pressure corners, C supports.',
      players: {
        home_lw: { x: 155, y: 20 },
        home_c:  { x: 145, y: 42 },
        home_rw: { x: 155, y: 65 },
        home_d1: { x: 128, y: 25 },
        home_d2: { x: 128, y: 60 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 178, y: 22 },
        away_d2: { x: 178, y: 63 },
        away_lw: { x: 162, y: 20 },
        away_c:  { x: 162, y: 42 },
        away_rw: { x: 162, y: 65 },
      },
      puck: { x: 178, y: 22 },
      arrows: [],
    },
    {
      duration: 1200,
      description: 'LW and RW pressure D in corners. C covers breakout lanes.',
      players: {
        home_lw: { x: 168, y: 22 },
        home_c:  { x: 150, y: 42 },
        home_rw: { x: 168, y: 63 },
        home_d1: { x: 130, y: 25 },
        home_d2: { x: 130, y: 60 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 178, y: 22 },
        away_d2: { x: 178, y: 63 },
        away_lw: { x: 162, y: 20 },
        away_c:  { x: 162, y: 42 },
        away_rw: { x: 162, y: 65 },
      },
      puck: { x: 178, y: 22 },
      arrows: [
        { from: { x: 155, y: 20 }, to: { x: 168, y: 22 }, type: 'skate' },
        { from: { x: 155, y: 65 }, to: { x: 168, y: 63 }, type: 'skate' },
      ],
    },
    {
      duration: 1000,
      description: 'Away D tries to pass up. C reads the lane and intercepts.',
      players: {
        home_lw: { x: 168, y: 22 },
        home_c:  { x: 152, y: 42 },
        home_rw: { x: 168, y: 63 },
        home_d1: { x: 132, y: 28 },
        home_d2: { x: 132, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 178, y: 22 },
        away_d2: { x: 178, y: 63 },
        away_lw: { x: 162, y: 20 },
        away_c:  { x: 162, y: 42 },
        away_rw: { x: 162, y: 65 },
      },
      puck: { x: 178, y: 22 },
      arrows: [
        { from: { x: 178, y: 22 }, to: { x: 155, y: 42 }, type: 'pass' },
        { from: { x: 145, y: 42 }, to: { x: 152, y: 42 }, type: 'skate' },
      ],
    },
    {
      duration: 1000,
      description: 'Turnover! Home LW gets puck in corner.',
      players: {
        home_lw: { x: 170, y: 22 },
        home_c:  { x: 155, y: 42 },
        home_rw: { x: 165, y: 62 },
        home_d1: { x: 133, y: 28 },
        home_d2: { x: 133, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 180, y: 22 },
        away_d2: { x: 180, y: 63 },
        away_lw: { x: 162, y: 20 },
        away_c:  { x: 165, y: 42 },
        away_rw: { x: 162, y: 65 },
      },
      puck: { x: 170, y: 22 },
      arrows: [],
    },
    {
      duration: 1200,
      description: 'Home transitions 3-on-2 — attack with speed.',
      players: {
        home_lw: { x: 148, y: 20 },
        home_c:  { x: 142, y: 42 },
        home_rw: { x: 148, y: 65 },
        home_d1: { x: 125, y: 28 },
        home_d2: { x: 125, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 160, y: 28 },
        away_d2: { x: 158, y: 58 },
        away_lw: { x: 152, y: 20 },
        away_c:  { x: 162, y: 42 },
        away_rw: { x: 155, y: 65 },
      },
      puck: { x: 148, y: 20 },
      arrows: [
        { from: { x: 170, y: 22 }, to: { x: 148, y: 20 }, type: 'skate' },
        { from: { x: 155, y: 42 }, to: { x: 142, y: 42 }, type: 'skate' },
        { from: { x: 165, y: 62 }, to: { x: 148, y: 65 }, type: 'skate' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. LEFT-WING LOCK
// ─────────────────────────────────────────────────────────────────────────────
const leftWingLock: Tactic = {
  id: 'left_wing_lock',
  title: 'Left-Wing Lock',
  category: 'forecheck',
  difficulty: 'advanced',
  description: 'LW stays in neutral zone while C and RW forecheck. Creates a 3-2-0 trap hybrid.',
  steps: [
    {
      duration: 1000,
      description: 'C and RW forecheck. LW drops to NZ — unusual positioning.',
      players: {
        home_lw: { x: 122, y: 22 },
        home_c:  { x: 155, y: 42 },
        home_rw: { x: 162, y: 65 },
        home_d1: { x: 108, y: 30 },
        home_d2: { x: 108, y: 55 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 178, y: 22 },
        away_d2: { x: 178, y: 63 },
        away_lw: { x: 162, y: 20 },
        away_c:  { x: 165, y: 42 },
        away_rw: { x: 162, y: 65 },
      },
      puck: { x: 165, y: 42 },
      arrows: [],
    },
    {
      duration: 1200,
      description: 'Away starts 3-on-2 rush. LW covers neutral zone seam.',
      players: {
        home_lw: { x: 122, y: 22 },
        home_c:  { x: 148, y: 42 },
        home_rw: { x: 150, y: 62 },
        home_d1: { x: 108, y: 30 },
        home_d2: { x: 108, y: 55 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 165, y: 22 },
        away_d2: { x: 180, y: 63 },
        away_lw: { x: 155, y: 20 },
        away_c:  { x: 155, y: 42 },
        away_rw: { x: 155, y: 65 },
      },
      puck: { x: 155, y: 42 },
      arrows: [
        { from: { x: 165, y: 22 }, to: { x: 145, y: 22 }, type: 'skate' },
        { from: { x: 165, y: 42 }, to: { x: 145, y: 42 }, type: 'skate' },
      ],
    },
    {
      duration: 1000,
      description: 'LW takes away away-LW passing lane. D1 steps up.',
      players: {
        home_lw: { x: 125, y: 22 },
        home_c:  { x: 140, y: 42 },
        home_rw: { x: 140, y: 62 },
        home_d1: { x: 115, y: 35 },
        home_d2: { x: 112, y: 55 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 148, y: 22 },
        away_d2: { x: 180, y: 63 },
        away_lw: { x: 140, y: 20 },
        away_c:  { x: 142, y: 42 },
        away_rw: { x: 140, y: 65 },
      },
      puck: { x: 142, y: 42 },
      arrows: [{ from: { x: 108, y: 30 }, to: { x: 115, y: 35 }, type: 'skate' }],
    },
    {
      duration: 1000,
      description: 'D1 pressures away C. Puck forced to perimeter.',
      players: {
        home_lw: { x: 122, y: 22 },
        home_c:  { x: 135, y: 42 },
        home_rw: { x: 138, y: 60 },
        home_d1: { x: 120, y: 42 },
        home_d2: { x: 115, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 148, y: 22 },
        away_d2: { x: 180, y: 63 },
        away_lw: { x: 138, y: 18 },
        away_c:  { x: 140, y: 42 },
        away_rw: { x: 138, y: 65 },
      },
      puck: { x: 140, y: 42 },
      arrows: [{ from: { x: 115, y: 35 }, to: { x: 120, y: 42 }, type: 'skate' }],
    },
    {
      duration: 1200,
      description: 'Home clears puck. All five regroup in NZ.',
      players: {
        home_lw: { x: 108, y: 22 },
        home_c:  { x: 112, y: 42 },
        home_rw: { x: 108, y: 65 },
        home_d1: { x: 98,  y: 30 },
        home_d2: { x: 98,  y: 55 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 148, y: 22 },
        away_d2: { x: 148, y: 63 },
        away_lw: { x: 138, y: 18 },
        away_c:  { x: 138, y: 42 },
        away_rw: { x: 138, y: 65 },
      },
      puck: { x: 112, y: 42 },
      arrows: [{ from: { x: 140, y: 42 }, to: { x: 112, y: 42 }, type: 'skate' }],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. POWER PLAY — UMBRELLA
// ─────────────────────────────────────────────────────────────────────────────
const ppUmbrella: Tactic = {
  id: 'pp_umbrella',
  title: 'Power Play — Umbrella',
  category: 'powerplay',
  difficulty: 'intermediate',
  description: 'QB at the top orchestrates a 1-2-2 umbrella. Rotate puck to create shooting lanes.',
  steps: [
    {
      duration: 1000,
      description: 'Setup: QB at point, two half-wall, two in slot/net.',
      players: {
        home_d1: { x: 138, y: 42 },
        home_d2: { x: 152, y: 22 },
        home_lw: { x: 152, y: 62 },
        home_c:  { x: 165, y: 30 },
        home_rw: { x: 168, y: 52 },
        away_lw: { x: 158, y: 35 },
        away_c:  { x: 160, y: 50 },
        away_rw: { x: 172, y: 35 },
        away_d1: { x: 172, y: 50 },
      },
      puck: { x: 138, y: 42 },
      arrows: [],
    },
    {
      duration: 1000,
      description: 'QB passes to right half-wall (D2).',
      players: {
        home_d1: { x: 138, y: 42 },
        home_d2: { x: 152, y: 22 },
        home_lw: { x: 155, y: 60 },
        home_c:  { x: 165, y: 30 },
        home_rw: { x: 170, y: 52 },
        away_lw: { x: 158, y: 35 },
        away_c:  { x: 158, y: 50 },
        away_rw: { x: 170, y: 35 },
        away_d1: { x: 170, y: 50 },
      },
      puck: { x: 152, y: 22 },
      arrows: [{ from: { x: 138, y: 42 }, to: { x: 152, y: 22 }, type: 'pass' }],
    },
    {
      duration: 1000,
      description: 'Right HW passes across to left half-wall (LW).',
      players: {
        home_d1: { x: 140, y: 42 },
        home_d2: { x: 152, y: 22 },
        home_lw: { x: 155, y: 62 },
        home_c:  { x: 162, y: 30 },
        home_rw: { x: 170, y: 52 },
        away_lw: { x: 156, y: 32 },
        away_c:  { x: 158, y: 50 },
        away_rw: { x: 165, y: 32 },
        away_d1: { x: 165, y: 50 },
      },
      puck: { x: 155, y: 62 },
      arrows: [{ from: { x: 152, y: 22 }, to: { x: 155, y: 62 }, type: 'pass' }],
    },
    {
      duration: 1000,
      description: 'LW passes to C in high slot for one-timer.',
      players: {
        home_d1: { x: 140, y: 42 },
        home_d2: { x: 150, y: 22 },
        home_lw: { x: 155, y: 62 },
        home_c:  { x: 162, y: 30 },
        home_rw: { x: 170, y: 52 },
        away_lw: { x: 155, y: 32 },
        away_c:  { x: 158, y: 50 },
        away_rw: { x: 165, y: 32 },
        away_d1: { x: 162, y: 50 },
      },
      puck: { x: 162, y: 30 },
      arrows: [{ from: { x: 155, y: 62 }, to: { x: 162, y: 30 }, type: 'pass' }],
    },
    {
      duration: 1000,
      description: 'C shoots. RW screens, crashing the net for rebound.',
      players: {
        home_d1: { x: 140, y: 42 },
        home_d2: { x: 150, y: 22 },
        home_lw: { x: 158, y: 60 },
        home_c:  { x: 162, y: 30 },
        home_rw: { x: 178, y: 48 },
        away_lw: { x: 155, y: 35 },
        away_c:  { x: 160, y: 52 },
        away_rw: { x: 165, y: 35 },
        away_d1: { x: 168, y: 52 },
      },
      puck: { x: 188, y: 42 },
      arrows: [{ from: { x: 162, y: 30 }, to: { x: 188, y: 42 }, type: 'pass' }],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. POWER PLAY — 1-3-1
// ─────────────────────────────────────────────────────────────────────────────
const pp131: Tactic = {
  id: 'pp_131',
  title: 'Power Play — 1-3-1',
  category: 'powerplay',
  difficulty: 'advanced',
  description: '1-3-1 overloads the middle and low slot, with quick cross-ice passes to create one-timers.',
  steps: [
    {
      duration: 1000,
      description: '1-3-1 setup: D high, 3 across, LW low near net.',
      players: {
        home_d1: { x: 135, y: 42 },
        home_lw: { x: 155, y: 22 },
        home_c:  { x: 160, y: 42 },
        home_rw: { x: 155, y: 63 },
        home_d2: { x: 172, y: 42 },
        away_lw: { x: 150, y: 35 },
        away_c:  { x: 162, y: 50 },
        away_rw: { x: 172, y: 35 },
        away_d1: { x: 175, y: 50 },
      },
      puck: { x: 135, y: 42 },
      arrows: [],
    },
    {
      duration: 1000,
      description: 'D1 passes up to left wing.',
      players: {
        home_d1: { x: 135, y: 42 },
        home_lw: { x: 155, y: 22 },
        home_c:  { x: 160, y: 42 },
        home_rw: { x: 158, y: 63 },
        home_d2: { x: 172, y: 45 },
        away_lw: { x: 148, y: 32 },
        away_c:  { x: 162, y: 50 },
        away_rw: { x: 165, y: 32 },
        away_d1: { x: 170, y: 50 },
      },
      puck: { x: 155, y: 22 },
      arrows: [{ from: { x: 135, y: 42 }, to: { x: 155, y: 22 }, type: 'pass' }],
    },
    {
      duration: 1000,
      description: 'LW drives lane. Passes cross-ice to RW.',
      players: {
        home_d1: { x: 138, y: 42 },
        home_lw: { x: 158, y: 25 },
        home_c:  { x: 162, y: 42 },
        home_rw: { x: 158, y: 63 },
        home_d2: { x: 172, y: 45 },
        away_lw: { x: 155, y: 32 },
        away_c:  { x: 162, y: 50 },
        away_rw: { x: 168, y: 32 },
        away_d1: { x: 172, y: 50 },
      },
      puck: { x: 158, y: 63 },
      arrows: [{ from: { x: 155, y: 22 }, to: { x: 158, y: 63 }, type: 'pass' }],
    },
    {
      duration: 1000,
      description: 'RW one-timer or passes to net-front (D2).',
      players: {
        home_d1: { x: 138, y: 42 },
        home_lw: { x: 162, y: 25 },
        home_c:  { x: 165, y: 42 },
        home_rw: { x: 158, y: 63 },
        home_d2: { x: 175, y: 45 },
        away_lw: { x: 155, y: 35 },
        away_c:  { x: 162, y: 52 },
        away_rw: { x: 165, y: 35 },
        away_d1: { x: 170, y: 52 },
      },
      puck: { x: 175, y: 45 },
      arrows: [{ from: { x: 158, y: 63 }, to: { x: 175, y: 45 }, type: 'pass' }],
    },
    {
      duration: 1000,
      description: 'Net-front tip/shot. All crash for rebound.',
      players: {
        home_d1: { x: 142, y: 42 },
        home_lw: { x: 168, y: 28 },
        home_c:  { x: 170, y: 42 },
        home_rw: { x: 165, y: 62 },
        home_d2: { x: 178, y: 45 },
        away_lw: { x: 158, y: 35 },
        away_c:  { x: 165, y: 52 },
        away_rw: { x: 168, y: 35 },
        away_d1: { x: 172, y: 52 },
      },
      puck: { x: 190, y: 42 },
      arrows: [{ from: { x: 175, y: 45 }, to: { x: 190, y: 42 }, type: 'pass' }],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. PENALTY KILL — BOX
// ─────────────────────────────────────────────────────────────────────────────
const pkBox: Tactic = {
  id: 'pk_box',
  title: 'Penalty Kill — Box',
  category: 'penaltykill',
  difficulty: 'beginner',
  description: 'Tight 2×2 box in front of the net. Track the puck, collapse, and clear.',
  steps: [
    {
      duration: 1000,
      description: 'Box formation. Away PP circulates at blue line.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_lw: { x: 28, y: 28 },
        home_rw: { x: 28, y: 57 },
        home_c:  { x: 42, y: 28 },
        home_d1: { x: 42, y: 57 },
        away_d1: { x: 55, y: 42 },
        away_lw: { x: 50, y: 20 },
        away_c:  { x: 50, y: 65 },
        away_rw: { x: 32, y: 42 },
      },
      puck: { x: 55, y: 42 },
      arrows: [],
    },
    {
      duration: 1000,
      description: 'Away QB passes to LW on half-wall. Box shifts left.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_lw: { x: 28, y: 22 },
        home_rw: { x: 28, y: 57 },
        home_c:  { x: 40, y: 22 },
        home_d1: { x: 42, y: 57 },
        away_d1: { x: 52, y: 45 },
        away_lw: { x: 50, y: 20 },
        away_c:  { x: 50, y: 65 },
        away_rw: { x: 32, y: 42 },
      },
      puck: { x: 50, y: 20 },
      arrows: [
        { from: { x: 55, y: 42 }, to: { x: 50, y: 20 }, type: 'pass' },
        { from: { x: 28, y: 28 }, to: { x: 28, y: 22 }, type: 'skate' },
        { from: { x: 42, y: 28 }, to: { x: 40, y: 22 }, type: 'skate' },
      ],
    },
    {
      duration: 1000,
      description: 'Top PK player (C) pressures LW on half-wall.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_lw: { x: 28, y: 22 },
        home_rw: { x: 28, y: 57 },
        home_c:  { x: 45, y: 20 },
        home_d1: { x: 42, y: 57 },
        away_d1: { x: 52, y: 45 },
        away_lw: { x: 50, y: 20 },
        away_c:  { x: 50, y: 65 },
        away_rw: { x: 32, y: 42 },
      },
      puck: { x: 50, y: 20 },
      arrows: [{ from: { x: 40, y: 22 }, to: { x: 45, y: 20 }, type: 'skate' }],
    },
    {
      duration: 1000,
      description: 'Away passes back to QB. Box resets.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_lw: { x: 30, y: 26 },
        home_rw: { x: 30, y: 57 },
        home_c:  { x: 42, y: 30 },
        home_d1: { x: 42, y: 57 },
        away_d1: { x: 55, y: 42 },
        away_lw: { x: 50, y: 20 },
        away_c:  { x: 50, y: 65 },
        away_rw: { x: 32, y: 42 },
      },
      puck: { x: 55, y: 42 },
      arrows: [
        { from: { x: 50, y: 20 }, to: { x: 55, y: 42 }, type: 'pass' },
        { from: { x: 45, y: 20 }, to: { x: 42, y: 30 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'PK clears puck up ice! Break.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_lw: { x: 50, y: 22 },
        home_rw: { x: 50, y: 65 },
        home_c:  { x: 65, y: 42 },
        home_d1: { x: 42, y: 57 },
        away_d1: { x: 52, y: 42 },
        away_lw: { x: 48, y: 20 },
        away_c:  { x: 48, y: 65 },
        away_rw: { x: 30, y: 42 },
      },
      puck: { x: 90, y: 42 },
      arrows: [{ from: { x: 42, y: 30 }, to: { x: 90, y: 42 }, type: 'pass' }],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. PENALTY KILL — DIAMOND
// ─────────────────────────────────────────────────────────────────────────────
const pkDiamond: Tactic = {
  id: 'pk_diamond',
  title: 'Penalty Kill — Diamond',
  category: 'penaltykill',
  difficulty: 'intermediate',
  description: 'Diamond PK applies pressure with the top player. Rotate to track puck and block shooting lanes.',
  steps: [
    {
      duration: 1000,
      description: 'Diamond setup: one on top, two on sides, one at net.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_c:  { x: 42, y: 42 },
        home_lw: { x: 30, y: 28 },
        home_rw: { x: 30, y: 57 },
        home_d1: { x: 18, y: 42 },
        away_d1: { x: 55, y: 42 },
        away_lw: { x: 48, y: 20 },
        away_c:  { x: 48, y: 65 },
        away_rw: { x: 32, y: 42 },
      },
      puck: { x: 55, y: 42 },
      arrows: [],
    },
    {
      duration: 1000,
      description: 'Top player (C) pressures QB. Forces quick release.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_c:  { x: 48, y: 42 },
        home_lw: { x: 32, y: 28 },
        home_rw: { x: 32, y: 57 },
        home_d1: { x: 18, y: 42 },
        away_d1: { x: 55, y: 42 },
        away_lw: { x: 48, y: 20 },
        away_c:  { x: 48, y: 65 },
        away_rw: { x: 32, y: 42 },
      },
      puck: { x: 55, y: 42 },
      arrows: [{ from: { x: 42, y: 42 }, to: { x: 48, y: 42 }, type: 'skate' }],
    },
    {
      duration: 1000,
      description: 'QB passes to half-wall (LW). Diamond rotates.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_c:  { x: 40, y: 35 },
        home_lw: { x: 38, y: 22 },
        home_rw: { x: 32, y: 57 },
        home_d1: { x: 20, y: 42 },
        away_d1: { x: 55, y: 42 },
        away_lw: { x: 48, y: 20 },
        away_c:  { x: 48, y: 65 },
        away_rw: { x: 32, y: 42 },
      },
      puck: { x: 48, y: 20 },
      arrows: [
        { from: { x: 55, y: 42 }, to: { x: 48, y: 20 }, type: 'pass' },
        { from: { x: 30, y: 28 }, to: { x: 38, y: 22 }, type: 'skate' },
        { from: { x: 48, y: 42 }, to: { x: 40, y: 35 }, type: 'skate' },
      ],
    },
    {
      duration: 1000,
      description: 'LW pressures away LW on half-wall. Block shooting lane.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_c:  { x: 38, y: 35 },
        home_lw: { x: 42, y: 22 },
        home_rw: { x: 35, y: 58 },
        home_d1: { x: 22, y: 42 },
        away_d1: { x: 55, y: 42 },
        away_lw: { x: 48, y: 20 },
        away_c:  { x: 48, y: 65 },
        away_rw: { x: 32, y: 42 },
      },
      puck: { x: 48, y: 20 },
      arrows: [{ from: { x: 38, y: 22 }, to: { x: 42, y: 22 }, type: 'skate' }],
    },
    {
      duration: 1200,
      description: 'PK gets stick on puck, clears.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_c:  { x: 50, y: 42 },
        home_lw: { x: 55, y: 22 },
        home_rw: { x: 50, y: 65 },
        home_d1: { x: 30, y: 42 },
        away_d1: { x: 52, y: 42 },
        away_lw: { x: 48, y: 20 },
        away_c:  { x: 48, y: 65 },
        away_rw: { x: 30, y: 42 },
      },
      puck: { x: 100, y: 30 },
      arrows: [{ from: { x: 42, y: 22 }, to: { x: 100, y: 30 }, type: 'pass' }],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. NEUTRAL ZONE TRAP
// ─────────────────────────────────────────────────────────────────────────────
const neutralTrap: Tactic = {
  id: 'neutral_trap',
  title: 'Neutral Zone Trap',
  category: 'neutral',
  difficulty: 'intermediate',
  description: 'Clog the neutral zone lanes and force the opponent wide, creating turnovers at centre.',
  steps: [
    {
      duration: 1000,
      description: 'Trap setup: home fills neutral zone. Away carries puck out.',
      players: {
        home_lw: { x: 100, y: 20 },
        home_c:  { x: 105, y: 42 },
        home_rw: { x: 100, y: 65 },
        home_d1: { x: 90,  y: 28 },
        home_d2: { x: 90,  y: 57 },
        away_d1: { x: 148, y: 22 },
        away_lw: { x: 128, y: 20 },
        away_c:  { x: 132, y: 42 },
        away_rw: { x: 128, y: 65 },
        away_d2: { x: 148, y: 63 },
      },
      puck: { x: 132, y: 42 },
      arrows: [{ from: { x: 132, y: 42 }, to: { x: 118, y: 42 }, type: 'skate' }],
    },
    {
      duration: 1000,
      description: 'Home jams neutral zone. Away forced wide to the boards.',
      players: {
        home_lw: { x: 112, y: 20 },
        home_c:  { x: 110, y: 42 },
        home_rw: { x: 112, y: 65 },
        home_d1: { x: 92,  y: 28 },
        home_d2: { x: 92,  y: 57 },
        away_d1: { x: 148, y: 22 },
        away_lw: { x: 120, y: 18 },
        away_c:  { x: 125, y: 42 },
        away_rw: { x: 120, y: 67 },
        away_d2: { x: 148, y: 63 },
      },
      puck: { x: 125, y: 42 },
      arrows: [
        { from: { x: 100, y: 20 }, to: { x: 112, y: 20 }, type: 'skate' },
        { from: { x: 100, y: 65 }, to: { x: 112, y: 65 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'Away winger tries boards. Home D steps up to cut off.',
      players: {
        home_lw: { x: 120, y: 18 },
        home_c:  { x: 115, y: 42 },
        home_rw: { x: 115, y: 65 },
        home_d1: { x: 108, y: 22 },
        home_d2: { x: 95,  y: 57 },
        away_d1: { x: 148, y: 22 },
        away_lw: { x: 122, y: 15 },
        away_c:  { x: 125, y: 42 },
        away_rw: { x: 122, y: 70 },
        away_d2: { x: 148, y: 63 },
      },
      puck: { x: 122, y: 15 },
      arrows: [
        { from: { x: 92, y: 28 }, to: { x: 108, y: 22 }, type: 'skate' },
        { from: { x: 112, y: 20 }, to: { x: 120, y: 18 }, type: 'skate' },
      ],
    },
    {
      duration: 1000,
      description: 'Turnover at neutral zone boards!',
      players: {
        home_lw: { x: 122, y: 15 },
        home_c:  { x: 115, y: 42 },
        home_rw: { x: 115, y: 65 },
        home_d1: { x: 110, y: 22 },
        home_d2: { x: 98,  y: 57 },
        away_d1: { x: 148, y: 22 },
        away_lw: { x: 122, y: 15 },
        away_c:  { x: 125, y: 42 },
        away_rw: { x: 122, y: 70 },
        away_d2: { x: 148, y: 63 },
      },
      puck: { x: 118, y: 42 },
      arrows: [],
    },
    {
      duration: 1200,
      description: 'Home C wins battle. Quick counter-attack with speed.',
      players: {
        home_lw: { x: 130, y: 18 },
        home_c:  { x: 128, y: 42 },
        home_rw: { x: 130, y: 65 },
        home_d1: { x: 112, y: 25 },
        home_d2: { x: 100, y: 55 },
        away_d1: { x: 142, y: 25 },
        away_lw: { x: 128, y: 18 },
        away_c:  { x: 130, y: 42 },
        away_rw: { x: 130, y: 68 },
        away_d2: { x: 145, y: 60 },
      },
      puck: { x: 128, y: 42 },
      arrows: [
        { from: { x: 115, y: 42 }, to: { x: 128, y: 42 }, type: 'skate' },
        { from: { x: 112, y: 20 }, to: { x: 130, y: 18 }, type: 'skate' },
        { from: { x: 115, y: 65 }, to: { x: 130, y: 65 }, type: 'skate' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. REGROUP
// ─────────────────────────────────────────────────────────────────────────────
const regroup: Tactic = {
  id: 'regroup',
  title: 'Regroup',
  category: 'neutral',
  difficulty: 'beginner',
  description: 'Home team peels back to regroup in the neutral zone, then re-enters with momentum.',
  steps: [
    {
      duration: 1000,
      description: 'Zone entry denied. Forwards swing back to NZ.',
      players: {
        home_g:  { x: 6,   y: 42 },
        home_lw: { x: 142, y: 18 },
        home_c:  { x: 140, y: 42 },
        home_rw: { x: 142, y: 67 },
        home_d1: { x: 130, y: 25 },
        home_d2: { x: 130, y: 60 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 170, y: 25 },
        away_d2: { x: 170, y: 60 },
      },
      puck: { x: 155, y: 42 },
      arrows: [
        { from: { x: 142, y: 18 }, to: { x: 100, y: 18 }, type: 'skate' },
        { from: { x: 140, y: 42 }, to: { x: 95,  y: 42 }, type: 'skate' },
        { from: { x: 142, y: 67 }, to: { x: 100, y: 67 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'D hold at own blue line with puck. Forwards regroup in NZ.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_lw: { x: 88, y: 18 },
        home_c:  { x: 82, y: 42 },
        home_rw: { x: 88, y: 67 },
        home_d1: { x: 68, y: 25 },
        home_d2: { x: 68, y: 60 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 165, y: 28 },
        away_d2: { x: 165, y: 57 },
      },
      puck: { x: 68, y: 25 },
      arrows: [
        { from: { x: 142, y: 18 }, to: { x: 88, y: 18 }, type: 'skate' },
        { from: { x: 140, y: 42 }, to: { x: 82, y: 42 }, type: 'skate' },
        { from: { x: 142, y: 67 }, to: { x: 88, y: 67 }, type: 'skate' },
      ],
    },
    {
      duration: 1000,
      description: 'D1 holds puck. Forwards swing into position.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_lw: { x: 78, y: 18 },
        home_c:  { x: 75, y: 42 },
        home_rw: { x: 78, y: 67 },
        home_d1: { x: 65, y: 28 },
        home_d2: { x: 65, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 162, y: 28 },
        away_d2: { x: 162, y: 57 },
      },
      puck: { x: 65, y: 28 },
      arrows: [],
    },
    {
      duration: 1000,
      description: 'D1 passes to breaking center.',
      players: {
        home_g:  { x: 6,  y: 42 },
        home_lw: { x: 85, y: 18 },
        home_c:  { x: 92, y: 42 },
        home_rw: { x: 85, y: 67 },
        home_d1: { x: 65, y: 28 },
        home_d2: { x: 68, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 160, y: 28 },
        away_d2: { x: 160, y: 57 },
      },
      puck: { x: 92, y: 42 },
      arrows: [
        { from: { x: 65, y: 28 }, to: { x: 92, y: 42 }, type: 'pass' },
        { from: { x: 75, y: 42 }, to: { x: 92, y: 42 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'C leads three-lane attack with pace.',
      players: {
        home_g:  { x: 6,   y: 42 },
        home_lw: { x: 108, y: 18 },
        home_c:  { x: 110, y: 42 },
        home_rw: { x: 108, y: 67 },
        home_d1: { x: 78,  y: 28 },
        home_d2: { x: 78,  y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 155, y: 28 },
        away_d2: { x: 155, y: 57 },
      },
      puck: { x: 110, y: 42 },
      arrows: [
        { from: { x: 92, y: 42 }, to: { x: 110, y: 42 }, type: 'skate' },
        { from: { x: 85, y: 18 }, to: { x: 108, y: 18 }, type: 'skate' },
        { from: { x: 85, y: 67 }, to: { x: 108, y: 67 }, type: 'skate' },
      ],
    },
    {
      duration: 1200,
      description: 'Full-speed zone entry. D support at blue line.',
      players: {
        home_g:  { x: 6,   y: 42 },
        home_lw: { x: 148, y: 18 },
        home_c:  { x: 145, y: 42 },
        home_rw: { x: 148, y: 67 },
        home_d1: { x: 118, y: 28 },
        home_d2: { x: 118, y: 58 },
        away_g:  { x: 194, y: 42 },
        away_d1: { x: 148, y: 28 },
        away_d2: { x: 148, y: 57 },
      },
      puck: { x: 145, y: 42 },
      arrows: [
        { from: { x: 110, y: 42 }, to: { x: 145, y: 42 }, type: 'skate' },
        { from: { x: 108, y: 18 }, to: { x: 148, y: 18 }, type: 'skate' },
        { from: { x: 108, y: 67 }, to: { x: 148, y: 67 }, type: 'skate' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export const TACTICS: Tactic[] = [
  basicBreakout,
  reverseBreakout,
  wheel,
  forecheck122,
  forecheck212,
  leftWingLock,
  ppUmbrella,
  pp131,
  pkBox,
  pkDiamond,
  neutralTrap,
  regroup,
];

export const TACTICS_BY_ID: Record<string, Tactic> = Object.fromEntries(
  TACTICS.map(t => [t.id, t])
);

export const TACTICS_BY_CATEGORY: Record<TacticCategory, Tactic[]> = {
  breakout:     TACTICS.filter(t => t.category === 'breakout'),
  forecheck:    TACTICS.filter(t => t.category === 'forecheck'),
  powerplay:    TACTICS.filter(t => t.category === 'powerplay'),
  penaltykill:  TACTICS.filter(t => t.category === 'penaltykill'),
  neutral:      TACTICS.filter(t => t.category === 'neutral'),
};
