import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteField,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface TeamCoach {
  uid: string;
  name: string;
  role: 'owner' | 'coach' | 'assistant';
  status: 'active' | 'invited';
  permissions: {
    canAnalyze: boolean;
    canDraw: boolean;
    canInvite: boolean;
  };
}

export interface TeamDoc {
  id?: string;
  teamName: string;
  ownerId: string;
  inviteCode: string;
  coaches: TeamCoach[];
  createdAt?: Timestamp;
}

export interface TeamFeedItem {
  id?: string;
  type: 'analysis' | 'drawing' | 'note';
  authorUid: string;
  authorName: string;
  content: string;
  createdAt?: Timestamp;
}

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Create a new team
export const createTeam = async (uid: string, teamName: string, ownerName: string): Promise<string> => {
  const inviteCode = generateInviteCode();
  const ref = await addDoc(collection(db, 'teams'), {
    teamName,
    ownerId: uid,
    inviteCode,
    coaches: [
      {
        uid,
        name: ownerName,
        role: 'owner',
        status: 'active',
        permissions: { canAnalyze: true, canDraw: true, canInvite: true },
      },
    ],
    createdAt: serverTimestamp(),
  });
  // Save teamId to user profile
  await updateDoc(doc(db, 'users', uid), { teamId: ref.id });
  return ref.id;
};

// Join team with invite code
export const joinTeamWithCode = async (uid: string, code: string, name: string): Promise<string> => {
  const q = query(collection(db, 'teams'), where('inviteCode', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid invite code');

  const teamDoc = snap.docs[0];
  const teamData = teamDoc.data() as TeamDoc;

  // Check if already a member
  if (teamData.coaches.some(c => c.uid === uid)) {
    throw new Error('Already a member of this team');
  }

  const newCoach: TeamCoach = {
    uid,
    name,
    role: 'coach',
    status: 'active',
    permissions: { canAnalyze: true, canDraw: true, canInvite: false },
  };

  await updateDoc(teamDoc.ref, {
    coaches: [...teamData.coaches, newCoach],
  });

  await updateDoc(doc(db, 'users', uid), { teamId: teamDoc.id });
  return teamDoc.id;
};

// Get team document
export const getTeam = async (teamId: string): Promise<TeamDoc | null> => {
  const snap = await getDoc(doc(db, 'teams', teamId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TeamDoc;
};

// Get all coaches/members of a team
export const getTeamMembers = async (teamId: string): Promise<TeamCoach[]> => {
  const team = await getTeam(teamId);
  return team?.coaches ?? [];
};

// Remove a coach from the team (only owner can do this)
export const removeCoach = async (teamId: string, coachUid: string, requestingUid: string): Promise<void> => {
  const team = await getTeam(teamId);
  if (!team) throw new Error('Team not found');
  if (team.ownerId !== requestingUid) throw new Error('Only the team owner can remove members');
  if (coachUid === requestingUid) throw new Error('Cannot remove yourself');

  const updated = team.coaches.filter(c => c.uid !== coachUid);
  await updateDoc(doc(db, 'teams', teamId), { coaches: updated });
  // Remove teamId from removed coach's profile
  try {
    await updateDoc(doc(db, 'users', coachUid), { teamId: deleteField() });
  } catch (_) {}
};

// Get team feed
export const getTeamFeed = async (teamId: string): Promise<TeamFeedItem[]> => {
  const q = query(
    collection(db, 'teams', teamId, 'feed'),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamFeedItem));
};

// Post to team feed
export const addToTeamFeed = async (
  teamId: string,
  item: Omit<TeamFeedItem, 'id' | 'createdAt'>,
): Promise<void> => {
  await addDoc(collection(db, 'teams', teamId, 'feed'), {
    ...item,
    createdAt: serverTimestamp(),
  });
};

// Update a coach's permissions
export const updateCoachPermissions = async (
  teamId: string,
  coachUid: string,
  permissions: TeamCoach['permissions'],
): Promise<void> => {
  const team = await getTeam(teamId);
  if (!team) throw new Error('Team not found');

  const updated = team.coaches.map(c =>
    c.uid === coachUid ? { ...c, permissions } : c,
  );
  await updateDoc(doc(db, 'teams', teamId), { coaches: updated });
};
