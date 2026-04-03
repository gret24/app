// ─── Types ────────────────────────────────────────────────────────────────────
export interface CurriculumLesson {
  type: 'theory' | 'animation' | 'clip_analysis' | 'quiz';
  title: string;
  contentId?: string;
  durationMin: number;
}

export interface CurriculumDay {
  dayNumber: number;
  lessons: CurriculumLesson[];
}

export interface CurriculumWeek {
  weekNumber: number;
  phase: 1 | 2 | 3;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  planRequired: 'free' | 'starter' | 'pro';
  days: CurriculumDay[];
  requiredScore: 80;
}

// ─── 15-Week Curriculum ───────────────────────────────────────────────────────

export const CURRICULUM_15: CurriculumWeek[] = [

  // ── PHASE 1: Hockey Basics (Weeks 1–5) ──────────────────────────────────
  {
    weekNumber: 1,
    phase: 1,
    title: 'Hockey Rules & Fundamentals',
    description: 'Learn the essential rules of ice hockey: zones, icing, offside, penalties, and faceoff procedures.',
    difficulty: 'beginner',
    planRequired: 'free',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Ice Rink Zones Explained',     durationMin: 10 },
          { type: 'animation',    title: 'Zone Diagram',                  contentId: 'basic_breakout', durationMin: 5 },
          { type: 'quiz',         title: 'Zones Knowledge Check',         durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Icing & Offside Rules',         durationMin: 10 },
          { type: 'clip_analysis',title: 'Offside Call in Real Game',      durationMin: 8 },
          { type: 'quiz',         title: 'Icing & Offside Quiz',           durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Penalties & Power Play Rules',   durationMin: 10 },
          { type: 'animation',    title: 'PK Box Formation Intro',         contentId: 'pk_box', durationMin: 5 },
          { type: 'quiz',         title: 'Rules Mastery Quiz',             durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 2,
    phase: 1,
    title: 'Player Positions & Roles',
    description: 'Understand the role of each position: goalie, defensemen, wingers, and center.',
    difficulty: 'beginner',
    planRequired: 'free',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Goalie & Defensemen Roles',      durationMin: 12 },
          { type: 'animation',    title: 'Defensive Pair Positioning',     contentId: 'basic_breakout', durationMin: 5 },
          { type: 'quiz',         title: 'Defense Position Quiz',          durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Forward Lines: LW, C, RW',       durationMin: 10 },
          { type: 'animation',    title: 'Forward Triangle',               contentId: 'forecheck_122', durationMin: 5 },
          { type: 'quiz',         title: 'Forward Roles Quiz',             durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Line Changes & Shifts',          durationMin: 8 },
          { type: 'clip_analysis',title: 'Bench Management Clip',          durationMin: 8 },
          { type: 'quiz',         title: 'Positions Mastery Quiz',         durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 3,
    phase: 1,
    title: 'Team Formations & Structure',
    description: 'Learn how teams set up in each zone and the basic formation principles.',
    difficulty: 'beginner',
    planRequired: 'starter',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Defensive Zone Setup',           durationMin: 10 },
          { type: 'animation',    title: 'Defensive Zone Coverage',        contentId: 'pk_box', durationMin: 6 },
          { type: 'quiz',         title: 'DZ Formation Quiz',              durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Offensive Zone Entry',           durationMin: 10 },
          { type: 'animation',    title: 'OZ Umbrella Setup',              contentId: 'pp_umbrella', durationMin: 6 },
          { type: 'quiz',         title: 'OZ Formation Quiz',              durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Neutral Zone Alignment',         durationMin: 8 },
          { type: 'animation',    title: 'Neutral Zone Regroup',           contentId: 'regroup', durationMin: 5 },
          { type: 'quiz',         title: 'Formations Mastery Quiz',        durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 4,
    phase: 1,
    title: 'Gap Control & Defensive Reads',
    description: 'Master gap control between attackers and defenders, and learn defensive zone reads.',
    difficulty: 'beginner',
    planRequired: 'starter',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'What Is Gap Control?',           durationMin: 10 },
          { type: 'animation',    title: 'Tight Gap Drill',                contentId: 'neutral_trap', durationMin: 6 },
          { type: 'quiz',         title: 'Gap Control Quiz',               durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Reading the Rush',               durationMin: 10 },
          { type: 'clip_analysis',title: '2-on-1 Defensive Read Clip',     durationMin: 8 },
          { type: 'quiz',         title: 'Rush Defense Quiz',              durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Backchecking Principles',        durationMin: 8 },
          { type: 'animation',    title: 'Backcheck Recovery Path',        contentId: 'basic_breakout', durationMin: 5 },
          { type: 'quiz',         title: 'Defensive Reads Mastery Quiz',   durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 5,
    phase: 1,
    title: 'Reading Video & Game Film',
    description: 'Develop the skill to analyze game footage and identify tactical patterns.',
    difficulty: 'beginner',
    planRequired: 'starter',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'What to Look for in Film',       durationMin: 12 },
          { type: 'clip_analysis',title: 'Identifying Breakout Patterns',  durationMin: 10 },
          { type: 'quiz',         title: 'Film Reading Quiz',              durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Tracking the Puck Carrier',      durationMin: 10 },
          { type: 'clip_analysis',title: 'Puck Possession Analysis',       durationMin: 8 },
          { type: 'quiz',         title: 'Puck Tracking Quiz',             durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Phase 1 Review',                 durationMin: 10 },
          { type: 'animation',    title: 'Basics Recap Animation',         contentId: 'basic_breakout', durationMin: 5 },
          { type: 'quiz',         title: 'Phase 1 Final Exam',             durationMin: 15 },
        ],
      },
    ],
  },

  // ── PHASE 2: Tactical Systems (Weeks 6–10) ───────────────────────────────
  {
    weekNumber: 6,
    phase: 2,
    title: 'Breakout Systems',
    description: 'Master the basic, reverse, and wheel breakout systems for transitioning out of your zone.',
    difficulty: 'intermediate',
    planRequired: 'starter',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Breakout Principles',            durationMin: 10 },
          { type: 'animation',    title: 'Basic Breakout',                 contentId: 'basic_breakout', durationMin: 6 },
          { type: 'quiz',         title: 'Basic Breakout Quiz',            durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Reverse Pass Breakout',          durationMin: 10 },
          { type: 'animation',    title: 'Reverse Breakout Animation',     contentId: 'reverse_breakout', durationMin: 6 },
          { type: 'quiz',         title: 'Reverse Breakout Quiz',          durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Wheel Breakout Under Pressure',  durationMin: 10 },
          { type: 'animation',    title: 'Wheel Breakout Animation',       contentId: 'wheel', durationMin: 6 },
          { type: 'quiz',         title: 'Breakout Systems Mastery Quiz',  durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 7,
    phase: 2,
    title: 'Forechecking Strategies',
    description: 'Learn the 1-2-2 and 2-1-2 forecheck systems and when to deploy each.',
    difficulty: 'intermediate',
    planRequired: 'starter',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Forecheck Purpose & Timing',     durationMin: 10 },
          { type: 'animation',    title: '1-2-2 Forecheck',                contentId: 'forecheck_122', durationMin: 6 },
          { type: 'quiz',         title: '1-2-2 Forecheck Quiz',           durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Aggressive 2-1-2 Forecheck',     durationMin: 10 },
          { type: 'animation',    title: '2-1-2 Forecheck Animation',      contentId: 'forecheck_212', durationMin: 6 },
          { type: 'quiz',         title: '2-1-2 Forecheck Quiz',           durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Left-Wing Lock Introduction',    durationMin: 10 },
          { type: 'animation',    title: 'Left-Wing Lock Animation',       contentId: 'left_wing_lock', durationMin: 6 },
          { type: 'quiz',         title: 'Forechecking Mastery Quiz',      durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 8,
    phase: 2,
    title: 'Offensive Zone Tactics',
    description: 'Set up and execute effective offensive zone plays to generate high-danger scoring chances.',
    difficulty: 'intermediate',
    planRequired: 'starter',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'OZ Cycle & Board Play',          durationMin: 10 },
          { type: 'animation',    title: 'PP Umbrella OZ Setup',           contentId: 'pp_umbrella', durationMin: 6 },
          { type: 'quiz',         title: 'OZ Cycle Quiz',                  durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Overload & Screen Plays',        durationMin: 10 },
          { type: 'animation',    title: 'PP 1-3-1 Overload',              contentId: 'pp_131', durationMin: 6 },
          { type: 'quiz',         title: 'OZ Overload Quiz',               durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Protecting the Lead in OZ',      durationMin: 8 },
          { type: 'clip_analysis',title: 'NHL OZ Possession Clip',         durationMin: 8 },
          { type: 'quiz',         title: 'OZ Tactics Mastery Quiz',        durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 9,
    phase: 2,
    title: 'Power Play & Penalty Kill',
    description: 'Learn the key power play formations and penalty kill systems to dominate special teams.',
    difficulty: 'intermediate',
    planRequired: 'pro',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Power Play Setup Principles',    durationMin: 10 },
          { type: 'animation',    title: 'Umbrella PP Animation',          contentId: 'pp_umbrella', durationMin: 6 },
          { type: 'quiz',         title: 'PP Setup Quiz',                  durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Penalty Kill Box vs Diamond',    durationMin: 10 },
          { type: 'animation',    title: 'PK Diamond Animation',           contentId: 'pk_diamond', durationMin: 6 },
          { type: 'quiz',         title: 'PK Systems Quiz',                durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Reading PP Coverage',            durationMin: 8 },
          { type: 'animation',    title: 'PP vs PK Matchup',               contentId: 'pp_131', durationMin: 6 },
          { type: 'quiz',         title: 'Special Teams Mastery Quiz',     durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 10,
    phase: 2,
    title: 'Neutral Zone Systems',
    description: 'Control the neutral zone with the trap, regroup, and transition systems.',
    difficulty: 'intermediate',
    planRequired: 'pro',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Neutral Zone Trap Principles',   durationMin: 10 },
          { type: 'animation',    title: 'NZ Trap Animation',              contentId: 'neutral_trap', durationMin: 6 },
          { type: 'quiz',         title: 'NZ Trap Quiz',                   durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Regroup Patterns',               durationMin: 10 },
          { type: 'animation',    title: 'Regroup Animation',              contentId: 'regroup', durationMin: 6 },
          { type: 'quiz',         title: 'Regroup Quiz',                   durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Phase 2 Tactical Review',        durationMin: 10 },
          { type: 'clip_analysis',title: 'NZ System Film Analysis',        durationMin: 10 },
          { type: 'quiz',         title: 'Phase 2 Final Exam',             durationMin: 15 },
        ],
      },
    ],
  },

  // ── PHASE 3: Game Intelligence (Weeks 11–15) ─────────────────────────────
  {
    weekNumber: 11,
    phase: 3,
    title: 'Reading Opponents',
    description: 'Develop the ability to identify opponent tendencies and weaknesses in real-time.',
    difficulty: 'advanced',
    planRequired: 'pro',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Scouting Opponent Breakouts',    durationMin: 12 },
          { type: 'clip_analysis',title: 'Identifying Breakout Tendencies',durationMin: 10 },
          { type: 'quiz',         title: 'Scouting Breakouts Quiz',        durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Reading Forecheck Pressure',     durationMin: 12 },
          { type: 'animation',    title: 'Counter to 2-1-2 Forecheck',     contentId: 'reverse_breakout', durationMin: 6 },
          { type: 'quiz',         title: 'Reading Forecheck Quiz',         durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Live Game Pattern Recognition',  durationMin: 12 },
          { type: 'clip_analysis',title: 'Pattern Recognition Drill',      durationMin: 10 },
          { type: 'quiz',         title: 'Reading Opponents Mastery Quiz', durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 12,
    phase: 3,
    title: 'Counter Tactics',
    description: 'Learn how to counter common systems and exploit defensive gaps.',
    difficulty: 'advanced',
    planRequired: 'pro',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Countering the Neutral Trap',    durationMin: 12 },
          { type: 'animation',    title: 'Speed Play Against Trap',        contentId: 'wheel', durationMin: 6 },
          { type: 'quiz',         title: 'Counter Trap Quiz',              durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Exploiting PK Gaps',             durationMin: 12 },
          { type: 'animation',    title: 'PP 1-3-1 Against Diamond PK',    contentId: 'pp_131', durationMin: 6 },
          { type: 'quiz',         title: 'PP vs PK Counter Quiz',          durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Counter Forecheck Systems',      durationMin: 12 },
          { type: 'animation',    title: 'Quick Release Breakout',         contentId: 'basic_breakout', durationMin: 5 },
          { type: 'quiz',         title: 'Counter Tactics Mastery Quiz',   durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 13,
    phase: 3,
    title: 'Special Situations',
    description: 'Handle delayed penalties, pulled goalies, 3-on-3 overtime, and empty net situations.',
    difficulty: 'advanced',
    planRequired: 'pro',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Delayed Penalty Advantages',     durationMin: 10 },
          { type: 'clip_analysis',title: 'Delayed Penalty Pull-Goalie Clip',durationMin: 8 },
          { type: 'quiz',         title: 'Delayed Penalty Quiz',           durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: '3-on-3 OT & Shootout Strategy', durationMin: 10 },
          { type: 'animation',    title: '3v3 OT Open Ice System',         contentId: 'regroup', durationMin: 5 },
          { type: 'quiz',         title: '3v3 & Shootout Quiz',            durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Pulled Goalie Strategies',       durationMin: 10 },
          { type: 'animation',    title: 'Empty Net Offense Animation',    contentId: 'pp_umbrella', durationMin: 5 },
          { type: 'quiz',         title: 'Special Situations Mastery Quiz',durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 14,
    phase: 3,
    title: 'Advanced Film Analysis',
    description: 'Apply film analysis skills to break down full game footage and build a tactical game plan.',
    difficulty: 'advanced',
    planRequired: 'pro',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Building a Game Plan from Film', durationMin: 15 },
          { type: 'clip_analysis',title: 'Full Shift Analysis Walkthrough', durationMin: 12 },
          { type: 'quiz',         title: 'Film Analysis Quiz',             durationMin: 5 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Identifying Weakness Patterns',  durationMin: 12 },
          { type: 'clip_analysis',title: 'Weakness Pattern Film Session',  durationMin: 10 },
          { type: 'quiz',         title: 'Weakness ID Quiz',               durationMin: 5 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Adjustments Between Periods',    durationMin: 10 },
          { type: 'clip_analysis',title: 'Real Game Period Adjustment',    durationMin: 10 },
          { type: 'quiz',         title: 'Film Analysis Mastery Quiz',     durationMin: 5 },
        ],
      },
    ],
  },

  {
    weekNumber: 15,
    phase: 3,
    title: 'Final Exam: Game Intelligence',
    description: 'Complete the IceIQ curriculum with a comprehensive test covering all tactical systems, rules, and game intelligence.',
    difficulty: 'advanced',
    planRequired: 'pro',
    requiredScore: 80,
    days: [
      {
        dayNumber: 1,
        lessons: [
          { type: 'theory',       title: 'Full Curriculum Review Part 1',  durationMin: 20 },
          { type: 'animation',    title: 'Breakout Systems Review',        contentId: 'basic_breakout', durationMin: 8 },
          { type: 'quiz',         title: 'Phase 1 Recap Quiz',             durationMin: 10 },
        ],
      },
      {
        dayNumber: 2,
        lessons: [
          { type: 'theory',       title: 'Full Curriculum Review Part 2',  durationMin: 20 },
          { type: 'animation',    title: 'Tactical Systems Review',        contentId: 'forecheck_212', durationMin: 8 },
          { type: 'quiz',         title: 'Phase 2 Recap Quiz',             durationMin: 10 },
        ],
      },
      {
        dayNumber: 3,
        lessons: [
          { type: 'theory',       title: 'Game Intelligence Final Review', durationMin: 20 },
          { type: 'clip_analysis',title: 'Complete Game Analysis',         durationMin: 15 },
          { type: 'quiz',         title: '🏆 IceIQ Final Exam (50 Qs)',    durationMin: 30 },
        ],
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const PHASES: {
  phase: 1 | 2 | 3;
  title: string;
  weekRange: [number, number];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
}[] = [
  {
    phase: 1,
    title: 'Hockey Basics',
    weekRange: [1, 5],
    difficulty: 'beginner',
    description: 'Rules, positions, formations, gap control, and reading video.',
  },
  {
    phase: 2,
    title: 'Tactical Systems',
    weekRange: [6, 10],
    difficulty: 'intermediate',
    description: 'Breakout systems, forechecking, OZ tactics, PP/PK, neutral zone.',
  },
  {
    phase: 3,
    title: 'Game Intelligence',
    weekRange: [11, 15],
    difficulty: 'advanced',
    description: 'Reading opponents, counter tactics, special situations, film analysis.',
  },
];

export type PlanTier = 'free' | 'starter' | 'pro';

/**
 * Returns per-week states (locked, completion %) for the curriculum.
 * @param scores  Map of weekNumber → score (0-100)
 * @param plan    User's subscription tier
 */
export function getWeek15States(
  scores: Record<number, number>,
  plan: PlanTier
): { week: CurriculumWeek; locked: boolean; completionPct: number }[] {
  const planOrder: PlanTier[] = ['free', 'starter', 'pro'];
  return CURRICULUM_15.map(week => {
    const planLocked = planOrder.indexOf(plan) < planOrder.indexOf(week.planRequired);
    const prevScore = week.weekNumber > 1 ? (scores[week.weekNumber - 1] ?? 0) : 100;
    const scoreLocked = prevScore < week.requiredScore && week.weekNumber > 1;
    const locked = planLocked || scoreLocked;
    const completionPct = scores[week.weekNumber] ?? 0;
    return { week, locked, completionPct };
  });
}

export function overallProgress15(scores: Record<number, number>): number {
  const total = CURRICULUM_15.length;
  const done = CURRICULUM_15.filter(w => (scores[w.weekNumber] ?? 0) >= 80).length;
  return Math.round((done / total) * 100);
}

export function currentWeek15(scores: Record<number, number>): number {
  for (const w of CURRICULUM_15) {
    if ((scores[w.weekNumber] ?? 0) < 80) return w.weekNumber;
  }
  return 15;
}
