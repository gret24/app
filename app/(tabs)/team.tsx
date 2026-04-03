import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../api/userService';
import {
  getTeam, createTeam, joinTeamWithCode, removeCoach,
  getTeamFeed, type TeamDoc, type TeamFeedItem,
} from '../../lib/teamService';

export default function TeamScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamDoc | null>(null);
  const [feed, setFeed] = useState<TeamFeedItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeam();
  }, [user?.uid]);

  const loadTeam = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      if (profile?.teamId) {
        const t = await getTeam(profile.teamId);
        setTeam(t);
        if (t?.id) {
          const f = await getTeamFeed(t.id).catch(() => []);
          setFeed(f);
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!teamNameInput.trim() || !user?.uid) return;
    setSaving(true);
    try {
      const teamId = await createTeam(user.uid, teamNameInput.trim(), user.displayName ?? 'Owner');
      setShowCreateModal(false);
      setTeamNameInput('');
      await loadTeam();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCodeInput.trim() || !user?.uid) return;
    setSaving(true);
    try {
      await joinTeamWithCode(user.uid, inviteCodeInput.trim(), user.displayName ?? 'Coach');
      setShowJoinModal(false);
      setInviteCodeInput('');
      await loadTeam();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Invalid invite code');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCoach = (coachUid: string, coachName: string) => {
    if (!user?.uid || !team?.id) return;
    Alert.alert('Remove Member', `Remove ${coachName} from the team?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await removeCoach(team.id!, coachUid, user.uid!);
            await loadTeam();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Team</Text>
        </View>
        <View style={styles.noTeamContainer}>
          <Text style={styles.noTeamIcon}>🏟️</Text>
          <Text style={styles.noTeamTitle}>No Team Yet</Text>
          <Text style={styles.noTeamSub}>Create a team or join with an invite code.</Text>
          <Pressable style={[styles.btn, { backgroundColor: '#AF52DE' }]} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.btnText}>+ Create Team</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border }]} onPress={() => setShowJoinModal(true)}>
            <Text style={[styles.btnText, { color: Colors.text }]}>Enter Invite Code</Text>
          </Pressable>
        </View>

        {/* Create Modal */}
        <Modal visible={showCreateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create Team</Text>
              <TextInput
                style={styles.input}
                placeholder="Team name..."
                placeholderTextColor={Colors.subtext}
                value={teamNameInput}
                onChangeText={setTeamNameInput}
                autoFocus
              />
              <View style={styles.modalBtns}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirmBtn, (!teamNameInput.trim() || saving) && { opacity: 0.5 }]}
                  onPress={handleCreate}
                  disabled={!teamNameInput.trim() || saving}
                >
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmText}>Create</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Join Modal */}
        <Modal visible={showJoinModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Join Team</Text>
              <TextInput
                style={styles.input}
                placeholder="6-character invite code..."
                placeholderTextColor={Colors.subtext}
                value={inviteCodeInput}
                onChangeText={v => setInviteCodeInput(v.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
              <View style={styles.modalBtns}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setShowJoinModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirmBtn, (!inviteCodeInput.trim() || saving) && { opacity: 0.5 }]}
                  onPress={handleJoin}
                  disabled={!inviteCodeInput.trim() || saving}
                >
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmText}>Join</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const isOwner = team.ownerId === user?.uid;
  const record = { wins: 8, losses: 4, ties: 2 }; // mock season record

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{team.teamName}</Text>
        <View style={styles.inviteRow}>
          <Text style={styles.inviteLabel}>Invite code: </Text>
          <Text style={styles.inviteCode}>{team.inviteCode}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Season record */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Season Record</Text>
          <View style={styles.recordRow}>
            <View style={styles.recordItem}>
              <Text style={[styles.recordVal, { color: '#34C759' }]}>{record.wins}</Text>
              <Text style={styles.recordLabel}>Wins</Text>
            </View>
            <View style={styles.recordDivider} />
            <View style={styles.recordItem}>
              <Text style={[styles.recordVal, { color: '#FF3B30' }]}>{record.losses}</Text>
              <Text style={styles.recordLabel}>Losses</Text>
            </View>
            <View style={styles.recordDivider} />
            <View style={styles.recordItem}>
              <Text style={[styles.recordVal, { color: '#FFD700' }]}>{record.ties}</Text>
              <Text style={styles.recordLabel}>Ties</Text>
            </View>
          </View>
        </View>

        {/* Members */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Members ({team.coaches.length})</Text>
          <View style={styles.memberList}>
            {team.coaches.map(coach => (
              <View key={coach.uid} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{coach.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{coach.name}</Text>
                  <View style={[styles.rolePill, { backgroundColor: coach.role === 'owner' ? '#AF52DE33' : Colors.input }]}>
                    <Text style={[styles.rolePillText, { color: coach.role === 'owner' ? '#AF52DE' : Colors.subtext }]}>
                      {coach.role.charAt(0).toUpperCase() + coach.role.slice(1)}
                    </Text>
                  </View>
                </View>
                {isOwner && coach.uid !== user?.uid && (
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => handleRemoveCoach(coach.uid, coach.name)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Team feed */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team Feed</Text>
          {feed.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedText}>No activity yet. Analyses and drawings shared by coaches will appear here.</Text>
            </View>
          ) : (
            <View style={styles.feedList}>
              {feed.map(item => (
                <View key={item.id} style={styles.feedItem}>
                  <Text style={styles.feedType}>{item.type.toUpperCase()}</Text>
                  <Text style={styles.feedAuthor}>{item.authorName}</Text>
                  <Text style={styles.feedContent}>{item.content}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, gap: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  inviteRow: { flexDirection: 'row', alignItems: 'center' },
  inviteLabel: { fontSize: 13, color: Colors.subtext },
  inviteCode: {
    fontSize: 14, fontWeight: '800', color: '#AF52DE',
    letterSpacing: 2, backgroundColor: '#AF52DE22',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6,
  },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  recordItem: { flex: 1, alignItems: 'center', gap: 4 },
  recordVal: { fontSize: 36, fontWeight: '800' },
  recordLabel: { fontSize: 12, color: Colors.subtext, fontWeight: '600' },
  recordDivider: { width: 1, height: 48, backgroundColor: Colors.border },
  memberList: { gap: 10 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.input, borderRadius: 12, padding: 12,
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#AF52DE33', borderWidth: 1, borderColor: '#AF52DE55',
    justifyContent: 'center', alignItems: 'center',
  },
  memberAvatarText: { fontSize: 16, fontWeight: '800', color: '#AF52DE' },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  rolePillText: { fontSize: 11, fontWeight: '600' },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FF3B3033', justifyContent: 'center', alignItems: 'center',
  },
  removeBtnText: { fontSize: 12, color: '#FF3B30', fontWeight: '700' },
  emptyFeed: { padding: 16, alignItems: 'center' },
  emptyFeedText: { fontSize: 13, color: Colors.subtext, textAlign: 'center', lineHeight: 18 },
  feedList: { gap: 10 },
  feedItem: {
    backgroundColor: Colors.input, borderRadius: 10, padding: 12, gap: 4,
  },
  feedType: { fontSize: 10, fontWeight: '700', color: Colors.accent, letterSpacing: 1 },
  feedAuthor: { fontSize: 13, fontWeight: '600', color: Colors.text },
  feedContent: { fontSize: 12, color: Colors.subtext },
  noTeamContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  noTeamIcon: { fontSize: 64 },
  noTeamTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  noTeamSub: { fontSize: 14, color: Colors.subtext, textAlign: 'center', marginBottom: 8 },
  btn: {
    width: '100%', height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  input: {
    backgroundColor: Colors.input, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: Colors.subtext, fontWeight: '600' },
  modalConfirmBtn: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: '#AF52DE', justifyContent: 'center', alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
