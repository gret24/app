import { useState } from 'react';
import { useRouter } from 'expo-router';

const ADMIN_EMAILS = ['hshan16hhs@gmail.com'];
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription, Plan, PLAN_DETAILS } from '../../contexts/SubscriptionContext';
import { Colors } from '../../constants/Colors';

const UPGRADE_PLANS: Plan[] = ['starter', 'pro', 'team'];

function UpgradePlanModal({
  visible,
  currentPlan,
  onClose,
  onUpgrade,
}: {
  visible: boolean;
  currentPlan: Plan;
  onClose: () => void;
  onUpgrade: (p: Plan) => void;
}) {
  const [selected, setSelected] = useState<Plan>('pro');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await onUpgrade(selected);
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.backdrop}>
        <View style={m.sheet}>
          <Text style={m.title}>Upgrade Plan</Text>
          {UPGRADE_PLANS.map(p => {
            const d = PLAN_DETAILS[p];
            const isCurrent = p === currentPlan;
            const isSel = p === selected;
            return (
              <Pressable
                key={p}
                style={[m.planRow, isSel && m.planRowActive]}
                onPress={() => !isCurrent && setSelected(p)}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Text style={m.planName}>{d.label}</Text>
                    {isCurrent && <View style={m.currentBadge}><Text style={m.currentBadgeText}>Current</Text></View>}
                  </View>
                  <Text style={m.planPrice}>${d.price}/mo</Text>
                  <Text style={m.planFeature}>{d.features[0]}</Text>
                </View>
                {isSel && !isCurrent && <Text style={{ color: Colors.accent, fontSize: 18 }}>✓</Text>}
              </Pressable>
            );
          })}
          <Pressable style={[m.btn, loading && { opacity: 0.7 }]} onPress={handle} disabled={loading}>
            <Text style={m.btnText}>{loading ? 'Processing...' : `Upgrade to ${PLAN_DETAILS[selected].label}`}</Text>
          </Pressable>
          <Pressable style={m.cancelBtn} onPress={onClose}>
            <Text style={m.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const { plan, upgrade } = useSubscription();

  const [showUpgrade, setShowUpgrade] = useState(false);

  const initials = (user?.displayName ?? user?.email ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const planColors: Record<Plan, string> = {
    free: Colors.subtext,
    starter: '#34C759',
    pro: Colors.accent,
    team: '#FFD700',
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <>
      <ScrollView style={p.root} contentContainerStyle={p.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={p.header}>
          <Text style={p.headerTitle}>Profile</Text>
        </View>

        {/* Avatar + info */}
        <View style={p.profileCard}>
          <View style={p.avatar}>
            <Text style={p.avatarText}>{initials}</Text>
          </View>
          <Text style={p.name}>{user?.displayName ?? 'Player'}</Text>
          <Text style={p.email}>{user?.email}</Text>
          <Text style={p.team}>Ice Hawks</Text>

          {/* Plan badge */}
          <View style={[p.planBadge, { borderColor: planColors[plan] + '88', backgroundColor: planColors[plan] + '22' }]}>
            <Text style={[p.planBadgeText, { color: planColors[plan] }]}>
              {PLAN_DETAILS[plan].label.toUpperCase()} PLAN
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={p.statsRow}>
          <View style={p.statCard}>
            <Text style={p.statValue}>0</Text>
            <Text style={p.statLabel}>Lessons{'\n'}Watched</Text>
          </View>
          <View style={p.statDivider} />
          <View style={p.statCard}>
            <Text style={p.statValue}>0</Text>
            <Text style={p.statLabel}>Analyses{'\n'}Done</Text>
          </View>
          <View style={p.statDivider} />
          <View style={p.statCard}>
            <Text style={p.statValue}>0</Text>
            <Text style={p.statLabel}>Drawings{'\n'}Saved</Text>
          </View>
        </View>

        {/* Plan features */}
        <View style={p.section}>
          <Text style={p.sectionTitle}>Your Plan Features</Text>
          <View style={p.featuresList}>
            {PLAN_DETAILS[plan].features.map(f => (
              <View key={f} style={p.featureRow}>
                <Text style={p.featureCheck}>✓</Text>
                <Text style={p.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upgrade button (hide if team) */}
        {plan !== 'team' && (
          <Pressable style={p.upgradeBtn} onPress={() => setShowUpgrade(true)}>
            <Text style={p.upgradeBtnText}>⬆ Upgrade Plan</Text>
          </Pressable>
        )}

        {/* Settings rows */}
        <View style={p.section}>
          <Text style={p.sectionTitle}>Account</Text>
          <View style={p.menuCard}>
            {[
              { icon: '🔔', label: 'Notifications' },
              { icon: '🔒', label: 'Privacy & Security' },
              { icon: '❓', label: 'Help & Support' },
              { icon: '📄', label: 'Terms & Privacy' },
            ].map(item => (
              <Pressable key={item.label} style={p.menuRow}>
                <Text style={p.menuIcon}>{item.icon}</Text>
                <Text style={p.menuLabel}>{item.label}</Text>
                <Text style={p.menuArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* DEV 플랜 토글 (개발 모드) */}
        {__DEV__ && !isAdmin && (
          <View style={{ backgroundColor: '#FF000011', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FF000033' }}>
            <Text style={{ fontSize: 11, color: '#FF6644', fontWeight: '700', marginBottom: 8 }}>🛠 DEV: 플랜 변경</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['free','starter','pro','team'] as Plan[]).map(pl => (
                <Pressable key={pl} style={{
                  flex: 1, height: 32, borderRadius: 8, borderWidth: 1,
                  borderColor: plan === pl ? '#00D4FF' : '#333',
                  backgroundColor: plan === pl ? '#00D4FF22' : 'transparent',
                  justifyContent: 'center', alignItems: 'center',
                }} onPress={() => upgrade(pl)}>
                  <Text style={{ fontSize: 10, color: plan === pl ? '#00D4FF' : '#888', fontWeight: '700' }}>{pl.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 관리자 버튼 */}
        {isAdmin && (
          <Pressable
            style={[p.signOutBtn, { borderColor: '#FFD70066', backgroundColor: '#FFD70011' }]}
            onPress={() => router.push('/admin' as any)}
          >
            <Text style={[p.signOutText, { color: '#FFD700' }]}>👑 관리자 대시보드</Text>
          </Pressable>
        )}

        {/* Sign Out */}
        <Pressable style={p.signOutBtn} onPress={handleSignOut}>
          <Text style={p.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <UpgradePlanModal
        visible={showUpgrade}
        currentPlan={plan}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={async (newPlan) => { await upgrade(newPlan); }}
      />
    </>
  );
}

const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingTop: 60, gap: 20 },
  header: { marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },

  profileCard: {
    backgroundColor: Colors.card, borderRadius: 20,
    padding: 24, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accent + '33',
    borderWidth: 2, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.accent },
  name: { fontSize: 20, fontWeight: '700', color: Colors.text },
  email: { fontSize: 13, color: Colors.subtext },
  team: { fontSize: 13, color: Colors.subtext },
  planBadge: {
    marginTop: 8, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1,
  },
  planBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  statsRow: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 20, flexDirection: 'row',
    borderWidth: 1, borderColor: Colors.border,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 26, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: 11, color: Colors.subtext, textAlign: 'center', lineHeight: 15 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  featuresList: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: { fontSize: 14, color: Colors.accent },
  featureText: { fontSize: 14, color: Colors.subtext },

  upgradeBtn: {
    height: 54, borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  upgradeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },

  menuCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 12,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.text },
  menuArrow: { fontSize: 18, color: Colors.subtext },

  settingsCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 0 },
  settingsLabel: { fontSize: 13, fontWeight: '700', color: Colors.subtext, marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  langBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  langText: { fontSize: 14, color: Colors.subtext, fontWeight: '600' },
  langTextActive: { color: Colors.accent },
  signOutBtn: {
    height: 54, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.error + '55',
    backgroundColor: Colors.error + '11',
    justifyContent: 'center', alignItems: 'center',
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: Colors.error },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, gap: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  planRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.input,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  planRowActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '11' },
  planName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  planPrice: { fontSize: 13, color: Colors.accent },
  planFeature: { fontSize: 11, color: Colors.subtext },
  currentBadge: {
    backgroundColor: Colors.accent + '33',
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2,
  },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.accent },
  btn: {
    height: 52, borderRadius: 12, marginTop: 8,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 15, color: Colors.subtext },
});
