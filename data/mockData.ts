export type LessonType = 'upload' | 'youtube';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type Category = 'Basics' | 'Skating' | 'Shooting' | 'Tactics' | 'Defense' | 'Goalie' | 'Game IQ';

export interface Lesson {
  id: string;
  type: LessonType;
  title: string;
  category: Category;
  difficulty: Difficulty;
  duration: string;
  description: string;
  isPro: boolean;
  keyTakeaways: string[];
  relatedIds: string[];
  // upload type
  videoUrl?: string;
  // youtube type
  videoId?: string;
  thumbnailUrl?: string;
}

export const MOCK_LESSONS: Lesson[] = [
  // --- Upload type (3) ---
  {
    id: '1',
    type: 'upload',
    title: 'Basic Skating Fundamentals',
    category: 'Skating',
    difficulty: 'Beginner',
    duration: '12:30',
    description:
      'Master the core skating fundamentals every hockey player needs. From proper stance to forward crossovers, this lesson covers the building blocks of efficient ice movement.',
    isPro: false,
    keyTakeaways: [
      'Keep knees bent and weight centered over skate blades',
      'Push through the full length of the blade for maximum power',
      'Use crossovers to maintain speed through turns',
      'Relax your upper body to improve balance',
    ],
    relatedIds: ['2', '4', '7'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: '2',
    type: 'upload',
    title: 'Defensive Zone Coverage',
    category: 'Defense',
    difficulty: 'Intermediate',
    duration: '18:45',
    description:
      'Learn elite defensive zone positioning and gap control techniques used by professional defensemen. Reduce goals against with smart positioning.',
    isPro: true,
    keyTakeaways: [
      'Maintain a tight gap on opposing forwards in your zone',
      'Communicate with your partner on coverage assignments',
      'Angle attackers away from the scoring areas',
      'Box out in front of the net to prevent screens and rebounds',
    ],
    relatedIds: ['5', '6', '8'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: '3',
    type: 'upload',
    title: 'Goalie Positioning Masterclass',
    category: 'Goalie',
    difficulty: 'Advanced',
    duration: '22:10',
    description:
      'Advanced goaltending positioning including butterfly mechanics, post integration, and reading plays before they develop.',
    isPro: true,
    keyTakeaways: [
      'Square your shoulders to the puck at all times',
      'Challenge shooters by cutting down the angle',
      'Use post integration to seal the short side',
      'Track the puck through screens with head movement',
    ],
    relatedIds: ['2', '5'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },

  // --- YouTube type (7) ---
  {
    id: '4',
    type: 'youtube',
    title: 'Wrist Shot Technique Breakdown',
    category: 'Shooting',
    difficulty: 'Beginner',
    duration: '8:45',
    description:
      'Step-by-step breakdown of the wrist shot from puck pickup to follow-through. Learn the mechanics that power the most used shot in hockey.',
    isPro: false,
    keyTakeaways: [
      'Cup the puck near the heel of the blade for maximum control',
      'Roll your wrists through contact for lift and accuracy',
      'Transfer weight from back foot to front foot during the shot',
      'Follow through pointing blade at your target',
    ],
    relatedIds: ['5', '9', '1'],
    videoId: 'LPmGKBaRMhc',
  },
  {
    id: '5',
    type: 'youtube',
    title: 'Backward Skating Drills',
    category: 'Skating',
    difficulty: 'Intermediate',
    duration: '10:20',
    description:
      'Improve your backward skating speed and agility with these progressive drills used by NHL defensemen during training camp.',
    isPro: false,
    keyTakeaways: [
      'Initiate backward strides from the hip, not the foot',
      'C-cuts should be smooth and powerful from heel to toe',
      'Keep your head up and chest facing the play',
      'Practice transitions (forward to backward) at full speed',
    ],
    relatedIds: ['1', '2', '6'],
    videoId: 'r5IJufntqL0',
  },
  {
    id: '6',
    type: 'youtube',
    title: 'Stickhandling Drills for Game Speed',
    category: 'Basics',
    difficulty: 'Beginner',
    duration: '9:15',
    description:
      'Daily stickhandling routine to build soft hands and improve puck control at game speed. Great for all skill levels.',
    isPro: false,
    keyTakeaways: [
      'Keep your top hand loose and lead all movement',
      'Practice with eyes up to simulate game conditions',
      'Work both forehand and backhand equally',
      'Increase speed gradually — technique first, speed second',
    ],
    relatedIds: ['4', '1', '10'],
    videoId: 'ZkMSVoAuHrI',
  },
  {
    id: '7',
    type: 'youtube',
    title: 'Power Skating for Forwards',
    category: 'Skating',
    difficulty: 'Intermediate',
    duration: '14:30',
    description:
      'Explosive edge work, acceleration drills, and stride efficiency techniques specifically designed for forwards looking to gain speed advantage.',
    isPro: true,
    keyTakeaways: [
      'Drive off the inside edge for explosive first steps',
      'Use quick choppy strides for acceleration phase',
      'Extend fully through each stride for top-end speed',
      'Lean your body forward at 30–45° during acceleration',
    ],
    relatedIds: ['1', '5', '9'],
    videoId: '5i3xB5ExEEI',
  },
  {
    id: '8',
    type: 'youtube',
    title: 'Offensive Zone Tactics',
    category: 'Tactics',
    difficulty: 'Intermediate',
    duration: '16:00',
    description:
      'Understanding offensive zone cycling, overloads, and net-front presence to generate high-danger scoring chances consistently.',
    isPro: true,
    keyTakeaways: [
      'Cycle the puck below the goal line to draw defenders',
      'The weak-side winger must crash for rebounds',
      'Overload one side to create open ice on the other',
      'Net-front player must screen and look for tips/redirects',
    ],
    relatedIds: ['4', '9', '10'],
    videoId: 'MzIJVKb_H9s',
  },
  {
    id: '9',
    type: 'youtube',
    title: 'Slap Shot Power & Accuracy',
    category: 'Shooting',
    difficulty: 'Advanced',
    duration: '11:50',
    description:
      'Load the stick, flex the shaft, and unload with power. Advanced slap shot mechanics to add 10–15 mph to your shot.',
    isPro: false,
    keyTakeaways: [
      'Hit the ice 2–3 inches behind the puck to load flex',
      'Transfer weight explosively from back to front leg',
      'Keep your head down through contact — look up after',
      'Aim for the corners, not the middle of the net',
    ],
    relatedIds: ['4', '6', '8'],
    videoId: 'Rq1fKqRxpHw',
  },
  {
    id: '10',
    type: 'youtube',
    title: 'Game IQ: Reading the Ice',
    category: 'Game IQ',
    difficulty: 'Advanced',
    duration: '20:00',
    description:
      'Elite-level hockey sense training: learn to anticipate plays, read defensive structures, and make decisions faster than the play develops.',
    isPro: true,
    keyTakeaways: [
      'Scan the ice every 2–3 seconds to build a mental map',
      'Identify defensive gaps before receiving the puck',
      'Recognize when to shoot vs. pass by reading goalie position',
      'Use deception (fakes, hesitations) to create time and space',
    ],
    relatedIds: ['7', '8', '5'],
    videoId: 'j4y26DOJSAQ',
  },
];

export interface Player {
  id: string;
  number: number;
  name: string;
  team: string;
  position: string;
}

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', number: 9,  name: 'Alex Johnson',  team: 'Ice Hawks',    position: 'C'  },
  { id: 'p2', number: 14, name: 'Marc Dubois',   team: 'Ice Hawks',    position: 'LW' },
  { id: 'p3', number: 27, name: 'Tyler Brooks',  team: 'Ice Hawks',    position: 'RW' },
  { id: 'p4', number: 4,  name: 'Chris Novak',   team: 'Ice Hawks',    position: 'D'  },
  { id: 'p5', number: 44, name: 'Ryan Petrov',   team: 'Ice Hawks',    position: 'D'  },
  { id: 'p6', number: 1,  name: 'Sam Wheeler',   team: 'Ice Hawks',    position: 'G'  },
];

export interface ZoneStat {
  percentage: number;
  touches: number;
  entries: number;
  exits: number;
}

export interface ZoneData {
  ozone: ZoneStat;
  nzone: ZoneStat;
  dzone: ZoneStat;
  transitions: { label: string; count: number }[];
  timeline: { zone: 'O' | 'N' | 'D'; duration: number }[]; // proportional durations
}

export const MOCK_ZONE_DATA: ZoneData = {
  ozone: { percentage: 40, touches: 124, entries: 18, exits: 14 },
  nzone: { percentage: 25, touches: 78,  entries: 22, exits: 21 },
  dzone: { percentage: 35, touches: 109, entries: 15, exits: 19 },
  transitions: [
    { label: 'D → N', count: 19 },
    { label: 'N → O', count: 18 },
    { label: 'O → N', count: 14 },
    { label: 'N → D', count: 21 },
  ],
  timeline: [
    { zone: 'D', duration: 12 },
    { zone: 'N', duration: 8  },
    { zone: 'O', duration: 15 },
    { zone: 'N', duration: 5  },
    { zone: 'D', duration: 10 },
    { zone: 'O', duration: 14 },
    { zone: 'N', duration: 7  },
    { zone: 'O', duration: 9  },
  ],
};

export interface OverviewStat {
  iceTime: string;
  shifts: number;
  avgShiftLength: string;
  goals: number;
  assists: number;
  plusMinus: number;
}

export const MOCK_OVERVIEW: OverviewStat = {
  iceTime: '18:42',
  shifts: 24,
  avgShiftLength: '0:47',
  goals: 1,
  assists: 2,
  plusMinus: 3,
};
