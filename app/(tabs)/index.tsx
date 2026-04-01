import {
  View, Text, StyleSheet, ScrollView, Pressable,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Colors } from '../../constants/Colors';
import { MOCK_LESSONS } from '../../data/mockData';

const FEATURED = MOCK_LESSONS.filter(l => !l.isPro).slice(0, 3);

export default function HomeScreen() {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const router = useRouter();
  const firstName = user?.displayName?.split(' ')[0] ?? 'Player';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{firstName} 🏒</Text>
        </View>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{plan.toUpperCase()}</Text>
        </View>
      </View>

      {/* Recent Analysis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Analysis</Text>
          <Pressable onPress={() => router.push('/(tabs)/analysis')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No analyses yet</Text>
          <Text style={styles.emptySubtext}>Upload a game video to get started</Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/analysis')}
          >
            <Text style={styles.emptyBtnText}>+ Upload Video</Text>
          </Pressable>
        </View>
      </View>

      {/* Featured Lessons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Lessons</Text>
          <Pressable onPress={() => router.push('/(tabs)/lessons')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        <FlatList
          horizontal
          data={FEATURED}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 4 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.lessonCard}
              onPress={() => router.push(`/lesson/${item.id}` as any)}
            >
              <View style={styles.lessonThumb}>
                <Text style={styles.lessonThumbIcon}>
                  {item.category === 'Skating' ? '⛸️' :
                   item.category === 'Shooting' ? '🏒' :
                   item.category === 'Defense' ? '🛡️' :
                   item.category === 'Goalie' ? '🥅' : '📹'}
                </Text>
              </View>
              <View style={styles.lessonMeta}>
                <Text style={styles.lessonCategory}>{item.category}</Text>
                <Text style={styles.lessonTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.lessonFooter}>
                  <Text style={styles.lessonDifficulty}>{item.difficulty}</Text>
                  <Text style={styles.lessonDuration}>⏱ {item.duration}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => router.push('/(tabs)/analysis')}
          >
            <Text style={styles.actionIcon}>🎬</Text>
            <Text style={styles.actionBtnPrimaryText}>Upload Video</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => router.push('/(tabs)/lessons')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionBtnSecondaryText}>Browse Lessons</Text>
          </Pressable>
        </View>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Analyses</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingTop: 60, paddingBottom: 40, gap: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 14, color: Colors.subtext },
  name: { fontSize: 26, fontWeight: '800', color: Colors.text, marginTop: 2 },
  planBadge: {
    backgroundColor: Colors.accent + '22',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.accent + '55',
  },
  planBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.accent, letterSpacing: 1 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16, padding: 28,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 36, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySubtext: { fontSize: 13, color: Colors.subtext, textAlign: 'center' },
  emptyBtn: {
    marginTop: 8, backgroundColor: Colors.accent,
    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.bg },
  lessonCard: {
    width: 200,
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  lessonThumb: {
    height: 110, backgroundColor: Colors.input,
    justifyContent: 'center', alignItems: 'center',
  },
  lessonThumbIcon: { fontSize: 40 },
  lessonMeta: { padding: 12, gap: 4 },
  lessonCategory: { fontSize: 10, color: Colors.accent, fontWeight: '700', letterSpacing: 0.5 },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 },
  lessonFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  lessonDifficulty: { fontSize: 11, color: Colors.subtext },
  lessonDuration: { fontSize: 11, color: Colors.subtext },
  quickActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, height: 64, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 8,
  },
  actionBtnPrimary: { backgroundColor: Colors.accent },
  actionBtnSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionIcon: { fontSize: 20 },
  actionBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: Colors.bg },
  actionBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  statsBanner: {
    backgroundColor: Colors.card,
    borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-around',
    borderWidth: 1, borderColor: Colors.border,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: 12, color: Colors.subtext },
  statDivider: { width: 1, backgroundColor: Colors.border },
});
