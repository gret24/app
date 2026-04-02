import { type TacticCategory } from './data/tactics';

// ─── Types ────────────────────────────────────────────────────────────────────
export type LessonType = 'animation' | 'video';
export type PlanTier = 'free' | 'starter' | 'pro';
export type CurriculumLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface CurriculumLesson {
  type: LessonType;
  contentId: string;   // tacticId for animation, videoId for video
  title: string;
}

export interface CurriculumWeek {
  weekNumber: number;
  title: string;
  description: string;
  difficulty: CurriculumLevel;
  category: TacticCategory;
  requiredScore: number;   // min score on PREVIOUS week to unlock (0 = always available)
  planGate: PlanTier;
  lessons: CurriculumLesson[];
}

// ─── 16-Week Curriculum ───────────────────────────────────────────────────────
export const CURRICULUM: CurriculumWeek[] = [

  // ── BEGINNER  (weeks 1-6) ────────────────────────────────────────────────
  {
    weekNumber: 1,
    title: 'Introduction to Breakouts',
    description: 'Learn the basic 5-player breakout structure and lane responsibilities.',
    difficulty: 'Beginner',
    category: 'breakout',
    requiredScore: 0,       // always unlocked
    planGate: 'free',
    lessons: [
      { type: 'animation', contentId: 'basic_breakout',   title: 'Basic Breakout Animation' },
      { type: 'video',     contentId: 'LPmGKBaRMhc',      title: 'Skating Fundamentals' },
    ],
  },
  {
    weekNumber: 2,
    title: 'Reverse & Wheel',
    description: 'Explore the reverse pass through the goalie and the D-wheel breakout.',
    difficulty: 'Beginner',
    category: 'breakout',
    requiredScore: 80,
    planGate: 'starter',
    lessons: [
      { type: 'animation', contentId: 'reverse_breakout', title: 'Reverse Breakout Animation' },
      { type: 'animation', contentId: 'wheel',            title: 'Wheel Breakout Animation' },
    ],
  },
  {
    weekNumber: 3,
    title: 'Neutral Zone Basics',
    description: 'Understand how to use the neutral zone for regrouping and transition.',
    difficulty: 'Beginner',
    category: 'neutral',
    requiredScore: 80,
    planGate: 'starter',
    lessons: [
      { type: 'animation', contentId: 'regroup',          title: 'Regroup Animation' },
      { type: 'video',     contentId: 'XiEBxBkBCBo',      title: 'Stickhandling Drills' },
    ],
  },
  {
    weekNumber: 4,
    title: 'Penalty Kill Box',
    description: 'Master the 2×2 box penalty kill formation and clearing techniques.',
    difficulty: 'Beginner',
    category: 'penaltykill',
    requiredScore: 80,
    planGate: 'starter',
    lessons: [
      { type: 'animation', contentId: 'pk_box',           title: 'PK Box Animation' },
      { type: 'video',     contentId: '9kgBiMk8HMc',      title: 'Defensive Positioning' },
    ],
  },
  {
    weekNumber: 5,
    title: 'Basic Forechecking',
    description: 'Learn the 1-2-2 forecheck: single pressure with lane support.',
    difficulty: 'Beginner',
    category: 'forecheck',
    requiredScore: 80,
    planGate: 'starter',
    lessons: [
      { type: 'animation', contentId: 'forecheck_122',    title: '1-2-2 Forecheck Animation' },
    ],
  },
  {
    weekNumber: 6,
    title: 'Power Play Fundamentals',
    description: 'Set up and execute the umbrella power play formation.',
    difficulty: 'Beginner',
    category: 'powerplay',
    requiredScore: 80,
    planGate: 'starter',
    lessons: [
      { type: 'animation', contentId: 'pp_umbrella',      title: 'PP Umbrella Animation' },
      { type: 'video',     contentId: 'r5IJufntqL0',      title: 'Wrist Shot Technique' },
    ],
  },

  // ── INTERMEDIATE  (weeks 7-11) ──────────────────────────────────────────
  {
    weekNumber: 7,
    title: 'Aggressive Forechecking',
    description: 'Apply the 2-1-2 forecheck to pin opponents in their zone.',
    difficulty: 'Intermediate',
    category: 'forecheck',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'forecheck_212',    title: '2-1-2 Forecheck Animation' },
      { type: 'video',     contentId: 'jF4PLbD6Ofs',      title: 'Power Skating' },
    ],
  },
  {
    weekNumber: 8,
    title: 'Neutral Zone Trap',
    description: 'Deploy the trap to control centre ice and force turnovers.',
    difficulty: 'Intermediate',
    category: 'neutral',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'neutral_trap',     title: 'NZ Trap Animation' },
    ],
  },
  {
    weekNumber: 9,
    title: 'PK Diamond',
    description: 'Learn active penalty kill with the rotating diamond shape.',
    difficulty: 'Intermediate',
    category: 'penaltykill',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'pk_diamond',       title: 'PK Diamond Animation' },
      { type: 'video',     contentId: '9kgBiMk8HMc',      title: 'Defensive Positioning' },
    ],
  },
  {
    weekNumber: 10,
    title: 'PP 1-3-1 Setup',
    description: 'Execute the high-danger 1-3-1 power play with cross-ice one-timers.',
    difficulty: 'Intermediate',
    category: 'powerplay',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'pp_131',           title: 'PP 1-3-1 Animation' },
      { type: 'video',     contentId: 'r5IJufntqL0',      title: 'Wrist Shot Technique' },
    ],
  },
  {
    weekNumber: 11,
    title: 'Advanced Breakouts',
    description: 'Combine the wheel and reverse breakout based on forecheck pressure.',
    difficulty: 'Intermediate',
    category: 'breakout',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'reverse_breakout', title: 'Reverse Breakout (Advanced)' },
      { type: 'animation', contentId: 'wheel',            title: 'Wheel Under Pressure' },
      { type: 'video',     contentId: 'jF4PLbD6Ofs',      title: 'Power Skating Edges' },
    ],
  },

  // ── ADVANCED  (weeks 12-16) ─────────────────────────────────────────────
  {
    weekNumber: 12,
    title: 'Left-Wing Lock System',
    description: 'Master the left-wing lock to create a defensive/offensive hybrid NZ.',
    difficulty: 'Advanced',
    category: 'forecheck',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'left_wing_lock',   title: 'Left-Wing Lock Animation' },
    ],
  },
  {
    weekNumber: 13,
    title: 'Reading and Reacting',
    description: 'Combine all forecheck systems and choose the right one by reading the opponent.',
    difficulty: 'Advanced',
    category: 'forecheck',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'forecheck_122',    title: '1-2-2 Read & React' },
      { type: 'animation', contentId: 'forecheck_212',    title: '2-1-2 Read & React' },
      { type: 'animation', contentId: 'left_wing_lock',   title: 'LWL Trigger Read' },
    ],
  },
  {
    weekNumber: 14,
    title: 'Full PP Playbook',
    description: 'Switch seamlessly between umbrella and 1-3-1 based on PK coverage.',
    difficulty: 'Advanced',
    category: 'powerplay',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'pp_umbrella',      title: 'Umbrella vs 1-3-1 Switch' },
      { type: 'animation', contentId: 'pp_131',           title: '1-3-1 Overload' },
      { type: 'video',     contentId: '3HQxDMZMIVs',      title: 'Puck Handling Advanced' },
    ],
  },
  {
    weekNumber: 15,
    title: 'Full PK Playbook',
    description: 'Read the PP setup and choose box vs diamond dynamically.',
    difficulty: 'Advanced',
    category: 'penaltykill',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'pk_box',           title: 'Box vs Diamond Decision' },
      { type: 'animation', contentId: 'pk_diamond',       title: 'Active PK Pressure' },
    ],
  },
  {
    weekNumber: 16,
    title: 'Game Situation Mastery',
    description: 'Put it all together: read the game state and deploy the right system instantly.',
    difficulty: 'Advanced',
    category: 'neutral',
    requiredScore: 80,
    planGate: 'pro',
    lessons: [
      { type: 'animation', contentId: 'regroup',          title: 'Regroup Under Pressure' },
      { type: 'animation', contentId: 'neutral_trap',     title: 'Trap to Protect Lead' },
      { type: 'animation', contentId: 'basic_breakout',   title: 'Fast Breakout (End-to-End)' },
    ],
  },
];

