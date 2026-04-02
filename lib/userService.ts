import {
  doc, setDoc, getDoc, getDocs,
  collection, updateDoc, serverTimestamp,
  query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type Plan = 'free' | 'starter' | 'pro' | 'team';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  plan: Plan;
  status: UserStatus;
  approvedBy?: string;
  approvedAt?: Timestamp;
  expiresAt?: Timestamp;       // 플랜 만료일
  createdAt?: Timestamp;
  note?: string;               // 관리자 메모
}

// 회원가입 시 사용자 등록
export const registerUser = async (uid: string, email: string, displayName: string) => {
  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      uid, email, displayName,
      plan: 'free',
      status: 'pending',
      createdAt: serverTimestamp(),
    } as any);
  }
};

// 사용자 정보 조회
export const getUser = async (uid: string): Promise<AppUser | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } as AppUser : null;
};

// 전체 사용자 목록 (관리자용)
export const getAllUsers = async (): Promise<AppUser[]> => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }) as AppUser);
};

// 사용자 승인 + 플랜 + 만료일 설정 (관리자용)
export const approveUser = async (
  uid: string,
  plan: Plan,
  expiresDays: number,   // 0 = 무제한
  adminEmail: string,
  note?: string,
) => {
  const expiresAt = expiresDays > 0
    ? Timestamp.fromDate(new Date(Date.now() + expiresDays * 86400000))
    : null;

  await updateDoc(doc(db, 'users', uid), {
    plan,
    status: 'approved',
    approvedBy: adminEmail,
    approvedAt: serverTimestamp(),
    ...(expiresAt ? { expiresAt } : {}),
    ...(note ? { note } : {}),
  });
};

// 거절
export const rejectUser = async (uid: string, note?: string) => {
  await updateDoc(doc(db, 'users', uid), {
    status: 'rejected',
    plan: 'free',
    ...(note ? { note } : {}),
  });
};

// 플랜 만료 확인
export const isPlanExpired = (user: AppUser): boolean => {
  if (!user.expiresAt) return false;
  return user.expiresAt.toDate() < new Date();
};
