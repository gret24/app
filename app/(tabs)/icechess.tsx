import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLY   = '#00D4FF';
const ENEMY  = '#FF3B30';
const PUCK   = '#FFD700';
const BG     = '#0E0E13';
const CARD   = '#1F1F25';
const BORDER = '#3C494E';
const TEXT   = '#E4E1E9';
const SUB    = '#BBC9CF';

// Board zones / columns
const ROWS = ['DZ', 'NZ', 'OZ'] as const;   // 0=DZ(own), 1=NZ, 2=OZ(attack)
const COLS = ['L', 'C', 'R']  as const;
type Zone = typeof ROWS[number];
type Col  = typeof COLS[number];
type Cell = `${Zone}-${Col}`;

function cellId(r: number, c: number): Cell {
  return `${ROWS[r]}-${COLS[c]}` as Cell;
}
function cellPos(id: Cell): [number, number] {
  const r = ROWS.indexOf(id.split('-')[0] as Zone);
  const c = COLS.indexOf(id.split('-')[1] as Col);
  return [r, c];
}

// ─── Game state types ─────────────────────────────────────────────────────────
type PieceId = `ally${1|2|3|4|5}` | `enemy${1|2|3|4|5}`;

interface BoardState {
  pieces: Record<PieceId, Cell>;          // where each piece is
  puck: Cell;                              // puck position
  puckHolder: PieceId | null;             // who is holding the puck
  turn: 'ally' | 'enemy';
  phase: 'move' | 'puck';                 // within a turn
  movedPiece: PieceId | null;
  allyScore: number;
  enemyScore: number;
  selected: PieceId | null;
  log: string[];
}

// ─── Initial positions ────────────────────────────────────────────────────────
const INIT_STATE: BoardState = {
  pieces: {
    ally1: 'DZ-L', ally2: 'DZ-C', ally3: 'DZ-R',
    ally4: 'NZ-L', ally5: 'NZ-R',
    enemy1: 'OZ-L', enemy2: 'OZ-C', enemy3: 'OZ-R',
    enemy4: 'NZ-L', enemy5: 'NZ-R',  // will overlap NZ — fixed below
  } as Record<PieceId, Cell>,
  puck: 'NZ-C',
  puckHolder: null,
  turn: 'ally',
  phase: 'move',
  movedPiece: null,
  allyScore: 0,
  enemyScore: 0,
  selected: null,
  log: ['게임 시작! 아군 턴'],
};
// Fix overlap: enemies mirror (DZ from enemy POV = OZ from ally POV)
INIT_STATE.pieces = {
  ally1: 'DZ-L',  ally2: 'DZ-C',  ally3: 'DZ-R',
  ally4: 'NZ-L',  ally5: 'NZ-R',
  enemy1: 'OZ-L', enemy2: 'OZ-C', enemy3: 'OZ-R',
  enemy4: 'NZ-L', enemy5: 'NZ-R',
};

// ─── Puzzle definitions ───────────────────────────────────────────────────────
interface Puzzle {
  name: string;
  desc: string;
  hint: string;
  init: Partial<BoardState>;
  goal: (s: BoardState) => boolean;
  goalDesc: string;
}

