import {
  doc, setDoc, getDoc, updateDoc,
  onSnapshot, serverTimestamp, Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type Plan = 'free' | 'starter' | 'pro' | 'team';
export type UserRole = 'player' | 'coach' | 'team';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  teamName?: string;
  role?: UserRole;         // player / coach / team
  jerseyNumber?: number;
  teamId?: string;
  plan: Plan;
  planStartDate?: Timestamp;
  planEndDate?: Timestamp | null;
  gamesUsedThisMonth: number;
  gamesResetDate?: Timestamp;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
  // 관리자 관련
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedBy?: string;
  note?: string;
}

// 플랜별 월 경기 제한
export const GAME_LIMITS: Record<Plan, number> = {
  free:    2,
  starter: 8,
  pro:     Infinity,
  team:    Infinity,
};

// 기능별 접근 규칙
export const FEATURE_PLANS: Record<string, Plan[]> = {
  zone_analysis:         ['starter', 'pro', 'team'],
  speed_tracking:        ['pro', 'team'],
  ai_report:             ['pro', 'team'],
  ai_lesson_recommend:   ['pro', 'team'],
  video_drawing:         ['starter', 'pro', 'team'],
  scouting:              ['team'],
  team_dashboard:        ['team'],
  bulk_export:           ['team'],
  unlimited_games:       ['pro', 'team'],
  unlimited_players:     ['pro', 'team'],
};

// 현재 달 1일 Timestamp
const getMonthStart = () => {
  const d = new Date();
  d.setDate(1); d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
};

// 사용자 프로필 생성 (회원가입 시)
export const createUserProfile = async (
  uid: string, email: string, displayName: string, teamName?: string, role?: UserRole
) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName, email,
      ...(teamName ? { teamName } : {}),
      ...(role ? { role } : {}),
      plan: 'free',
      planStartDate: serverTimestamp(),
      planEndDate: null,
      gamesUsedThisMonth: 0,
      gamesResetDate: getMonthStart(),
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      status: 'pending',
    });
  } else {
    // 로그인할 때마다 lastLoginAt 업데이트
    await updateDoc(ref, { lastLoginAt: serverTimestamp() });
  }
};

// 프로필 조회
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
};

// 플랜 변경 (관리자 또는 결제 완료 시)
export const updateUserPlan = async (uid: string, plan: Plan, expireDays?: number) => {
  const update: any = {
    plan,
    planStartDate: serverTimestamp(),
    planEndDate: expireDays
      ? Timestamp.fromDate(new Date(Date.now() + expireDays * 86400000))
      : null,
  };
  await updateDoc(doc(db, 'users', uid), update);
};

// 분석 횟수 증가 + 월 리셋 체크
export const incrementGamesUsed = async (uid: string): Promise<void> => {
  const profile = await getUserProfile(uid);
  if (!profile) return;

  // 월 리셋 체크
  const resetDate = profile.gamesResetDate?.toDate() ?? new Date(0);
  const now = new Date();
  const nextMonth = new Date(resetDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  if (now >= nextMonth) {
    // 새 달 → 리셋
    await updateDoc(doc(db, 'users', uid), {
      gamesUsedThisMonth: 1,
      gamesResetDate: getMonthStart(),
    });
  } else {
    await updateDoc(doc(db, 'users', uid), {
      gamesUsedThisMonth: increment(1),
    });
  }
};

// 경기 제한 체크
export const checkGameLimit = async (uid: string): Promise<{ allowed: boolean; used: number; limit: number; plan: Plan }> => {
  const profile = await getUserProfile(uid);
  if (!profile) return { allowed: false, used: 0, limit: 0, plan: 'free' };

  const limit = GAME_LIMITS[profile.plan];
  const used = profile.gamesUsedThisMonth ?? 0;

  // 월 리셋 체크
  const resetDate = profile.gamesResetDate?.toDate() ?? new Date(0);
  const nextMonth = new Date(resetDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const actualUsed = new Date() >= nextMonth ? 0 : used;

  return {
    allowed: actualUsed < limit,
    used: actualUsed,
    limit,
    plan: profile.plan,
  };
};

// 기능 접근 가능 여부
export const canAccessFeature = (plan: Plan, feature: string): boolean => {
  const allowed = FEATURE_PLANS[feature];
  if (!allowed) return true; // 미정의 기능은 허용
  return allowed.includes(plan);
};

// 역할 업데이트
export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { role });
};

// 실시간 프로필 리스너
export const onUserProfileChange = (
  uid: string,
  callback: (profile: UserProfile | null) => void
): (() => void) => {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) {
      callback({ uid, ...snap.data() } as UserProfile);
    } else {
      callback(null);
    }
  });
};
