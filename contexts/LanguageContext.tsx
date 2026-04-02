import React, { createContext, useContext, useState } from 'react';

type Lang = 'en' | 'ko';

const translations = {
  en: {
    // 공통
    home: 'Home',
    analysis: 'Analysis',
    videos: 'Videos',
    profile: 'Profile',
    settings: 'Settings',
    back: 'Back',
    // 홈
    welcome: 'Welcome',
    playerMode: 'Player Analysis',
    playerModeDesc: 'Individual player ice time, highlights & shifts',
    teamMode: 'Team Analysis',
    teamModeDesc: 'Full roster stats, line combinations & zone coverage',
    // Player 모드
    selectVideo: 'Select Game',
    selectTeam: 'Select Team',
    selectPlayer: 'Select Player',
    selectOption: 'Video Type',
    allTeams: 'All',
    highlight: 'Highlight Clips',
    highlightDesc: 'Detected shift clips',
    fulltime: 'Fulltime Video',
    fulltimeDesc: 'First to last appearance',
    shifts: 'Ice Time Shifts',
    shiftsDesc: 'Per-shift timestamps',
    playHighlight: '🎬 Play Highlight',
    playFulltime: '🏒 Play Fulltime',
    loadShifts: 'Load Shifts',
    restart: 'Start Over',
    // 스탯
    iceTime: 'Ice Time',
    numShifts: 'Shifts',
    avgShift: 'Avg Shift',
    // 팀 모드
    homeTeam: 'HOME Team',
    awayTeam: 'AWAY Team',
    roster: 'Roster',
    // 인증
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    teamName: 'Team Name (optional)',
    forgotPassword: 'Forgot Password?',
    sendReset: 'Send Reset Email',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    getStarted: 'Get Started',
    // 플랜
    currentPlan: 'Current Plan',
    upgradePlan: 'Upgrade Plan',
    // 설정
    language: 'Language',
    languageEn: 'English',
    languageKo: '한국어',
  },
  ko: {
    // 공통
    home: '홈',
    analysis: '분석',
    videos: '영상',
    profile: '프로필',
    settings: '설정',
    back: '뒤로',
    // 홈
    welcome: '안녕하세요',
    playerMode: '선수 분석',
    playerModeDesc: '개인 아이스타임, 하이라이트 & 시프트',
    teamMode: '팀 분석',
    teamModeDesc: '전체 로스터 스탯, 라인 구성 & 존 분석',
    // Player 모드
    selectVideo: '경기 선택',
    selectTeam: '팀 선택',
    selectPlayer: '선수 선택',
    selectOption: '영상 타입',
    allTeams: '전체',
    highlight: '하이라이트 클립',
    highlightDesc: '감지된 출전 구간 클립',
    fulltime: '풀타임 영상',
    fulltimeDesc: '첫~마지막 등장 전체',
    shifts: '아이스타임 시프트',
    shiftsDesc: '시프트별 타임스탬프',
    playHighlight: '🎬 하이라이트 재생',
    playFulltime: '🏒 풀타임 재생',
    loadShifts: '시프트 불러오기',
    restart: '처음부터',
    // 스탯
    iceTime: '아이스타임',
    numShifts: '시프트',
    avgShift: '평균 시프트',
    // 팀 모드
    homeTeam: '홈팀',
    awayTeam: '어웨이팀',
    roster: '로스터',
    // 인증
    signIn: '로그인',
    signUp: '회원가입',
    signOut: '로그아웃',
    email: '이메일',
    password: '비밀번호',
    name: '이름',
    teamName: '팀 이름 (선택)',
    forgotPassword: '비밀번호 찾기',
    sendReset: '재설정 이메일 발송',
    noAccount: '계정이 없으신가요?',
    haveAccount: '이미 계정이 있으신가요?',
    getStarted: '시작하기',
    // 플랜
    currentPlan: '현재 플랜',
    upgradePlan: '플랜 업그레이드',
    // 설정
    language: '언어',
    languageEn: 'English',
    languageKo: '한국어',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ko');
  const t = (key: TranslationKey) => translations[lang][key] ?? key;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be within LanguageProvider');
  return ctx;
}