const PUZZLES: Puzzle[] = [
  {
    name: '패스레인 열기',
    desc: 'NZ-L의 상대를 피해 OZ-C로 패스를 성공시켜라',
    hint: 'NZ-L 상대가 막혀 있으니 NZ-R 경유 패스를 노려라',
    goalDesc: 'OZ-C 아군에게 패스 성공',
    init: {
      pieces: {
        ally1: 'NZ-C', ally2: 'OZ-C', ally3: 'DZ-C', ally4: 'DZ-L', ally5: 'DZ-R',
        enemy1: 'NZ-L', enemy2: 'OZ-L', enemy3: 'OZ-R', enemy4: 'DZ-L', enemy5: 'DZ-R',
      } as Record<PieceId, Cell>,
      puck: 'NZ-C',
      puckHolder: 'ally1',
      turn: 'ally',
      phase: 'puck',
      movedPiece: null,
    },
    goal: (s) => s.puckHolder === 'ally2',
  },
  {
    name: '브레이크아웃',
    desc: 'DZ에서 탈출해 OZ까지 퍽을 이동시켜라 (2턴)',
    hint: 'NZ 아군에게 먼저 패스한 뒤 전진',
    goalDesc: 'OZ에 퍽 위치',
    init: {
      pieces: {
        ally1: 'DZ-C', ally2: 'NZ-C', ally3: 'OZ-C', ally4: 'DZ-L', ally5: 'DZ-R',
        enemy1: 'OZ-L', enemy2: 'OZ-C', enemy3: 'OZ-R', enemy4: 'NZ-L', enemy5: 'NZ-R',
      } as Record<PieceId, Cell>,
      puck: 'DZ-C',
      puckHolder: 'ally1',
      turn: 'ally',
      phase: 'puck',
      movedPiece: null,
    },
    goal: (s) => {
      if (!s.puckHolder) return false;
      const [r] = cellPos(s.pieces[s.puckHolder]);
      return r === 2; // OZ row
    },
  },
  {
    name: '갭 공략',
    desc: '수비 2명이 OZ를 막고 있다. 수비가 없는 공간을 찾아 슈팅',
    hint: 'OZ-C는 수비 0명 — 먼저 이동 후 슈팅',
    goalDesc: '슈팅 시도',
    init: {
      pieces: {
        ally1: 'NZ-C', ally2: 'OZ-L', ally3: 'OZ-R', ally4: 'DZ-L', ally5: 'DZ-R',
        enemy1: 'OZ-L', enemy2: 'OZ-R', enemy3: 'NZ-L', enemy4: 'NZ-R', enemy5: 'DZ-C',
      } as Record<PieceId, Cell>,
      puck: 'NZ-C',
      puckHolder: 'ally1',
      turn: 'ally',
      phase: 'move',
      movedPiece: null,
    },
    goal: (s) => {
      // goal: ally with puck is in OZ
      if (!s.puckHolder) return false;
      const [r] = cellPos(s.pieces[s.puckHolder]);
      return s.puckHolder.startsWith('ally') && r === 2;
    },
  },
];

// ─── Helper fns ───────────────────────────────────────────────────────────────
function getPiecesAt(pieces: Record<PieceId, Cell>, cell: Cell): PieceId[] {
  return (Object.entries(pieces) as [PieceId, Cell][])
    .filter(([, c]) => c === cell)
    .map(([id]) => id);
}

function getTeam(id: PieceId): 'ally' | 'enemy' {
  return id.startsWith('ally') ? 'ally' : 'enemy';
}

function adjacentCells(cell: Cell): Cell[] {
  const [r, c] = cellPos(cell);
  const result: Cell[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr; const nc = c + dc;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) result.push(cellId(nr, nc));
    }
  }
  return result;
}

// Straight-line cells between two cells (exclusive). Returns null if not straight.
function cellsBetween(a: Cell, b: Cell): Cell[] | null {
  const [ar, ac] = cellPos(a);
  const [br, bc] = cellPos(b);
  const dr = br - ar; const dc = bc - ac;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  if (dr === 0 && dc === 0) return null;
  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  const cells: Cell[] = [];
  let r = ar + stepR; let c = ac + stepC;
  while (r !== br || c !== bc) {
    cells.push(cellId(r, c));
    r += stepR; c += stepC;
  }
  return cells;
}

function canPass(
  from: Cell, to: Cell,
  pieces: Record<PieceId, Cell>,
  team: 'ally' | 'enemy',
): boolean {
  const between = cellsBetween(from, to);
  if (between === null) return false;
  // Target must have ally
  const atTarget = getPiecesAt(pieces, to).filter(p => getTeam(p) === team);
  if (atTarget.length === 0) return false;
  // Path must be free of enemies
  const opp = team === 'ally' ? 'enemy' : 'ally';
  for (const c of between) {
    if (getPiecesAt(pieces, c).some(p => getTeam(p) === opp)) return false;
  }
  return true;
}

