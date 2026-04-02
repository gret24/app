import { apiPost } from './client';
import * as WebBrowser from 'expo-web-browser';

export type Plan = 'free' | 'starter' | 'pro' | 'team';

export interface CheckoutResult {
  checkout_url: string;
  session_id: string;
}

export interface PortalResult {
  portal_url: string;
}

export interface CancelResult {
  cancelled: boolean;
  ends_at: string;
}

// 결제 체크아웃 세션 생성
export const createCheckout = async (
  uid: string,
  plan: Plan,
  email?: string,
): Promise<CheckoutResult> => {
  return apiPost('/payment/create-checkout', { uid, plan, email: email ?? '' });
};

// Stripe Checkout 페이지 열기 (인앱 브라우저)
export const openCheckout = async (
  uid: string,
  plan: Plan,
  email?: string,
): Promise<{ success: boolean; cancelled: boolean }> => {
  const { checkout_url } = await createCheckout(uid, plan, email);

  const result = await WebBrowser.openAuthSessionAsync(
    checkout_url,
    'iceiq://payment/success',   // 딥링크 (앱으로 돌아올 URL)
  );

  if (result.type === 'success') {
    return { success: true, cancelled: false };
  } else if (result.type === 'cancel' || result.type === 'dismiss') {
    return { success: false, cancelled: true };
  }
  return { success: false, cancelled: false };
};

// Customer Portal (구독 관리) 열기
export const openCustomerPortal = async (
  uid: string,
  customerId?: string,
): Promise<void> => {
  const { portal_url } = await apiPost<PortalResult>('/payment/portal', {
    uid,
    customer_id: customerId ?? '',
    return_url: 'iceiq://profile',
  });
  await WebBrowser.openBrowserAsync(portal_url);
};

// 구독 취소
export const cancelSubscription = async (
  uid: string,
  subscriptionId: string,
): Promise<CancelResult> => {
  return apiPost('/payment/cancel', { uid, subscription_id: subscriptionId });
};
