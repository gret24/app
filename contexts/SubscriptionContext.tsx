import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getUserProfile, updateUserPlan, onUserProfileChange,
  canAccessFeature, checkGameLimit, incrementGamesUsed,
  GAME_LIMITS,
  type Plan, type UserProfile,
} from '../api/userService';

// 관리자 계정 — 항상 Team 플랜
const ADMIN_EMAILS = ['hshan16hhs@gmail.com'];

export type { Plan };

export const PLAN_DETAILS: Record<Plan, { name: string; label: string; price: string; games: number | string; color: string; features: string[] }> = {
  free:    { name: 'Free',    label: 'Free',    price: '$0',   games: 2,         color: '#888888', features: ['기본 분석 2회/월', '아이스타임 측정'] },
  starter: { name: 'Starter', label: 'Starter', price: '$29',  games: 8,         color: '#00CC66', features: ['분석 8회/월', '존 분석', 'Draw 공유'] },
  pro:     { name: 'Pro',     label: 'Pro',     price: '$59',  games: '무제한',  color: '#00D4FF', features: ['무제한 분석', 'AI 리포트', '속도 추적', '영상 레슨'] },
  team:    { name: 'Team',    label: 'Team',    price: '$149', games: '무제한',  color: '#FFD700', features: ['모든 Pro 기능', '팀 대시보드', '스카우팅', '대량 내보내기'] },
};

interface SubscriptionContextType {
  plan: Plan;
  isPro: boolean;
  isTeam: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  canAccess: (feature: string) => boolean;
  checkLimit: () => Promise<{ allowed: boolean; used: number; limit: number }>;
  recordGame: () => Promise<void>;
  upgrade: (newPlan: Plan) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // 관리자 계정은 Team 고정
    if (ADMIN_EMAILS.includes(user.email ?? '')) {
      setProfile({
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? '',
        plan: 'team',
        gamesUsedThisMonth: 0,
        status: 'approved',
      });
      setIsLoading(false);
      return;
    }

    // Firestore 실시간 리스너
    setIsLoading(true);
    const unsubscribe = onUserProfileChange(user.uid, (p) => {
      setProfile(p);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  // 플랜 만료 체크
  const effectivePlan: Plan = (() => {
    if (!profile) return 'free';
    if (profile.planEndDate && profile.planEndDate.toDate() < new Date()) return 'free';
    return profile.plan ?? 'free';
  })();

  const canAccess = (feature: string) => canAccessFeature(effectivePlan, feature);

  const checkLimit = async () => {
    if (!user?.uid) return { allowed: false, used: 0, limit: 0 };
    const result = await checkGameLimit(user.uid);
    return { allowed: result.allowed, used: result.used, limit: result.limit };
  };

  const recordGame = async () => {
    if (!user?.uid) return;
    await incrementGamesUsed(user.uid);
  };

  const upgrade = async (newPlan: Plan) => {
    if (!user?.uid) return;
    await updateUserPlan(user.uid, newPlan);
    // onSnapshot이 자동으로 업데이트됨
  };

  return (
    <SubscriptionContext.Provider value={{
      plan: effectivePlan,
      isPro: effectivePlan === 'pro' || effectivePlan === 'team',
      isTeam: effectivePlan === 'team',
      isLoading,
      profile,
      canAccess,
      checkLimit,
      recordGame,
      upgrade,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be within SubscriptionProvider');
  return ctx;
}