function countDefenders(cell: Cell, pieces: Record<PieceId, Cell>, attackTeam: 'ally' | 'enemy'): number {
  const [r, c] = cellPos(cell);
  let count = 0;
  for (let dc = -1; dc <= 1; dc++) {
    const nc = c + dc;
    if (nc < 0 || nc > 2) continue;
    // Defenders in OZ row (r=2) adjacent columns
    const opp = attackTeam === 'ally' ? 'enemy' : 'ally';
    count += getPiecesAt(pieces, cellId(r, nc)).filter(p => getTeam(p) === opp).length;
  }
  return count;
}

function shootSuccess(defenders: number): boolean {
  const rates = [0.80, 0.40, 0.10];
  const rate = rates[Math.min(defenders, 2)];
  return Math.random() < rate;
}

// ─── Simple AI (enemy turn) ───────────────────────────────────────────────────
function doEnemyTurn(state: BoardState): BoardState {
  let s = { ...state, pieces: { ...state.pieces }, log: [...state.log] };

  // Move: pick a random enemy piece and move it toward NZ or DZ (from ally perspective)
  const enemyIds = (Object.keys(s.pieces) as PieceId[]).filter(p => p.startsWith('enemy'));
  const shuffled = [...enemyIds].sort(() => Math.random() - 0.5);
  let moved = false;
  for (const pid of shuffled) {
    const cell = s.pieces[pid];
    const adj = adjacentCells(cell);
    const free = adj.filter(c => getPiecesAt(s.pieces, c).every(p => p !== pid)).filter(c => {
      // prefer moving toward DZ (row 0)
      const [nr] = cellPos(c);
      const [cr] = cellPos(cell);
      return nr <= cr || Math.random() < 0.3;
    });
    if (free.length > 0) {
      const dest = free[Math.floor(Math.random() * free.length)];
      s.pieces = { ...s.pieces, [pid]: dest };
      s.log = [`상대 ${pid} → ${dest}`, ...s.log.slice(0, 5)];
      moved = true;
      break;
    }
  }

  // Puck action: if enemy holds puck, try to shoot or pass
  if (s.puckHolder && s.puckHolder.startsWith('enemy')) {
    const holder = s.puckHolder;
    const cell = s.pieces[holder];
    const [r] = cellPos(cell);

    // Enemy OZ = DZ (r===0 from ally's perspective)
    if (r === 0) {
      const def = countDefenders(cell, s.pieces, 'enemy');
      if (shootSuccess(def)) {
        s.enemyScore += 1;
        s.puckHolder = null;
        s.puck = 'NZ-C';
        s.log = [`상대 슈팅 성공! (수비 ${def}명) 상대 ${s.enemyScore}점`, ...s.log.slice(0, 5)];
      } else {
        s.puckHolder = null;
        s.puck = cell;
        s.log = [`상대 슈팅 실패`, ...s.log.slice(0, 5)];
      }
    } else {
      // Try pass to closer enemy
      const targets = (Object.keys(s.pieces) as PieceId[])
        .filter(p => p.startsWith('enemy') && p !== holder);
      const passable = targets.filter(t => canPass(cell, s.pieces[t], s.pieces, 'enemy'));
      if (passable.length > 0) {
        const target = passable[0];
        s.puckHolder = target;
        s.puck = s.pieces[target];
        s.log = [`상대 패스 ${holder}→${target}`, ...s.log.slice(0, 5)];
      }
    }
  } else if (!s.puckHolder) {
    // Pick up puck if adjacent
    for (const pid of shuffled) {
      if (adjacentCells(s.pieces[pid]).includes(s.puck) || s.pieces[pid] === s.puck) {
        s.puckHolder = pid;
        s.puck = s.pieces[pid];
        s.log = [`상대 ${pid} 퍽 획득`, ...s.log.slice(0, 5)];
        break;
      }
    }
  }

  s.turn = 'ally';
  s.phase = 'move';
  s.movedPiece = null;
  s.selected = null;
  s.log = [`아군 턴`, ...s.log.slice(0, 7)];
  return s;
}

// ─── Board Cell component ─────────────────────────────────────────────────────
interface CellProps {
  id: Cell;
  row: number;
  col: number;
  pieces: PieceId[];
  puckHolder: PieceId | null;
  puckFree: boolean;
  selected: boolean;
  highlighted: boolean;
  onPress: () => void;
}