// ─── Lock helpers ─────────────────────────────────────────────────────────────

/**
 * Returns an array of per-week lock/unlock state.
 * @param scores  Map of weekNumber → score (0-100).
 * @param plan    Current plan tier of the user.
 */
export function getWeekStates(
  scores: Record<number, number>,
  plan: PlanTier
): { week: CurriculumWeek; locked: boolean; completed: boolean }[] {
  return CURRICULUM.map(week => {
    // Check plan gate
    const planOrder: PlanTier[] = ['free', 'starter', 'pro'];
    const planLocked = planOrder.indexOf(plan) < planOrder.indexOf(week.planGate);

    // Check score gate (previous week)
    const prevScore = week.weekNumber > 1 ? (scores[week.weekNumber - 1] ?? 0) : 100;
    const scoreLocked = prevScore < week.requiredScore;

    const locked = planLocked || scoreLocked;
    const completed = (scores[week.weekNumber] ?? 0) >= 80;

    return { week, locked, completed };
  });
}

export function overallProgress(scores: Record<number, number>): number {
  const total = CURRICULUM.length;
  const done = CURRICULUM.filter(w => (scores[w.weekNumber] ?? 0) >= 80).length;
  return Math.round((done / total) * 100);
}

export const LEVELS: { level: CurriculumLevel; weekRange: [number, number]; emoji: string }[] = [
  { level: 'Beginner',     weekRange: [1,  6],  emoji: '🟢' },
  { level: 'Intermediate', weekRange: [7,  11], emoji: '🟡' },
  { level: 'Advanced',     weekRange: [12, 16], emoji: '🔴' },
];
