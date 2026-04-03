import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { updateUserRole, UserRole } from '../api/userService';
import { Colors } from '../constants/Colors';

const ROLE_CARDS: {
  role: UserRole;
  icon: string;
  title: string;
  description: string;
  features: string[];
  color: string;
}[] = [
  {
    role: 'player',
    icon: '🏒',
    title: 'Player',
    description: 'Track your personal performance, ice time, and skill development.',
    features: [
      'Personal stats & ice time',
      'Game IQ score tracking',
      'Learning progress dashboard',
      'Highlight reels & clips',
    ],
    color: '#00D4FF',
  },
  {
    role: 'coach',
    icon: '📋',
    title: 'Coach',
    description: 'Analyze your team, develop tactics, and generate player reports.',
    features: [
      'Full roster analysis',
      'Zone & tactics board',
      'AI-powered game reports',
      'Player development tools',
    ],
    color: '#34C759',
  },
  {
    role: 'team',
    icon: '🏟️',
    title: 'Team',
    description: 'Manage your organization, invite coaches, and share analyses.',
    features: [
      'Team dashboard & feed',
      'Invite & manage coaches',
      'Shared analysis library',
      'Season record summary',
    ],
    color: '#AF52DE',
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const { user, setUserRoleLocal } = useAuth();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || !user?.uid) return;
    setSaving(true);
    try {
      await updateUserRole(user.uid, selected);
      setUserRoleLocal(selected);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Failed to save role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>This helps us personalize your IceIQ experience.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.cards}
        showsVerticalScrollIndicator={false}
      >
        {ROLE_CARDS.map(({ role, icon, title, description, features, color }) => {
          const isSelected = selected === role;
          return (
            <Pressable
              key={role}
              style={[
                styles.card,
                { borderColor: isSelected ? color : Colors.border },
                isSelected && { backgroundColor: color + '11' },
              ]}
              onPress={() => setSelected(role)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconCircle, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                  <Text style={styles.icon}>{icon}</Text>
                </View>
                <View style={styles.cardTitles}>
                  <Text style={[styles.cardTitle, isSelected && { color }]}>{title}</Text>
                  <Text style={styles.cardDesc}>{description}</Text>
                </View>
                <View style={[styles.radioOuter, { borderColor: isSelected ? color : Colors.border }]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: color }]} />}
                </View>
              </View>

              <View style={styles.featureList}>
                {features.map(f => (
                  <View key={f} style={styles.featureRow}>
                    <View style={[styles.featureDot, { backgroundColor: color }]} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.confirmBtn,
            { backgroundColor: selected ? (ROLE_CARDS.find(r => r.role === selected)?.color ?? Colors.accent) : Colors.border },
            (!selected || saving) && { opacity: 0.6 },
          ]}
          onPress={handleConfirm}
          disabled={!selected || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>
              {selected ? `Continue as ${ROLE_CARDS.find(r => r.role === selected)?.title}` : 'Select a Role'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingTop: 72, paddingHorizontal: 24, paddingBottom: 20,
    gap: 6,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.subtext },
  cards: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20, borderWidth: 2,
    padding: 20, gap: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  icon: { fontSize: 26 },
  cardTitles: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  cardDesc: { fontSize: 13, color: Colors.subtext, lineHeight: 18 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  featureList: { gap: 8, paddingLeft: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { fontSize: 13, color: Colors.subtext },
  footer: {
    padding: 20, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  confirmBtn: {
    height: 54, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