function BoardCell({ id, row, col, pieces, puckHolder, puckFree, selected, highlighted, onPress }: CellProps) {
  const zoneBg = row === 2 ? '#1A2A18' : row === 0 ? '#1A1826' : '#1A1F26';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cell,
        { backgroundColor: zoneBg },
        selected && styles.cellSelected,
        highlighted && styles.cellHighlighted,
      ]}
    >
      <Text style={styles.cellLabel}>{id}</Text>
      <View style={styles.cellPieces}>
        {pieces.map(pid => (
          <View
            key={pid}
            style={[
              styles.piece,
              { backgroundColor: getTeam(pid) === 'ally' ? ALLY : ENEMY },
              puckHolder === pid && styles.pieceWithPuck,
            ]}
          />
        ))}
        {puckFree && <View style={styles.puckDot} />}
      </View>
    </Pressable>
  );
}

// ─── Main Game component ──────────────────────────────────────────────────────
type Mode = 'menu' | 'versus' | `puzzle${0|1|2}`;

export default function IceChessScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('menu');
  const [gs, setGs] = useState<BoardState>(INIT_STATE);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const startVersus = useCallback(() => {
    setGs({ ...INIT_STATE, pieces: { ...INIT_STATE.pieces }, log: ['게임 시작! 아군 턴'] });
    setPuzzleSolved(false);
    setMode('versus');
  }, []);

  const startPuzzle = useCallback((idx: 0 | 1 | 2) => {
    const puzzle = PUZZLES[idx];
    const base: BoardState = {
      ...INIT_STATE,
      ...puzzle.init,
      pieces: { ...INIT_STATE.pieces, ...(puzzle.init.pieces ?? {}) },
      allyScore: 0, enemyScore: 0, selected: null,
      log: [`퍼즐: ${puzzle.name}`, puzzle.hint],
    };
    setGs(base);
    setPuzzleSolved(false);
    setMode(`puzzle${idx}` as Mode);
  }, []);

  const currentPuzzle = mode.startsWith('puzzle')
    ? PUZZLES[parseInt(mode.replace('puzzle', ''), 10) as 0|1|2]
    : null;

  function handleCellPress(cellRow: number, cellCol: number) {
    const cell = cellId(cellRow, cellCol);
    setGs(prev => {
      if (prev.turn !== 'ally') return prev;

      // Check win
      if (prev.allyScore >= 3 || prev.enemyScore >= 3) return prev;

      const piecesHere = getPiecesAt(prev.pieces, cell);
      const allyHere = piecesHere.filter(p => getTeam(p) === 'ally');

      // ── MOVE PHASE ──
      if (prev.phase === 'move') {
        if (prev.selected) {
          const sel = prev.selected;
          // Deselect if same
          if (cell === prev.pieces[sel]) return { ...prev, selected: null };
          // Move if adjacent and not occupied by ally
          const adj = adjacentCells(prev.pieces[sel]);
          if (adj.includes(cell) && allyHere.length === 0) {
            let newPieces = { ...prev.pieces, [sel]: cell };
            let newPuckHolder = prev.puckHolder;
            let newPuck = prev.puck;

            // Auto-pick up free puck
            if (!prev.puckHolder && cell === prev.puck) {
              newPuckHolder = sel;
            }
            // Drag puck if holding
            if (prev.puckHolder === sel) {
              newPuck = cell;
            }

            const next: BoardState = {
              ...prev,
              pieces: newPieces,
              puck: newPuck,
              puckHolder: newPuckHolder,
              phase: 'puck',
              movedPiece: sel,
              selected: null,
              log: [`${sel} → ${cell}`, ...prev.log.slice(0, 7)],
            };

            // Check puzzle goal
            if (currentPuzzle && currentPuzzle.goal(next)) {
              setPuzzleSolved(true);
            }
            return next;
          }
          // Select new ally
          if (allyHere.length > 0) return { ...prev, selected: allyHere[0] };
          return { ...prev, selected: null };
        } else {
          // Select ally
          if (allyHere.length > 0) return { ...prev, selected: allyHere[0] };
        }
        return prev;
      }

      // ── PUCK PHASE ──
      if (prev.phase === 'puck') {
        const holder = prev.puckHolder;

        // If ally doesn't hold puck: pick up if on cell
        if (!holder || getTeam(holder) !== 'ally') {
          if (cell === prev.puck && allyHere.length > 0) {
            return { ...prev, puckHolder: allyHere[0], log: [`${allyHere[0]} 퍽 획득`, ...prev.log.slice(0, 7)] };
          }
          // Skip puck phase
          if (cell === prev.pieces[prev.movedPiece!]) {
            const next = doEnemyTurn({ ...prev, turn: 'enemy' });
            if (currentPuzzle && currentPuzzle.goal(next)) setPuzzleSolved(true);
            return next;
          }
          return prev;
        }

        const holderCell = prev.pieces[holder];
        const [holderRow] = cellPos(holderCell);

        // Shoot: tap the same cell as holder when in OZ (row 2)
        if (cell === holderCell && holderRow === 2) {
          const def = countDefenders(holderCell, prev.pieces, 'ally');
          const success = shootSuccess(def);
          let newScore = prev.allyScore;
          let newPuckHolder: PieceId | null = holder;
          let newPuck = prev.puck;
          let logMsg: string;
          if (success) {
            newScore += 1;
            newPuckHolder = null;
            newPuck = 'NZ-C';
            logMsg = `슈팅 성공! (수비 ${def}명) 아군 ${newScore}점`;
          } else {
            newPuckHolder = null;
            newPuck = holderCell;
            logMsg = `슈팅 실패 (수비 ${def}명, 성공률 ${[80,40,10][Math.min(def,2)]}%)`;
          }
          const next: BoardState = {
            ...prev, allyScore: newScore, puckHolder: newPuckHolder, puck: newPuck,
            log: [logMsg, ...prev.log.slice(0, 7)],
          };
          if (newScore >= 3) return { ...next, log: ['아군 승리! 🎉', ...next.log.slice(0, 7)] };
          if (currentPuzzle && currentPuzzle.goal(next)) setPuzzleSolved(true);
          const afterEnemy = doEnemyTurn({ ...next, turn: 'enemy' });
          return afterEnemy;
        }

        // Pass
        if (canPass(holderCell, cell, prev.pieces, 'ally')) {
          const receiver = getPiecesAt(prev.pieces, cell).find(p => getTeam(p) === 'ally')!;
          const next: BoardState = {
            ...prev,
            puckHolder: receiver,
            puck: cell,
            log: [`패스 ${holder}→${receiver} (${cell})`, ...prev.log.slice(0, 7)],
          };
          if (currentPuzzle && currentPuzzle.goal(next)) setPuzzleSolved(true);
          const afterEnemy = doEnemyTurn({ ...next, turn: 'enemy' });
          return afterEnemy;
        }

        // Skip puck action: tap moved piece's cell again
        if (prev.movedPiece && cell === prev.pieces[prev.movedPiece]) {
          const next = doEnemyTurn({ ...prev, turn: 'enemy' });
          if (currentPuzzle && currentPuzzle.goal(next)) setPuzzleSolved(true);
          return next;
        }

        return prev;
      }

      return prev;
    });
  }

  const isVersus = mode === 'versus';
  const isPuzzle = mode.startsWith('puzzle');
  const gameOver = gs.allyScore >= 3 || gs.enemyScore >= 3;

  // ── MENU ──
  if (mode === 'menu') {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>♟️ Ice Chess</Text>
        <Text style={styles.subtitle}>9칸 링크 보드 하키 전술</Text>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>대전 모드</Text>
          <Pressable style={styles.menuBtn} onPress={startVersus}>
            <Text style={styles.menuBtnIcon}>⚔️</Text>
            <View>
              <Text style={styles.menuBtnTitle}>2인 대전</Text>
              <Text style={styles.menuBtnSub}>vs AI — 3골 선승</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>퍼즐 모드</Text>
          {PUZZLES.map((p, i) => (
            <Pressable key={i} style={styles.menuBtn} onPress={() => startPuzzle(i as 0|1|2)}>
              <Text style={styles.menuBtnIcon}>{['🔗','🚀','🎯'][i]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuBtnTitle}>{p.name}</Text>
                <Text style={styles.menuBtnSub}>{p.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>규칙 요약</Text>
          {[
            '3×3 보드: DZ/NZ/OZ × L/C/R',
            '턴제: 말 이동 → 퍽 액션',
            '패스: 직선, 경로에 상대 없을 때',
            'OZ에서 슈팅 (수비 0명 80%, 1명 40%, 2명 10%)',
            '3골 선승',
          ].map(r => (
            <Text key={r} style={styles.ruleItem}>• {r}</Text>
          ))}
        </View>
      </View>
    );
  }

  // ── GAME BOARD ──
  const allyPassTargets: Cell[] = [];
  if (gs.phase === 'puck' && gs.puckHolder && getTeam(gs.puckHolder) === 'ally') {
    const holderCell = gs.pieces[gs.puckHolder];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const target = cellId(r, c);
        if (canPass(holderCell, target, gs.pieces, 'ally')) allyPassTargets.push(target);
      }
    }
  }

  const phaseText = gs.turn === 'ally'
    ? gs.phase === 'move' ? '아군 턴 — 말을 이동하세요' : '퍽 액션 — 패스/슈팅/스킵(이동한 말 재탭)'
    : '상대 턴...';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => setMode('menu')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 메뉴</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isPuzzle ? `퍼즐: ${currentPuzzle!.name}` : 'Ice Chess'}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Score */}
      {isVersus && (
        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreVal, { color: ALLY }]}>{gs.allyScore}</Text>
            <Text style={styles.scoreLabel}>아군</Text>
          </View>
          <Text style={styles.scoreSep}>—</Text>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreVal, { color: ENEMY }]}>{gs.enemyScore}</Text>
            <Text style={styles.scoreLabel}>상대</Text>
          </View>
        </View>
      )}

      {/* Phase indicator */}
      <View style={styles.phaseBar}>
        <Text style={styles.phaseText}>{gameOver ? (gs.allyScore >= 3 ? '🎉 아군 승리!' : '😞 상대 승리') : phaseText}</Text>
      </View>

      {/* Board */}
      <View style={styles.boardContainer}>
        {/* Column labels */}
        <View style={styles.colLabels}>
          <View style={{ width: 38 }} />
          {COLS.map(c => <Text key={c} style={styles.colLabel}>{c}</Text>)}
        </View>

        {ROWS.map((zone, ri) => (
          <View key={zone} style={styles.boardRow}>
            <View style={styles.rowLabelBox}>
              <Text style={styles.rowLabel}>{zone}</Text>
              {ri === 2 && <Text style={[styles.rowLabel, { fontSize: 9, color: '#34C759' }]}>⚽</Text>}
            </View>
            {COLS.map((_, ci) => {
              const cell = cellId(ri, ci);
              const piecesHere = getPiecesAt(gs.pieces, cell);
              const isSel = gs.selected !== null && gs.pieces[gs.selected] === cell;
              const isHighlighted = allyPassTargets.includes(cell);
              const puckFree = !gs.puckHolder && gs.puck === cell;
              // Highlight move targets
              const isMoveTarget = gs.selected !== null && gs.phase === 'move'
                && adjacentCells(gs.pieces[gs.selected]).includes(cell)
                && getPiecesAt(gs.pieces, cell).filter(p => getTeam(p) === 'ally').length === 0;

              return (
                <BoardCell
                  key={cell}
                  id={cell}
                  row={ri}
                  col={ci}
                  pieces={piecesHere}
                  puckHolder={gs.puckHolder}
                  puckFree={puckFree}
                  selected={isSel}
                  highlighted={isHighlighted || isMoveTarget}
                  onPress={() => !gameOver && handleCellPress(ri, ci)}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: ALLY }]} /><Text style={styles.legendText}>아군</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: ENEMY }]} /><Text style={styles.legendText}>상대</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: PUCK }]} /><Text style={styles.legendText}>퍽</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#2A3A2A', borderWidth: 1, borderColor: '#34C759' }]} /><Text style={styles.legendText}>이동가능</Text></View>
      </View>

      {/* Log */}
      <View style={styles.logBox}>
        <Text style={styles.logTitle}>로그</Text>
        {gs.log.slice(0, 5).map((l, i) => (
          <Text key={i} style={[styles.logItem, i === 0 && styles.logItemLatest]}>{l}</Text>
        ))}
      </View>

      {/* Puzzle goal */}
      {isPuzzle && (
        <View style={[styles.puzzleGoal, puzzleSolved && { borderColor: '#34C759' }]}>
          <Text style={styles.puzzleGoalLabel}>목표</Text>
          <Text style={styles.puzzleGoalText}>{currentPuzzle!.goalDesc}</Text>
          {puzzleSolved && <Text style={styles.puzzleSolved}>✅ 퍼즐 클리어!</Text>}
        </View>
      )}

      {/* Restart */}
      {(gameOver || puzzleSolved) && (
        <Pressable style={styles.restartBtn} onPress={isVersus ? startVersus : () => setMode('menu')}>
          <Text style={styles.restartBtnText}>{isVersus ? '다시 시작' : '메뉴로'}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  // Menu
  title: { fontSize: 32, fontWeight: '800', color: ALLY, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: SUB, textAlign: 'center', marginBottom: 24 },
  menuSection: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: SUB, letterSpacing: 1, marginBottom: 8 },
  menuBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 8,
  },
  menuBtnIcon: { fontSize: 28 },
  menuBtnTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  menuBtnSub: { fontSize: 12, color: SUB, marginTop: 2 },
  rulesBox: { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BORDER, gap: 6 },
  rulesTitle: { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 4 },
  ruleItem: { fontSize: 12, color: SUB, lineHeight: 18 },
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: CARD, borderRadius: 8 },
  backBtnText: { fontSize: 13, color: ALLY, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  // Score
  scoreRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 8 },
  scoreBox: { alignItems: 'center' },
  scoreVal: { fontSize: 48, fontWeight: '800' },
  scoreLabel: { fontSize: 12, color: SUB, fontWeight: '600' },
  scoreSep: { fontSize: 24, color: BORDER },
  // Phase
  phaseBar: { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  phaseText: { fontSize: 13, color: TEXT, textAlign: 'center', fontWeight: '600' },
  // Board
  boardContainer: { marginHorizontal: 12, marginBottom: 12 },
  colLabels: { flexDirection: 'row', marginBottom: 2 },
  colLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: SUB },
  boardRow: { flexDirection: 'row', marginBottom: 4 },
  rowLabelBox: { width: 38, justifyContent: 'center', alignItems: 'center', gap: 2 },
  rowLabel: { fontSize: 11, fontWeight: '700', color: SUB },
  cell: {
    flex: 1, minHeight: 80, borderRadius: 10, marginHorizontal: 2,
    padding: 6, borderWidth: 1.5, borderColor: BORDER,
    justifyContent: 'space-between',
  },
  cellSelected: { borderColor: ALLY, borderWidth: 2.5 },
  cellHighlighted: { borderColor: '#34C759', borderWidth: 2 },
  cellLabel: { fontSize: 9, color: '#555', fontWeight: '600' },
  cellPieces: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center', flex: 1, alignItems: 'center' },
  piece: { width: 20, height: 20, borderRadius: 10 },
  pieceWithPuck: { borderWidth: 2.5, borderColor: PUCK },
  puckDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: PUCK },
  // Legend
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: SUB },
  // Log
  logBox: { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 12, gap: 4 },
  logTitle: { fontSize: 10, fontWeight: '700', color: SUB, letterSpacing: 0.8, marginBottom: 2 },
  logItem: { fontSize: 12, color: SUB },
  logItemLatest: { color: TEXT, fontWeight: '600' },
  // Puzzle
  puzzleGoal: { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 12, gap: 4 },
  puzzleGoalLabel: { fontSize: 10, fontWeight: '700', color: SUB, letterSpacing: 0.8 },
  puzzleGoalText: { fontSize: 13, color: TEXT, fontWeight: '600' },
  puzzleSolved: { fontSize: 16, color: '#34C759', fontWeight: '800', marginTop: 4 },
  // Restart
  restartBtn: { marginHorizontal: 16, backgroundColor: ALLY + '22', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: ALLY + '88', marginBottom: 8 },
  restartBtnText: { fontSize: 15, fontWeight: '700', color: ALLY },
});
