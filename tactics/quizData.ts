// ─── Types ────────────────────────────────────────────────────────────────────
export type QuizCategory = 'tactics' | 'rules' | 'positioning' | 'game_sense' | 'scouting';
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface RinkPositions {
  home: { id: string; x: number; y: number }[];
  away: { id: string; x: number; y: number }[];
  puck?: { x: number; y: number };
}

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  subcategory: string;
  difficulty: QuizDifficulty;
  situation: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  relatedTacticId?: string;
  relatedWeek?: number;
  playerPositions?: RinkPositions;
}

// ─── Quiz Questions ────────────────────────────────────────────────────────────
// 20 tactics + 15 rules + 10 positioning + 5 game_sense

export const QUIZ_QUESTIONS: QuizQuestion[] = [

  // ── TACTICS (20 questions) ───────────────────────────────────────────────

  {
    id: 'tac_001',
    category: 'tactics',
    subcategory: 'breakout',
    difficulty: 'beginner',
    situation: 'Your team has just retrieved the puck behind your net. The opposing forecheck has one forward pressuring the puck-carrier (goalie). The other four opponents are in a 1-2-2 forecheck setup.',
    question: 'Which breakout pattern is BEST when the opponent uses a light 1-forward pressure forecheck?',
    options: [
      'Basic breakout — D carries puck up the weak side',
      'Reverse breakout — goalie passes back to D behind the net',
      'Wheel breakout — D skates wide with puck around the net',
      'Chip and chase — forwards chip puck off the glass',
    ],
    correctIndex: 0,
    explanation: 'Against light 1-forward pressure, the basic breakout gives the puck-carrier time to make a clean outlet pass. The D reads the open lane and carries up the weak side while wingers provide passing options.',
    relatedTacticId: 'basic_breakout',
    relatedWeek: 6,
    playerPositions: {
      home: [
        { id: 'G',  x: 8,   y: 42.5 },
        { id: 'D1', x: 20,  y: 30 },
        { id: 'D2', x: 20,  y: 55 },
        { id: 'LW', x: 50,  y: 20 },
        { id: 'C',  x: 50,  y: 42.5 },
        { id: 'RW', x: 50,  y: 65 },
      ],
      away: [
        { id: 'F1', x: 35,  y: 42.5 },
        { id: 'F2', x: 55,  y: 20 },
        { id: 'F3', x: 55,  y: 65 },
        { id: 'D1', x: 75,  y: 30 },
        { id: 'D2', x: 75,  y: 55 },
      ],
      puck: { x: 8, y: 42.5 },
    },
  },

  {
    id: 'tac_002',
    category: 'tactics',
    subcategory: 'breakout',
    difficulty: 'intermediate',
    situation: 'Your team has the puck behind your own net. The opponent has two forwards crashing hard and cutting off both wing lanes.',
    question: 'When both wing lanes are cut off by an aggressive forecheck, which breakout should you use?',
    options: [
      'Basic breakout pushing up the middle',
      'Reverse pass through the goalie, then D carries up the opposite side',
      'Wheel breakout where D skates around net and uses speed to beat pressure',
      'Dump the puck back into the corner and reset',
    ],
    correctIndex: 2,
    explanation: 'The wheel breakout uses the D\'s skating speed to carry the puck around the net and burst up the boards, converting defensive pressure into offensive momentum when wing lanes are clogged.',
    relatedTacticId: 'wheel',
    relatedWeek: 6,
    playerPositions: {
      home: [
        { id: 'G',  x: 8,   y: 42.5 },
        { id: 'D1', x: 12,  y: 30 },
        { id: 'D2', x: 12,  y: 55 },
        { id: 'LW', x: 35,  y: 18 },
        { id: 'C',  x: 35,  y: 42.5 },
        { id: 'RW', x: 35,  y: 67 },
      ],
      away: [
        { id: 'F1', x: 30,  y: 25 },
        { id: 'F2', x: 30,  y: 60 },
        { id: 'F3', x: 45,  y: 42.5 },
        { id: 'D1', x: 65,  y: 30 },
        { id: 'D2', x: 65,  y: 55 },
      ],
      puck: { x: 8, y: 42.5 },
    },
  },

  {
    id: 'tac_003',
    category: 'tactics',
    subcategory: 'forecheck',
    difficulty: 'beginner',
    situation: 'Your team is entering the offensive zone. You want to pressure the opposing defensemen but maintain defensive responsibility.',
    question: 'In the 1-2-2 forecheck, what is the PRIMARY role of the first forward in?',
    options: [
      'Immediately pressure both defensemen simultaneously',
      'Funnel the puck carrier into one corner and force a turnover',
      'Stay near the blue line to prevent breakout passes',
      'Chase the puck aggressively to all areas of the zone',
    ],
    correctIndex: 1,
    explanation: 'The first forward in a 1-2-2 forecheck acts as the "funnel" player — their job is to force the puck carrier into one corner, where the second forward provides support. This controlled pressure prevents the opposing team from making clean exits.',
    relatedTacticId: 'forecheck_122',
    relatedWeek: 7,
    playerPositions: {
      home: [
        { id: 'F1', x: 155, y: 42.5 },
        { id: 'F2', x: 145, y: 25 },
        { id: 'F3', x: 145, y: 60 },
        { id: 'D1', x: 130, y: 30 },
        { id: 'D2', x: 130, y: 55 },
      ],
      away: [
        { id: 'G',  x: 192, y: 42.5 },
        { id: 'D1', x: 180, y: 30 },
        { id: 'D2', x: 180, y: 55 },
        { id: 'F1', x: 165, y: 20 },
        { id: 'F2', x: 165, y: 65 },
      ],
      puck: { x: 182, y: 55 },
    },
  },

  {
    id: 'tac_004',
    category: 'tactics',
    subcategory: 'forecheck',
    difficulty: 'intermediate',
    situation: 'Your team wants to pin the opposing team in their defensive zone using an aggressive two-forward pressure forecheck.',
    question: 'In the 2-1-2 forecheck, what is the KEY difference from the 1-2-2?',
    options: [
      'Two forwards pressure the puck carrier simultaneously from both sides',
      'The center stays high to block breakout passes while wings pressure',
      'All five skaters crash the puck in the corners',
      'The defensemen rush in to support the forecheck',
    ],
    correctIndex: 0,
    explanation: 'The 2-1-2 forecheck sends TWO forwards hard at the puck carrier simultaneously, creating immediate pressure. This forces quick, often poor decisions. The third forward stays mid-zone to intercept outlet passes.',
    relatedTacticId: 'forecheck_212',
    relatedWeek: 7,
    playerPositions: {
      home: [
        { id: 'F1', x: 162, y: 30 },
        { id: 'F2', x: 162, y: 55 },
        { id: 'F3', x: 148, y: 42.5 },
        { id: 'D1', x: 135, y: 28 },
        { id: 'D2', x: 135, y: 57 },
      ],
      away: [
        { id: 'G',  x: 192, y: 42.5 },
        { id: 'D1', x: 178, y: 55 },
        { id: 'D2', x: 175, y: 30 },
        { id: 'F1', x: 160, y: 18 },
        { id: 'F2', x: 160, y: 67 },
      ],
      puck: { x: 178, y: 55 },
    },
  },

  {
    id: 'tac_005',
    category: 'tactics',
    subcategory: 'powerplay',
    difficulty: 'beginner',
    situation: 'Your team has a 5-on-4 power play. The opposing penalty killers are in a box formation.',
    question: 'In the umbrella power play, where should the "point man" (D at the top) position himself?',
    options: [
      'At the top of the faceoff circle, above the hash marks',
      'At the blue line for shot distance',
      'Just inside the blue line, slightly off-center',
      'At center ice to prevent shorthanded rushes',
    ],
    correctIndex: 2,
    explanation: 'The umbrella PP point man positions just inside the blue line, slightly off-center. This shortens the passing lane, maintains good shot angle on goal, and keeps them in the zone. Going to the full blue line creates longer, more intercept-able passes.',
    relatedTacticId: 'pp_umbrella',
    relatedWeek: 9,
    playerPositions: {
      home: [
        { id: 'D',  x: 140, y: 42.5 },
        { id: 'LW', x: 155, y: 20 },
        { id: 'RW', x: 155, y: 65 },
        { id: 'C',  x: 168, y: 42.5 },
        { id: 'F',  x: 175, y: 42.5 },
      ],
      away: [
        { id: 'G',  x: 192, y: 42.5 },
        { id: 'K1', x: 165, y: 30 },
        { id: 'K2', x: 165, y: 55 },
        { id: 'K3', x: 175, y: 25 },
        { id: 'K4', x: 175, y: 60 },
      ],
      puck: { x: 140, y: 42.5 },
    },
  },

  {
    id: 'tac_006',
    category: 'tactics',
    subcategory: 'powerplay',
    difficulty: 'intermediate',
    situation: 'Your 5-on-4 PP is set up in a 1-3-1 formation. The opposing PK is using a diamond shape. You notice the middle of the diamond is collapsing to the slot.',
    question: 'Against a collapsing PK diamond, which 1-3-1 option creates the BEST scoring chance?',
    options: [
      'High shot from the point hoping for a screen',
      'Cross-ice pass to the weak side forward for a one-timer',
      'Chip the puck into the corner and retrieve it',
      'Delay at the blue line and reset the formation',
    ],
    correctIndex: 1,
    explanation: 'When the PK diamond\'s middle collapses to the slot, the weak side of the ice opens up. A quick cross-ice pass to the weak side forward creates a one-timer opportunity from the high slot — the highest danger area on the ice.',
    relatedTacticId: 'pp_131',
    relatedWeek: 9,
    playerPositions: {
      home: [
        { id: 'D',  x: 138, y: 42.5 },
        { id: 'LW', x: 155, y: 22 },
        { id: 'C',  x: 165, y: 42.5 },
        { id: 'RW', x: 155, y: 63 },
        { id: 'F',  x: 178, y: 42.5 },
      ],
      away: [
        { id: 'G',  x: 192, y: 42.5 },
        { id: 'K1', x: 148, y: 42.5 },
        { id: 'K2', x: 165, y: 30 },
        { id: 'K3', x: 165, y: 55 },
        { id: 'K4', x: 178, y: 42.5 },
      ],
      puck: { x: 138, y: 42.5 },
    },
  },

  {
    id: 'tac_007',
    category: 'tactics',
    subcategory: 'penaltykill',
    difficulty: 'beginner',
    situation: 'Your team is killing a 5-on-4 penalty. The opposing PP team has set up the umbrella formation at the top of your zone.',
    question: 'In the PK box formation, how should your four players position themselves?',
    options: [
      'All four crowd the slot in front of the goalie',
      'Two high (near faceoff dots) and two low (below the circles) forming a box',
      'One player chases the puck carrier while three block the net',
      'All four skaters line up across the blue line',
    ],
    correctIndex: 1,
    explanation: 'The PK box positions two players high (near the top of the faceoff circles) and two players low (below the circles, protecting the slot). This square formation forces the PP to the perimeter and blocks high-danger passes through the middle.',
    relatedTacticId: 'pk_box',
    relatedWeek: 9,
    playerPositions: {
      home: [
        { id: 'G',  x: 8,  y: 42.5 },
        { id: 'K1', x: 22, y: 28 },
        { id: 'K2', x: 22, y: 57 },
        { id: 'K3', x: 35, y: 28 },
        { id: 'K4', x: 35, y: 57 },
      ],
      away: [
        { id: 'D',  x: 60, y: 42.5 },
        { id: 'LW', x: 45, y: 20 },
        { id: 'RW', x: 45, y: 65 },
        { id: 'C',  x: 32, y: 42.5 },
        { id: 'F',  x: 18, y: 42.5 },
      ],
      puck: { x: 60, y: 42.5 },
    },
  },

  {
    id: 'tac_008',
    category: 'tactics',
    subcategory: 'penaltykill',
    difficulty: 'intermediate',
    situation: 'Your PK unit is using the diamond formation. The opposing PP moves the puck quickly to the half wall.',
    question: 'In the active PK diamond, when the puck goes to the half wall, the high forward should:',
    options: [
      'Stay at the top of the diamond and not chase the puck',
      'Sprint to the puck carrier on the half wall to create immediate pressure',
      'Drop to the middle to protect the slot area',
      'Signal the goalkeeper to come out of the crease',
    ],
    correctIndex: 1,
    explanation: 'The PK diamond is an aggressive system. When the puck reaches the half wall, the high forward immediately "attacks" the puck carrier. This pressure disrupts the PP\'s timing and can force weak passes or turnovers at the perimeter.',
    relatedTacticId: 'pk_diamond',
    relatedWeek: 9,
    playerPositions: {
      home: [
        { id: 'G',  x: 8,  y: 42.5 },
        { id: 'K1', x: 20, y: 42.5 },
        { id: 'K2', x: 30, y: 28 },
        { id: 'K3', x: 30, y: 57 },
        { id: 'K4', x: 42, y: 42.5 },
      ],
      away: [
        { id: 'D',  x: 62, y: 42.5 },
        { id: 'LW', x: 48, y: 18 },
        { id: 'RW', x: 48, y: 67 },
        { id: 'C',  x: 38, y: 42.5 },
        { id: 'F',  x: 25, y: 42.5 },
      ],
      puck: { x: 48, y: 18 },
    },
  },

  {
    id: 'tac_009',
    category: 'tactics',
    subcategory: 'neutral_zone',
    difficulty: 'intermediate',
    situation: 'Your team is leading by one goal with 5 minutes left. The opposing team is pushing hard. Your bench coach wants to protect the lead.',
    question: 'Which neutral zone system is BEST for protecting a lead late in the game?',
    options: [
      '2-1-2 aggressive forecheck to pin them in their zone',
      'Neutral zone trap — clog the center lane and wait for mistakes',
      'Wide-open offensive attack to score more insurance goals',
      '1-4 defensive box with everyone back',
    ],
    correctIndex: 1,
    explanation: 'The neutral zone trap is the ideal "protect the lead" system. It clogs center ice, forces the opponent to the perimeter, limits odd-man rushes, and conserves energy. While criticized as "boring," it is highly effective for closing out games.',
    relatedTacticId: 'neutral_trap',
    relatedWeek: 10,
    playerPositions: {
      home: [
        { id: 'F1', x: 90,  y: 25 },
        { id: 'F2', x: 90,  y: 42.5 },
        { id: 'F3', x: 90,  y: 60 },
        { id: 'D1', x: 78,  y: 32 },
        { id: 'D2', x: 78,  y: 53 },
      ],
      away: [
        { id: 'F1', x: 112, y: 25 },
        { id: 'F2', x: 112, y: 42.5 },
        { id: 'F3', x: 112, y: 60 },
        { id: 'D1', x: 125, y: 35 },
        { id: 'D2', x: 125, y: 50 },
      ],
      puck: { x: 112, y: 42.5 },
    },
  },

  {
    id: 'tac_010',
    category: 'tactics',
    subcategory: 'neutral_zone',
    difficulty: 'intermediate',
    situation: 'Your team has the puck in the neutral zone. After losing possession, you need to quickly regroup and attempt another offensive zone entry.',
    question: 'In a regroup, what is the CENTER\'s primary responsibility?',
    options: [
      'Lead the rush and be the first player into the offensive zone',
      'Drop back to receive a pass from the defensemen and redistribute to forwards',
      'Stay at the opponent\'s blue line waiting for a breakaway pass',
      'Skate hard to the boards and call for a board pass',
    ],
    correctIndex: 1,
    explanation: 'In a regroup, the center "drops" to the neutral zone to receive a reset pass from the defensemen. This creates a "pivot point" to redistribute the puck to the faster skating forwards who are adjusting their lanes for a new offensive zone entry.',
    relatedTacticId: 'regroup',
    relatedWeek: 10,
  },

  {
    id: 'tac_011',
    category: 'tactics',
    subcategory: 'breakout',
    difficulty: 'advanced',
    situation: 'Your D-pair has the puck behind your own net. The forecheck has two forwards crashing hard AND the opposing team\'s third forward is cutting off the center lane.',
    question: 'When two forwards crash AND the center lane is cut off, which breakout is most effective?',
    options: [
      'Basic breakout — trust the wingers to find open ice',
      'Reverse through the goalie to the opposite D, then wheel up that side',
      'Hard rim around the boards hoping a forward beats the defender',
      'Skate directly out with the puck and force through the pressure',
    ],
    correctIndex: 1,
    explanation: 'When multiple lanes are cut off, combining the reverse pass with the wheel creates deception. The goalie\'s reverse pass draws the forecheck to the original side, then the D wheels around the net on the opposite side using the momentum reversal to create a clean lane.',
    relatedTacticId: 'reverse_breakout',
    relatedWeek: 11,
  },

  {
    id: 'tac_012',
    category: 'tactics',
    subcategory: 'system',
    difficulty: 'advanced',
    situation: 'You\'re watching the opposing team\'s breakout. You notice they always use the wheel on the right side and the right wing consistently goes to the center lane.',
    question: 'Having scouted this tendency, how should your forecheck adapt?',
    options: [
      'Send all three forwards left to overload the right side',
      'Set your left defenseman higher to anticipate the center lane pass',
      'Use passive forecheck and wait for them to enter your zone',
      'Press the left side heavily to eliminate the wheel lane',
    ],
    correctIndex: 3,
    explanation: 'Scouting reveals they favor the right-side wheel. Pressing the right side heavily (with your left wing) forces them away from their preferred play. If you also shade your D higher on the right, you eliminate both the wheel AND the center lane option simultaneously.',
    relatedTacticId: 'wheel',
    relatedWeek: 11,
  },

  {
    id: 'tac_013',
    category: 'tactics',
    subcategory: 'forecheck',
    difficulty: 'advanced',
    situation: 'Your team is in a 2-1-2 forecheck and has created a turnover at the half wall. The puck is loose in the corner with two of your forwards converging.',
    question: 'After winning the puck in the corner from a 2-1-2 forecheck turnover, the best immediate option is:',
    options: [
      'Immediately shoot from the corner angle',
      'Quick pass to the third forward positioned at the slot for a shot',
      'Carry the puck behind the net and reset to a controlled PP-style cycle',
      'Pass back to the point D for a shot through traffic',
    ],
    correctIndex: 1,
    explanation: 'When a forecheck creates a turnover in the corner, the opposing defensemen are often caught flat-footed or out of position. A quick pass to the third forward (the "trailer" in the 2-1-2) who is positioned at the slot exploits this gap for an immediate high-danger chance.',
    relatedTacticId: 'forecheck_212',
    relatedWeek: 12,
  },

  {
    id: 'tac_014',
    category: 'tactics',
    subcategory: 'system',
    difficulty: 'advanced',
    situation: 'Your team faces an opponent who uses the neutral zone trap effectively. Every time you enter their zone, they collapse and force you back to the neutral zone.',
    question: 'The best counter to a well-executed neutral zone trap is:',
    options: [
      'Dump the puck in every time and chase it',
      'Speed through the center lane before the trap can set up',
      'Use quick stretch passes behind the defensive line to create odd-man breaks',
      'Cycle the puck along the boards until the trap opens up',
    ],
    correctIndex: 2,
    explanation: 'The trap\'s weakness is that it compresses inward — defensemen move up to pinch. A quick stretch (long) pass over or behind the defensive line catches the defense turned around, creating a 2-on-1 or breakaway before the trap can reset.',
    relatedTacticId: 'neutral_trap',
    relatedWeek: 12,
  },

  {
    id: 'tac_015',
    category: 'tactics',
    subcategory: 'powerplay',
    difficulty: 'advanced',
    situation: 'Your PP is in the umbrella setup. The opposing PK team has one player cheating high to intercept your outlet pass. Your PP quarterback (D at top) has the puck.',
    question: 'When a PK player cheats high to intercept your outlet pass, how should the PP quarterback adjust?',
    options: [
      'Continue with the original play and hope for the best',
      'Skate toward the cheating player to draw them out, then pass quickly to the vacated area',
      'Take the shot from distance immediately',
      'Call timeout to reset the formation',
    ],
    correctIndex: 1,
    explanation: 'When a PK player cheats high, the QB should skate toward them (not away). This forces the PK player to commit — either they step up and leave a gap behind them, or they retreat and the QB has gained space. Either way, the QB can then exploit the vacated area.',
    relatedTacticId: 'pp_umbrella',
    relatedWeek: 14,
  },

  {
    id: 'tac_016',
    category: 'tactics',
    subcategory: 'system',
    difficulty: 'beginner',
    situation: 'Your team just broke out of your defensive zone using the basic breakout. You\'ve entered the neutral zone and need to carry the play into the offensive zone.',
    question: 'When entering the offensive zone on a controlled rush, which is the SAFEST entry method?',
    options: [
      'Dump the puck in all the time regardless of the situation',
      'The puck carrier drives wide while a trailer follows for support',
      'All five players rush the zone simultaneously for maximum pressure',
      'Stop at the blue line and wait for the defense to back off',
    ],
    correctIndex: 1,
    explanation: 'A controlled zone entry with the puck carrier driving wide creates a "drive and draw" — the defenseman must decide whether to take the carrier OR protect the middle. A trailer cutting to the middle exploits whichever option the D chooses, and keeps safe defensive coverage behind if possession is lost.',
    relatedWeek: 6,
  },

  {
    id: 'tac_017',
    category: 'tactics',
    subcategory: 'defensive',
    difficulty: 'intermediate',
    situation: 'The opposing team has a 2-on-1 rush against your lone defenseman. The puck carrier is on the right side, and the trailer is in the center.',
    question: 'In a 2-on-1 situation, what is the CORRECT defensive posture for the lone defenseman?',
    options: [
      'Commit to the puck carrier and hope the goalie stops the pass',
      'Ignore the puck carrier and take away the cross-ice pass',
      'Back up in the middle, pointing stick toward the puck to force a bad angle shot',
      'Challenge both players by skating toward the puck carrier',
    ],
    correctIndex: 2,
    explanation: 'On a 2-on-1, the D backs up straight in the middle of the lane, forcing the puck carrier toward the wall for a bad angle, while pointing the stick toward the middle to discourage the cross-ice pass. The goalie takes the shot while the D takes away the pass lane.',
    relatedWeek: 4,
  },

  {
    id: 'tac_018',
    category: 'tactics',
    subcategory: 'offensive',
    difficulty: 'intermediate',
    situation: 'Your team has the puck behind the opponent\'s net. Your center is in front, one wing is at the far post, and one wing is at the half wall. Both defensemen are at the blue line.',
    question: 'In this below-the-goal-line cycle situation, when does the cycle player STOP cycling and make a play?',
    options: [
      'After exactly 5 seconds behind the net',
      'When a defensive player commits to them and a teammate becomes open',
      'Only when the goalie moves out of their crease',
      'When both opposing defensemen pinch down from the blue line',
    ],
    correctIndex: 1,
    explanation: 'The purpose of cycling is to "create movement" — when the cycle draws a defender, it opens up a teammate. The moment a defender commits to the puck carrier, a pass opportunity opens. Continuing to cycle past this moment wastes the advantage.',
    relatedWeek: 8,
  },

  {
    id: 'tac_019',
    category: 'tactics',
    subcategory: 'system',
    difficulty: 'advanced',
    situation: 'You\'re coaching your team. Film study shows the opponent\'s left wing always cheats to the center lane on breakouts, leaving the left side boards open.',
    question: 'To exploit the opponent\'s left wing cheating to center on their breakouts, you should instruct your:',
    options: [
      'Right wing to immediately pressure the left boards when opponent has the puck in their zone',
      'Center to clog the center lane and prevent the left wing from getting the puck',
      'Left defenseman to pinch aggressively along the boards when opponent breaks out',
      'All three forwards to converge on the puck carrier immediately',
    ],
    correctIndex: 0,
    explanation: 'If the opponent\'s left wing always cheats to center, the left boards are consistently open. Your right wing should aggressively forecheck the left side boards. If the D uses that open board area for a breakout pass, your RW intercepts it; if the D avoids it, their breakout options are reduced.',
    relatedWeek: 11,
  },

  {
    id: 'tac_020',
    category: 'tactics',
    subcategory: 'special_teams',
    difficulty: 'advanced',
    situation: 'Your team is on the power play with 45 seconds left. You\'re down by one goal. The opponent is selling out to block shots and clear the zone.',
    question: 'With 45 seconds left on the PP and trailing by one, the BEST strategy is:',
    options: [
      'Blast shots from everywhere hoping for a lucky bounce',
      'Slow the play down, be patient, and wait for a perfect one-timer opportunity',
      'Quick cycle below the goal line to draw defenders and create slot opportunities',
      'Get the puck to the point for a hard slap shot immediately',
    ],
    correctIndex: 2,
    explanation: 'With 45 seconds on the PP, you need quality over quantity. A quick cycle below the goal draws defenders out of the slot, creating opportunities for screens and close-range shots. Rushed perimeter shots with everyone blocking are lower percentage than patient cycling that opens the slot.',
    relatedWeek: 13,
  },

  // ── RULES (15 questions) ─────────────────────────────────────────────────

  {
    id: 'rule_001',
    category: 'rules',
    subcategory: 'offside',
    difficulty: 'beginner',
    situation: 'Player A crosses the opposing team\'s blue line with the puck. Two seconds later, Player B (their teammate) also crosses the blue line.',
    question: 'Is this an offside violation?',
    options: [
      'Yes — both players must cross simultaneously',
      'No — as long as the puck crossed the blue line first, it is onside',
      'Yes — the second player was offside when they crossed',
      'Only offside if the second player touched the puck first',
    ],
    correctIndex: 1,
    explanation: 'Offside is called when a player PRECEDES the puck over the opponent\'s blue line. If the puck crosses the blue line first (or simultaneously), all subsequent players crossing are onside — regardless of how much time passes.',
    relatedWeek: 1,
  },

  {
    id: 'rule_002',
    category: 'rules',
    subcategory: 'icing',
    difficulty: 'beginner',
    situation: 'Your team, on even strength, shoots the puck from your side of the red center line all the way to the back boards in the opponent\'s zone. No opponent touches the puck.',
    question: 'Is this icing?',
    options: [
      'Yes — icing is called and your team cannot make a line change',
      'No — icing only applies to short-handed teams',
      'Yes — but your team can make a line change',
      'No — the puck must go all the way to the goal line for icing',
    ],
    correctIndex: 0,
    explanation: 'Under modern NHL rules (tag-up icing), if the puck is shot from the shooter\'s side of center ice and crosses the opponent\'s goal line without being touched, icing is called. The team that iced the puck CANNOT make a line change — this is a key strategic penalty.',
    relatedWeek: 1,
  },

  {
    id: 'rule_003',
    category: 'rules',
    subcategory: 'penalties',
    difficulty: 'beginner',
    situation: 'Player A hooks Player B\'s stick to prevent them from getting a breakaway. Player B still gets a clear shot on goal.',
    question: 'What is the correct call when a player is hooked on a clear breakaway attempt?',
    options: [
      'Two-minute minor penalty for hooking',
      'Penalty shot awarded to the offended player',
      'Five-minute major for interference',
      'No call — the player still got the shot',
    ],
    correctIndex: 1,
    explanation: 'Under the "penalty shot" rule, if a player with a clear, unimpeded path to goal is fouled from behind or hooked/held, the referee has the option to award a penalty shot. The fouled player attempts the shot 1-on-1 against the goalie.',
    relatedWeek: 1,
  },

  {
    id: 'rule_004',
    category: 'rules',
    subcategory: 'offside',
    difficulty: 'intermediate',
    situation: 'A player touches the puck outside the blue line after their teammate carries it in. The linesmen waved off the play without stopping it.',
    question: 'Why did the linesmen wave off the play instead of stopping it for offside?',
    options: [
      'Referee discretion — they decided it wasn\'t worth stopping',
      'The player legally "tagged up" (returned to the neutral zone) before touching the puck',
      'Offside only applies to the first player into the zone',
      'The two-line pass rule was eliminated so this is now legal',
    ],
    correctIndex: 1,
    explanation: 'Under "tag-up offside" rules, if an offside player returns to the neutral zone (tags up) before touching the puck, they are considered back onside and play continues. Linesmen wave off the play to signal the offside was negated by the tag-up.',
    relatedWeek: 1,
  },

  {
    id: 'rule_005',
    category: 'rules',
    subcategory: 'goaltender',
    difficulty: 'beginner',
    situation: 'The opposing goalie comes out of the crease and plays the puck in the corner. A forward skates up behind them and checks the goalie hard into the boards.',
    question: 'What is the penalty for hitting a goalie who has left the crease?',
    options: [
      'No penalty — goalies who leave the crease can be hit like any player',
      'Minor penalty for interference — goalies cannot be hit even outside the crease',
      'Major penalty for hitting a goalie',
      'Only a warning on the first occurrence',
    ],
    correctIndex: 1,
    explanation: 'Even outside the crease, goalies are protected. Charging or hitting a goalie who is playing the puck in the corner results at minimum in a minor interference penalty. The "goalie interference" rule extends beyond the crease to protect goalies in vulnerable positions.',
    relatedWeek: 1,
  },

  {
    id: 'rule_006',
    category: 'rules',
    subcategory: 'faceoffs',
    difficulty: 'beginner',
    situation: 'Your team wins a defensive zone faceoff. The opposing center jumps the draw early before the referee drops the puck.',
    question: 'What happens when a player jumps a faceoff before the puck is dropped?',
    options: [
      'The player is ejected from the faceoff circle',
      'A two-minute penalty is assessed',
      'A warning is given on the first occurrence; second time = delay of game',
      'The opposing center gets to start in a better position',
    ],
    correctIndex: 0,
    explanation: 'Under NHL faceoff rules, if a player moves early or doesn\'t align properly, that player is removed from the faceoff and replaced by a teammate. This is to prevent "faceoff cheating" — trying to gain position advantage by starting early.',
    relatedWeek: 1,
  },

  {
    id: 'rule_007',
    category: 'rules',
    subcategory: 'video_review',
    difficulty: 'intermediate',
    situation: 'A goal is scored with 2 seconds left in the game. The on-ice officials initially call "no goal." The trailing team\'s coach immediately calls for a coach\'s challenge.',
    question: 'What can a coach challenge using the coach\'s challenge rule?',
    options: [
      'Only whether the puck crossed the goal line',
      'Goalie interference, offside on the play, or puck over the line',
      'Any referee call including penalties',
      'Only plays in the last two minutes of the game',
    ],
    correctIndex: 1,
    explanation: 'A coach\'s challenge can review: (1) goalie interference on a scored goal, (2) whether a player was offside on the rush leading to the goal, or (3) whether the puck fully crossed the goal line. Other referee calls (icing, offsides on non-goal plays, penalties) cannot be challenged.',
    relatedWeek: 1,
  },

  {
    id: 'rule_008',
    category: 'rules',
    subcategory: 'fighting',
    difficulty: 'beginner',
    situation: 'Two players drop their gloves and begin fighting. A third player from one team leaves the bench and joins the fight.',
    question: 'What happens to the player who leaves the bench to join a fight?',
    options: [
      'Only a two-minute minor penalty',
      'A ten-minute misconduct',
      'A game misconduct and the team is assessed a bench minor',
      'No penalty if they stop the fight from escalating',
    ],
    correctIndex: 2,
    explanation: 'Leaving the bench to join an altercation results in a game misconduct for the offending player AND a two-minute bench minor penalty for the team. This severe penalty exists to prevent bench-clearing brawls.',
    relatedWeek: 1,
  },

  {
    id: 'rule_009',
    category: 'rules',
    subcategory: 'zones',
    difficulty: 'beginner',
    situation: 'A player is in their own defensive zone. Their teammate at center ice passes the puck to them.',
    question: 'A pass from center ice to a player in their defensive zone — is this ever a two-line pass violation?',
    options: [
      'Yes, always — passing across the center red line is illegal',
      'No — the two-line pass rule was eliminated from the NHL in 2005',
      'Only if the pass goes directly to the blue line',
      'Only in the last five minutes of the game',
    ],
    correctIndex: 1,
    explanation: 'The NHL eliminated the two-line pass rule in 2005 before the post-lockout season. Long passes from one zone to another are now legal as long as the recipient is onside at the blue line. This change dramatically increased scoring and speed of play.',
    relatedWeek: 1,
  },

  {
    id: 'rule_010',
    category: 'rules',
    subcategory: 'penalties',
    difficulty: 'intermediate',
    situation: 'Your team commits a minor penalty while already a man short (4-on-5). Thirty seconds later, the opposing power play team scores.',
    question: 'After the power play goal in a 3-on-5 situation, which penalty is served?',
    options: [
      'Both penalties end — both players return to the ice',
      'The first penalized player (who has been serving longer) comes out; the newer penalty continues',
      'The player who committed the newer penalty comes out; the older penalty continues',
      'Both players return — goals always eliminate all current penalties',
    ],
    correctIndex: 1,
    explanation: 'When a goal is scored on a 5-on-3 (two-man advantage), only one player is released — the player who has been serving their penalty the LONGEST. The other penalized player remains in the box, returning the game to 4-on-4 or 5-on-4 depending on how many penalties remain.',
    relatedWeek: 1,
  },

  {
    id: 'rule_011',
    category: 'rules',
    subcategory: 'goaltender',
    difficulty: 'intermediate',
    situation: 'The goalie catches the puck and holds it for 8 seconds without being pressured by any opposing player.',
    question: 'What rule violation has the goalie committed?',
    options: [
      'No violation — goalies can hold the puck as long as they want',
      'Delay of game — goalies must release the puck within a few seconds if not being pressured',
      'Icing — holding the puck counts as an icing violation',
      'Goalie interference on themselves',
    ],
    correctIndex: 1,
    explanation: 'Rule 27.1 — Goalies cannot hold the puck longer than three seconds if not being pressured by an opponent. Excessive holding results in a delay of game minor penalty and a faceoff at one of the defensive zone dots. This prevents goalies from using the puck to give their team rest.',
    relatedWeek: 1,
  },

  {
    id: 'rule_012',
    category: 'rules',
    subcategory: 'offside',
    difficulty: 'advanced',
    situation: 'A puck deflects off an official\'s skate into the offensive zone. A player from the offensive team, who was already in the zone, picks up the puck.',
    question: 'Is this offside?',
    options: [
      'Yes — players cannot be in the zone before the puck',
      'No — when the puck deflects off an official, the play is dead and restarted',
      'No — the deflection off an official resets the play and no offside is called',
      'Yes — the player must tag up regardless of how the puck entered the zone',
    ],
    correctIndex: 2,
    explanation: 'Pucks that deflect off officials are still in play. However, per Rule 78.5, if a puck enters the offensive zone off an official and causes an offside, the officials use discretion. In most cases, play continues as the deflection is considered accidental — no offside is called.',
    relatedWeek: 1,
  },

  {
    id: 'rule_013',
    category: 'rules',
    subcategory: 'equipment',
    difficulty: 'beginner',
    situation: 'During a stoppage in play, a referee notices a player\'s stick has a blade curve that exceeds the legal limit of 3/4 inch.',
    question: 'What is the penalty for using an illegal stick?',
    options: [
      'Immediate ejection from the game',
      'Two-minute minor penalty for the player using the illegal stick',
      'A ten-minute misconduct for equipment violation',
      'Five-minute major for dangerous equipment',
    ],
    correctIndex: 1,
    explanation: 'Using an illegal stick (excessive curve, wrong length, etc.) results in a two-minute minor penalty for the player found with the illegal equipment. Players can also challenge an opponent\'s stick — if it\'s found illegal, the challenging team gets a power play; if it\'s found legal, the challenging team takes the minor.',
    relatedWeek: 1,
  },

  {
    id: 'rule_014',
    category: 'rules',
    subcategory: 'icing',
    difficulty: 'intermediate',
    situation: 'A shorthanded team shoots the puck all the way down the ice from their own zone. No one touches it and it crosses the opponent\'s goal line.',
    question: 'Is this icing called on the shorthanded team?',
    options: [
      'Yes — icing rules apply equally to all teams',
      'No — shorthanded teams are exempt from icing calls',
      'Yes — but the shorthanded team can make a line change',
      'Only if the puck goes directly into the goal without hitting the boards',
    ],
    correctIndex: 1,
    explanation: 'Shorthanded (penalty-killing) teams are exempt from icing — they can shoot the puck the length of the ice as often as needed to kill the penalty. This is a major strategic tool for PK units. The team on the power play is NOT exempt from icing.',
    relatedWeek: 1,
  },

  {
    id: 'rule_015',
    category: 'rules',
    subcategory: 'overtime',
    difficulty: 'intermediate',
    situation: 'A regular season NHL game is tied after 60 minutes. The game goes to overtime.',
    question: 'In regular season NHL overtime, what is the correct format?',
    options: [
      '10-minute 4-on-4 overtime, then shootout if still tied',
      '5-minute sudden-death 3-on-3 overtime, then shootout if still tied',
      '20-minute full-period 5-on-5 overtime',
      'Immediate shootout with no overtime period',
    ],
    correctIndex: 1,
    explanation: 'Regular season NHL overtime is 5 minutes of sudden-death 3-on-3 hockey (introduced in 2015-16). If no team scores, a best-of-three shootout determines the winner. Playoff overtime is different — full 5-on-5 twenty-minute sudden-death periods continue until a goal is scored.',
    relatedWeek: 13,
  },

  // ── POSITIONING (10 questions) ────────────────────────────────────────────

  {
    id: 'pos_001',
    category: 'positioning',
    subcategory: 'defensive_zone',
    difficulty: 'beginner',
    situation: 'The opposing team has the puck in the high slot of your defensive zone. Your team is in a man-on-man coverage.',
    question: 'Where should your nearest forward position themselves relative to the opposing center who has the puck in the slot?',
    options: [
      'Between the center and the net, facing away from the puck',
      'Directly behind the center, ready to pursue if they skate away',
      'In front and to the side of the center, pressuring stick-on-stick',
      'At the blue line preventing potential passes back to the point',
    ],
    correctIndex: 2,
    explanation: 'When covering a player in the slot with the puck, the forward should be in front and to the side — close enough to apply stick pressure (stick-on-stick) and blocking body position to deflect or disrupt the shot, while maintaining a position to react to a pass.',
    relatedWeek: 4,
    playerPositions: {
      home: [
        { id: 'G',  x: 8,  y: 42.5 },
        { id: 'D1', x: 20, y: 30 },
        { id: 'D2', x: 20, y: 55 },
        { id: 'F1', x: 30, y: 42.5 },
        { id: 'F2', x: 45, y: 25 },
        { id: 'F3', x: 45, y: 60 },
      ],
      away: [
        { id: 'C',  x: 35, y: 42.5 },
        { id: 'LW', x: 50, y: 22 },
        { id: 'RW', x: 50, y: 63 },
        { id: 'D1', x: 60, y: 32 },
        { id: 'D2', x: 60, y: 53 },
      ],
      puck: { x: 35, y: 42.5 },
    },
  },

  {
    id: 'pos_002',
    category: 'positioning',
    subcategory: 'offensive_zone',
    difficulty: 'intermediate',
    situation: 'Your team is in the offensive zone with the puck on the half wall. Your two defensemen are at the blue line.',
    question: 'What is the CORRECT positioning for the defenseman on the STRONG side (same side as the puck) at the blue line?',
    options: [
      'Stand directly on the blue line, centered',
      'Move inside the blue line a few feet, angled toward the puck',
      'Pinch down toward the corner to add pressure',
      'Retreat to the neutral zone to prevent a breakaway',
    ],
    correctIndex: 1,
    explanation: 'The strong-side defenseman should cheat a few feet inside the blue line, angled toward the puck. This gives them better pass reception, better shot angle (not from the extreme edge), keeps them onside with a margin, and allows quicker pivoting to block an opponent\'s breakout.',
    relatedWeek: 8,
  },

  {
    id: 'pos_003',
    category: 'positioning',
    subcategory: 'neutral_zone',
    difficulty: 'intermediate',
    situation: 'Your team is in the neutral zone defending against a 2-on-2 rush (two opposing forwards against your two defensemen).',
    question: 'In a 2-on-2 neutral zone confrontation, how should the two defensemen position themselves?',
    options: [
      'Both defensemen challenge the puck carriers aggressively at the blue line',
      'Both defensemen back up together in a straight line across the ice',
      'Each defenseman takes the opposing forward in their lane, maintaining tight gap control',
      'One defenseman attacks the puck carrier while the other stays deep in the DZ',
    ],
    correctIndex: 2,
    explanation: 'In a 2-on-2, each defenseman should shadow the opposing forward in their respective lane while backing up and maintaining a tight but controlled gap. They should avoid crossing over or switching assignments — the offensive players will use that confusion to create a shooting lane.',
    relatedWeek: 4,
  },

  {
    id: 'pos_004',
    category: 'positioning',
    subcategory: 'faceoffs',
    difficulty: 'beginner',
    situation: 'Your team has a defensive zone faceoff to the right of your goalie. You win the draw.',
    question: 'After winning a defensive zone faceoff, where should your centerman aim to direct the puck?',
    options: [
      'Straight back to the goalie',
      'Behind the net to either defenseman',
      'Along the boards toward the corner for the winger',
      'High in the air to create time',
    ],
    correctIndex: 1,
    explanation: 'After winning a defensive zone faceoff, the best option is a clean direct pass back to a defenseman behind the net. This gives the D-player clean possession, time to make a decision, and sets up a breakout. The goalie is not typically an ideal faceoff target as they must put the puck back in play.',
    relatedWeek: 1,
  },

  {
    id: 'pos_005',
    category: 'positioning',
    subcategory: 'goaltender',
    difficulty: 'intermediate',
    situation: 'A player is coming down the left wing toward the net on a 1-on-1 with your goalie. They are on the LEFT side of the ice.',
    question: 'To best cut down the shooting angle on a left-wing rush, the goalie should:',
    options: [
      'Stay on the goal line and move across the crease as the player approaches',
      'Challenge by coming out to the top of the crease, positioned toward the puck carrier side',
      'Stay in the center of the goal and butterfly immediately',
      'Skate out past the crease to eliminate the angle completely',
    ],
    correctIndex: 1,
    explanation: 'Challenging by skating out to the top of the crease (or beyond) toward the puck carrier side cuts the shooting angle dramatically. The further the goalie comes out and the more they "overplay" the shooter\'s side, the less net the shooter can see. This is called "angle play."',
    relatedWeek: 2,
  },

  {
    id: 'pos_006',
    category: 'positioning',
    subcategory: 'defensive_zone',
    difficulty: 'advanced',
    situation: 'The opposing team is in your zone in a PP umbrella. Your PK has a box formation. The puck moves from the right point to the left half wall quickly.',
    question: 'When the puck moves to the left half wall in a box PK, which player should rotate to pressure the puck?',
    options: [
      'The left defenseman (bottom left of the box) chases the puck immediately',
      'The high left forward (top left of the box) rotates to the puck while the box collapses',
      'Both top players crash simultaneously',
      'No one moves — maintain the box and don\'t chase',
    ],
    correctIndex: 1,
    explanation: 'In a box PK, the top-left player (high forward) rotates to pressure the half-wall puck carrier. Simultaneously, the bottom-left player slides up to maintain the "high" coverage, and the right side slides across. This rotation maintains the box shape while applying pressure.',
    relatedWeek: 9,
  },

  {
    id: 'pos_007',
    category: 'positioning',
    subcategory: 'offensive_zone',
    difficulty: 'beginner',
    situation: 'Your team is in the offensive zone. The puck is behind the opponent\'s net. You are the centerman.',
    question: 'As the center, where should you position yourself when the puck is behind the opponent\'s net?',
    options: [
      'At the top of the faceoff circle for a possible shot',
      'In front of the net (the "high slot" or "front of the net" area) to create a screen and deflection opportunity',
      'At the hash marks on the strong side boards',
      'At the far faceoff dot for a cross-ice one-timer',
    ],
    correctIndex: 1,
    explanation: 'When the puck is behind the net, the center should establish position in front of the net — the "dirty area." From here they screen the goalie, deflect passes, and can capitalize on loose pucks. Forwards call this "going to the net," and it creates the highest probability scoring positions.',
    relatedWeek: 8,
  },

  {
    id: 'pos_008',
    category: 'positioning',
    subcategory: 'defensive_zone',
    difficulty: 'intermediate',
    situation: 'Your team is defending in a zone defense. The opposing team\'s defenseman is sitting at the blue line with the puck. No opposing player is in the slot.',
    question: 'Should a forward pressure the opposing D at the blue line?',
    options: [
      'Yes — always pressure the puck carrier regardless of position',
      'No — forward should hold position near the hash marks and not fully commit to the point',
      'Yes — but only if they can get there in under 2 seconds',
      'No — the shot from the point is not dangerous, protect the slot instead',
    ],
    correctIndex: 1,
    explanation: 'The forward should "half-pressure" — move toward the D\'s shooting lane to obstruct or influence the shot while stopping at roughly the hash mark. Fully committing to the point leaves a gap in the middle that the opposing team can exploit with a quick pass. The threat of pressure is often enough.',
    relatedWeek: 4,
  },

  {
    id: 'pos_009',
    category: 'positioning',
    subcategory: 'transitions',
    difficulty: 'advanced',
    situation: 'Your team just turned over the puck in the offensive zone. The opposing team has a 3-on-2 breakout advantage. Your two defensemen are the last defenders.',
    question: 'When facing a 3-on-2 rushing toward your zone, what\'s the first defensive priority?',
    options: [
      'Send one D to stop the puck immediately at center ice',
      'Both D back up together while backchecking forwards sprint to assist',
      'One D challenges the middle, other D defends the shooting lane',
      'Both D immediately drop back to just outside the crease',
    ],
    correctIndex: 1,
    explanation: 'On a 3-on-2, both defensemen should back up TOGETHER (maintaining even positioning), clogging the middle lane and forcing the three attackers to the outside. Simultaneously, they rely on backchecking forwards to recover and make it a 5-on-3 or 4-on-3. Staying together prevents lateral passes from exploiting gaps between the D.',
    relatedWeek: 4,
  },

  {
    id: 'pos_010',
    category: 'positioning',
    subcategory: 'board_play',
    difficulty: 'intermediate',
    situation: 'You\'re in the corner battling for the puck along the boards in your offensive zone. A defenseman is directly in front of you with the puck pinned to the board.',
    question: 'In a board battle, which body position technique creates the best leverage?',
    options: [
      'Push directly from behind to move them off the puck',
      'Position yourself perpendicular to the boards with your hip driving into their hip',
      'Use your stick to poke-check the puck away',
      'Skate by them quickly and try to kick the puck free',
    ],
    correctIndex: 1,
    explanation: 'In board battles, hip-to-hip positioning perpendicular to the boards uses your body\'s mass most efficiently. The hip drive into their hip disrupts their balance and puck control without creating a push-from-behind penalty. The perpendicular angle also "walls off" the puck from their stick.',
    relatedWeek: 3,
  },

  // ── GAME SENSE (5 questions) ──────────────────────────────────────────────

  {
    id: 'gs_001',
    category: 'game_sense',
    subcategory: 'situation_awareness',
    difficulty: 'intermediate',
    situation: 'Your team is winning 3-1 with 6 minutes left. The opposing team pulls their goalie and has 6-on-5. You win a faceoff in your own zone.',
    question: 'With a 6-on-5 opponent and a 2-goal lead with 6 minutes left, what is the SAFEST strategy after winning the DZ faceoff?',
    options: [
      'Ice the puck immediately to run down the clock',
      'Carry the puck out of your zone and try to score into the empty net',
      'Pass it to the corner and initiate your breakout under control',
      'Shoot the puck into the empty net from the faceoff position',
    ],
    correctIndex: 1,
    explanation: 'With a 6-on-5 opponent (pulled goalie), after winning a defensive zone faceoff, the BEST play is to carry the puck out controlled and score into the empty net. An empty net goal is the safest way to seal the game — icing gives the opponent time to regroup, and trying to kill time risks a turnover in dangerous areas.',
    relatedWeek: 13,
  },

  {
    id: 'gs_002',
    category: 'game_sense',
    subcategory: 'line_matching',
    difficulty: 'advanced',
    situation: 'You\'re the coach. The opposing team has just put their top line (with their best goal scorer) on the ice for an offensive zone faceoff. You have last change.',
    question: 'Having the last change advantage, what is the BEST use of this coaching privilege?',
    options: [
      'Match your best offensive line against their top line',
      'Put your best defensive shutdown line to neutralize their top scorer',
      'Send out your fourth line to conserve your top players\' energy',
      'Don\'t change — it\'s not worth breaking the current line\'s flow',
    ],
    correctIndex: 1,
    explanation: 'Last change is one of the home team\'s biggest advantages. Against the opponent\'s top line in an OZ faceoff, use it to match your best shutdown/defensive line. Their top scorer is about to have a scoring opportunity — shutting that down is more valuable than preserving offensive flow.',
    relatedWeek: 14,
  },

  {
    id: 'gs_003',
    category: 'game_sense',
    subcategory: 'momentum',
    difficulty: 'intermediate',
    situation: 'The opposing team has scored two quick goals in 90 seconds. Your bench is visibly deflated. You\'re the coach and you call a timeout.',
    question: 'What is the PRIMARY purpose of calling a timeout after giving up two quick goals?',
    options: [
      'To draw up a new power play formation',
      'To stop the opposing team\'s momentum and reset your team\'s energy',
      'To give your goalie a physical rest',
      'To switch to a different forechecking system',
    ],
    correctIndex: 1,
    explanation: 'After two quick goals against, the primary purpose of a timeout is MOMENTUM DISRUPTION. The opposing team is on a roll — every second you allow them to continue gives them confidence. Stopping play forces both teams to reset. Your team gets 30 seconds to breathe, refocus, and hear a confident message from the coaching staff.',
    relatedWeek: 15,
  },

  {
    id: 'gs_004',
    category: 'game_sense',
    subcategory: 'situation_awareness',
    difficulty: 'beginner',
    situation: 'You are a forward and your team has been in the offensive zone for 45 seconds. You notice your defenseman at the blue line is looking tired and has their hands on their knees.',
    question: 'What should you do as a forward who notices your D is exhausted at the blue line?',
    options: [
      'Continue attacking to score before making a change',
      'Signal the bench for a line change and get fresh players on',
      'Have the D leave the ice immediately without waiting for a line change',
      'Ignore it — the D must stay strong until the puck clears',
    ],
    correctIndex: 1,
    explanation: 'An exhausted defenseman at the blue line is a liability — if they lose the puck, they cannot backcheck, creating a dangerous 2-on-0 or 3-on-1. The smart play is to recognize the situation and initiate a controlled line change with an exit pass or puck freeze. Fresh players are always better than exhausted ones.',
    relatedWeek: 2,
  },

  {
    id: 'gs_005',
    category: 'game_sense',
    subcategory: 'penalty_awareness',
    difficulty: 'intermediate',
    situation: 'You have the puck in a 1-on-1 battle near the opponent\'s goal. You notice the referee\'s arm is raised (delayed penalty call). The goalie makes a save and freezes the puck.',
    question: 'On a delayed penalty call with the goalie freezing the puck, what should you do?',
    options: [
      'Leave the ice immediately — you don\'t need to be on for the power play',
      'Stay on the ice — your team can pull the goalie for an extra attacker until the whistle',
      'Argue with the referee about the call',
      'Skate to the bench immediately when the goalie freezes the puck',
    ],
    correctIndex: 1,
    explanation: 'On a delayed penalty, play continues until the penalized team touches the puck. If your goalie freezes it, it\'s a STOPPAGE — not the penalty being taken. On the ensuing faceoff, you\'ll have the power play. However, while the play is "live" on a delayed call, you can substitute your goalie for an extra attacker — this is a key tactical opportunity.',
    relatedWeek: 13,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getQuestions(
  category: QuizCategory | 'all',
  difficulty: QuizDifficulty | 'all',
  count: 5 | 10 | 20
): QuizQuestion[] {
  let filtered = QUIZ_QUESTIONS;
  if (category !== 'all') filtered = filtered.filter(q => q.category === category);
  if (difficulty !== 'all') filtered = filtered.filter(q => q.difficulty === difficulty);
  // Shuffle
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function scoreQuiz(answers: (number | null)[], questions: QuizQuestion[]): number {
  if (questions.length === 0) return 0;
  const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
  return Math.round((correct / questions.length) * 100);
}

export function getIQLevel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Hockey Brain', color: '#FFD700' };
  if (score >= 75) return { label: 'Elite',         color: '#00D4FF' };
  if (score >= 55) return { label: 'Veteran',       color: '#00CC66' };
  return                  { label: 'Rookie',        color: '#FF8C00' };
}
