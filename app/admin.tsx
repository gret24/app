import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { getAllUsers, approveUser, rejectUser, isPlanExpired, type AppUser, type Plan } from '../lib/userService';

const ADMIN_EMAILS = ['hshan16hhs@gmail.com'];

const PLAN_COLOR: Record<Plan, string> = {
  free: Colors.subtext, starter: '#00CC66', pro: Colors.accent, team: '#FFD700',
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#FFD700', approved: '#00CC66', rejected: '#FF4444', expired: '#FF6644',
};
const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ 대기', approved: '✅ 승인', rejected: '❌ 거절', expired: '⌛ 만료',
};

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [plan, setPlan] = useState<Plan>('pro');
  const [days, setDays] = useState('30');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // 관리자 체크
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 40 }}>🚫</Text>
        <Text style={{ color: Colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 }}>접근 권한 없음</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const loadUsers = async () => {
    setLoading(true);
    try {
      const all = await getAllUsers();
      setUsers(all.map(u => ({
        ...u,
        status: u.expiresAt && isPlanExpired(u) ? 'expired' : u.status,
      })));
    } catch (e) {
      Alert.alert('오류', '사용자 목록을 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u => filter === 'all' || u.status === filter);
  const counts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
  };

  const openApprove = (u: AppUser) => {
    setSelected(u); setPlan(u.plan === 'free' ? 'pro' : u.plan);
    setDays('30'); setNote(u.note ?? '');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selected || !user?.email) return;
    setSaving(true);
    try {
      await approveUser(selected.uid, plan, parseInt(days) || 30, user.email, note);
      Alert.alert('완료', `${selected.email} 승인됨 (${plan}, ${days}일)`);
      setShowModal(false);
      loadUsers();
    } catch {
      Alert.alert('오류', '승인 처리 실패');
    } finally { setSaving(false); }
  };

  const handleReject = async (u: AppUser) => {
    Alert.alert('거절', `${u.email}을 거절하시겠어요?`, [
      { text: '취소', style: 'cancel' },
      { text: '거절', style: 'destructive', onPress: async () => {
        await rejectUser(u.uid, '관리자 거절');
        loadUsers();
      }},
    ]);
  };

  const fmtDate = (ts: any) => {
    if (!ts) return '무제한';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
  };

  return (
    <View style={s.root}>
      {/* 헤더 */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()}><Text style={s.back}>‹</Text></Pressable>
        <Text style={s.title}>👑 관리자</Text>
        <Pressable onPress={loadUsers}><Text style={s.refresh}>↻ 새로고침</Text></Pressable>
      </View>

      {/* 통계 */}
      <View style={s.statsRow}>
        {([['all','전체',Colors.text],['pending','대기','#FFD700'],['approved','승인','#00CC66'],['rejected','거절','#FF4444']] as const).map(([key,label,color]) => (
          <Pressable key={key} style={[s.statCard, filter===key && { borderColor: color }]} onPress={() => setFilter(key as FilterStatus)}>
            <Text style={[s.statNum, { color }]}>{counts[key]}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* 사용자 목록 */}
      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {filtered.length === 0 && (
            <Text style={s.empty}>해당 사용자 없음</Text>
          )}
          {filtered.map(u => (
            <View key={u.uid} style={s.userCard}>
              <View style={s.userInfo}>
                <View style={s.userTop}>
                  <Text style={s.userEmail}>{u.email}</Text>
                  <View style={[s.statusBadge, { backgroundColor: STATUS_COLOR[u.status] + '33' }]}>
                    <Text style={[s.statusText, { color: STATUS_COLOR[u.status] }]}>{STATUS_LABEL[u.status]}</Text>
                  </View>
                </View>
                <Text style={s.userName}>{u.displayName}</Text>
                <View style={s.userMeta}>
                  <View style={[s.planBadge, { backgroundColor: PLAN_COLOR[u.plan] + '33' }]}>
                    <Text style={[s.planText, { color: PLAN_COLOR[u.plan] }]}>{u.plan.toUpperCase()}</Text>
                  </View>
                  {u.expiresAt && (
                    <Text style={s.expiry}>만료: {fmtDate(u.expiresAt)}</Text>
                  )}
                  <Text style={s.joined}>가입: {fmtDate(u.createdAt)}</Text>
                </View>
                {u.note && <Text style={s.noteText}>📝 {u.note}</Text>}
              </View>
              <View style={s.actions}>
                <Pressable style={s.approveBtn} onPress={() => openApprove(u)}>
                  <Text style={s.approveBtnText}>승인</Text>
                </Pressable>
                {u.status !== 'rejected' && (
                  <Pressable style={s.rejectBtn} onPress={() => handleReject(u)}>
                    <Text style={s.rejectBtnText}>거절</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 승인 모달 */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>✅ 승인 설정</Text>
            <Text style={s.sheetEmail}>{selected?.email}</Text>

            <Text style={s.fieldLabel}>플랜</Text>
            <View style={s.planRow}>
              {(['free','starter','pro','team'] as Plan[]).map(p => (
                <Pressable key={p} style={[s.planBtn, plan===p && { borderColor: PLAN_COLOR[p], backgroundColor: PLAN_COLOR[p]+'22' }]} onPress={() => setPlan(p)}>
                  <Text style={[s.planBtnText, plan===p && { color: PLAN_COLOR[p] }]}>{p.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.fieldLabel}>기간 (일, 0 = 무제한)</Text>
            <View style={s.daysRow}>
              {['7','30','90','180','365','0'].map(d => (
                <Pressable key={d} style={[s.dayBtn, days===d && s.dayBtnActive]} onPress={() => setDays(d)}>
                  <Text style={[s.dayBtnText, days===d && s.dayBtnTextActive]}>{d==='0'?'∞':d+'일'}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={s.input} value={days} onChangeText={setDays} keyboardType="number-pad" placeholder="직접 입력" placeholderTextColor={Colors.subtext} />

            <Text style={s.fieldLabel}>메모 (선택)</Text>
            <TextInput style={s.input} value={note} onChangeText={setNote} placeholder="관리자 메모..." placeholderTextColor={Colors.subtext} />

            <View style={s.modalBtns}>
              <Pressable style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelBtnText}>취소</Text>
              </Pressable>
              <Pressable style={s.confirmBtn} onPress={handleApprove} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.bg} /> : <Text style={s.confirmBtnText}>승인하기</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  back: { fontSize: 28, color: Colors.accent },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  refresh: { fontSize: 14, color: Colors.accent },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statNum: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: Colors.subtext },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  empty: { color: Colors.subtext, textAlign: 'center', padding: 40 },
  userCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: 10 },
  userInfo: { flex: 1, gap: 4 },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userEmail: { fontSize: 13, fontWeight: '700', color: Colors.text, flex: 1 },
  userName: { fontSize: 12, color: Colors.subtext },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  planBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  planText: { fontSize: 10, fontWeight: '800' },
  expiry: { fontSize: 10, color: '#FF6644' },
  joined: { fontSize: 10, color: Colors.subtext },
  noteText: { fontSize: 11, color: Colors.subtext, fontStyle: 'italic' },
  actions: { gap: 6, justifyContent: 'center' },
  approveBtn: { backgroundColor: Colors.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  approveBtnText: { color: Colors.bg, fontSize: 12, fontWeight: '700' },
  rejectBtn: { backgroundColor: '#FF444422', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#FF444466' },
  rejectBtnText: { color: '#FF4444', fontSize: 12, fontWeight: '700' },
  // 모달
  overlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, gap: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sheetEmail: { fontSize: 13, color: Colors.accent },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.subtext, textTransform: 'uppercase', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', gap: 8 },
  planBtn: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  planBtnText: { fontSize: 11, fontWeight: '700', color: Colors.subtext },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.input },
  dayBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  dayBtnText: { fontSize: 12, color: Colors.subtext, fontWeight: '600' },
  dayBtnTextActive: { color: Colors.accent },
  input: { height: 44, backgroundColor: Colors.input, borderRadius: 10, paddingHorizontal: 14, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { color: Colors.subtext, fontSize: 15 },
  confirmBtn: { flex: 2, height: 48, borderRadius: 12, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: Colors.bg, fontSize: 15, fontWeight: '700' },
  backBtn: { marginTop: 20, height: 44, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: Colors.subtext },
});
