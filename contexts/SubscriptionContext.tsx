import React, { createContext, useContext, useState } from 'react';

export type Plan = 'free' | 'starter' | 'pro' | 'team';

export const PLAN_DETAILS: Record<Plan, { label: string; price: number; features: string[] }> = {
  free: {
    label: 'Free',
    price: 0,
    features: ['3 lessons/month', 'Basic analysis', 'Community access'],
  },
  starter: {
    label: 'Starter',
    price: 29,
    features: ['20 lessons/month', 'Video analysis', 'Drawing tools'],
  },
  pro: {
    label: 'Pro',
    price: 59,
    features: ['Unlimited lessons', 'AI recommendations', 'Zone heatmaps', 'Priority support'],
  },
  team: {
    label: 'Team',
    price: 149,
    features: ['Everything in Pro', 'Up to 20 players', 'Team analytics', 'Custom reports'],
  },
};

interface SubscriptionContextType {
  plan: Plan;
  isPro: boolean;
  isTeam: boolean;
  upgrade: (newPlan: Plan) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>('free');

  const upgrade = async (newPlan: Plan) => {
    // Mock upgrade - replace with real payment flow
    await new Promise(resolve => setTimeout(resolve, 600));
    setPlan(newPlan);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isPro: plan === 'pro' || plan === 'team',
        isTeam: plan === 'team',
        upgrade,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
