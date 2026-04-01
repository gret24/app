import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Colors } from '../../constants/Colors';
import { MOCK_LESSONS, Lesson, Category } from '../../data/mockData';

type FilterCategory = 'All' | Category;
const CATEGORIES: FilterCategory[] = ['All', 'Basics', 'Skating', 'Shooting', 'Tactics', 'Defense', 'Goalie', 'Game IQ'];

const CATEGORY_ICON: Record<string, string> = {
  All: '🏒', Basics: '📌', Skating: '⛸️', Shooting: '🎯',
  Tactics: '🧠', Defense: '🛡️', Goalie: '🥅', 'Game IQ': '💡',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: '#34C759',
  Intermediate: '#FFD700',
  Advanced: '#FF3B30',
};

function LessonCard({ lesson, isPro }: { lesson: Lesson; isPro: boolean }) {
  const router = useRouter();
  const locked = lesson.isPro && !isPro;

  return (
    <Pressable
      style={styles.lessonCard}
      onPress={() => router.push(`/lesson/${lesson.id}` as any)}
    >
      {/* Thumbnail */}
      <View style={styles.thumbContainer}>
        <View style={styles.thumb}>
          <Text style={styles.thumbIcon}>
            {lesson.category === 'Skating' ? '⛸️' :
             lesson.category === 'Shooting' ? '🏒' :
             lesson.category === 'Defense' ? '🛡️' :
             lesson.category === 'Goalie' ? '🥅' :
             lesson.category === 'Tactics' ? '🧠' :
             lesson.category === 'Game IQ' ? '💡' : '📹'}
          </Text>
          {lesson.type === 'youtube' && (
            <View style={styles.ytBadge}>
              <Text style={styles.ytBadgeText}>▶ YT</Text>
            </View>
          )}
        </View>
        {locked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{lesson.duration}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.lessonInfo}>
        <View style={styles.lessonTags}>
          <Text style={styles.categoryTag}>{lesson.category}</Text>
          <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[lesson.difficulty] + '33' }]}>
            <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[lesson.difficulty] }]}>
              {lesson.difficulty}
            </Text>
          </View>
          {lesson.isPro && (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={styles.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
      </View>
    </Pressable>
  );
}

function SkillDrillRow({ lesson, index, isPro }: { lesson: Lesson; index: number; isPro: boolean }) {
  const router = useRouter();
  const locked = lesson.isPro && !isPro;
  const progress = [0.3, 0.6, 0.0, 0.8, 0.1][index % 5];

  return (
    <Pressable
      style={styles.drillRow}
      onPress={() => router.push(`/lesson/${lesson.id}` as any)}
    >
      <View style={styles.drillLeft}>
        <Text style={styles.drillNum}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.drillTitle} numberOfLines={1}>{lesson.title}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
        </View>
      </View>
      <View style={styles.drillRight}>
        <Text style={styles.drillDuration}>{lesson.duration}</Text>
        {locked && <Text style={{ fontSize: 14 }}>🔒</Text>}
      </View>
    </Pressable>
  );
}

export default function LessonsScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');
  const { isPro } = useSubscription();

  const filtered = useMemo(() => {
    return MOCK_LESSONS.filter(l => {
      const matchCat = activeCategory === 'All' || l.category === activeCategory;
      const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
                          l.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const aiRecommended = useMemo(() => MOCK_LESSONS.filter(l => l.isPro).slice(0, 3), []);
  const featured = useMemo(() => filtered.filter(l => !l.isPro).slice(0, 6), [filtered]);
  const drills = useMemo(() => filtered.slice(0, 5), [filtered]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lessons</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search lessons..."
            placeholderTextColor={Colors.subtext}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat}
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={styles.catIcon}>{CATEGORY_ICON[cat]}</Text>
              <Text style={[styles.catLabel, activeCategory === cat && styles.catLabelActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* AI Recommended */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Recommended</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
          <FlatList
            horizontal
            data={aiRecommended}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            renderItem={({ item }) => (
              <LessonCard lesson={item} isPro={isPro} />
            )}
          />
        </View>

        {/* Featured Lessons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Lessons</Text>
            <Text style={styles.countText}>{featured.length} lessons</Text>
          </View>
          {featured.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No lessons found</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={featured}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              renderItem={({ item }) => (
                <LessonCard lesson={item} isPro={isPro} />
              )}
            />
          )}
        </View>

        {/* Skill Drills */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skill Drills</Text>
          </View>
          <View style={styles.drillsCard}>
            {drills.map((lesson, i) => (
              <SkillDrillRow key={lesson.id} lesson={lesson} index={i} isPro={isPro} />
            ))}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.input, borderRadius: 12,
    marginHorizontal: 20, marginBottom: 16,
    paddingHorizontal: 14, paddingVertical: 0,
    borderWidth: 1, borderColor: Colors.border,
    height: 46,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  clearSearch: { fontSize: 14, color: Colors.subtext, padding: 4 },

  categoryList: { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 13, fontWeight: '600', color: Colors.subtext },
  catLabelActive: { color: Colors.accent },

  section: { marginTop: 24, gap: 12 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  countText: { fontSize: 13, color: Colors.subtext, marginLeft: 'auto' },
  proBadge: {
    backgroundColor: '#FFD700' + '33',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: '#FFD700' + '66',
  },
  proText: { fontSize: 10, fontWeight: '800', color: '#FFD700' },

  noResults: { padding: 40, alignItems: 'center' },
  noResultsText: { color: Colors.subtext, fontSize: 15 },

  // Lesson card
  lessonCard: {
    width: 196,
    backgroundColor: Colors.card,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    marginLeft: 20,
  },
  thumbContainer: { position: 'relative' },
  thumb: {
    height: 110, backgroundColor: Colors.input,
    justifyContent: 'center', alignItems: 'center',
  },
  thumbIcon: { fontSize: 38 },
  ytBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#FF0000CC',
    borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2,
  },
  ytBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000AA',
    justifyContent: 'center', alignItems: 'center',
  },
  lockIcon: { fontSize: 28 },
  durationBadge: {
    position: 'absolute', bottom: 6, right: 8,
    backgroundColor: '#000000BB',
    borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2,
  },
  durationText: { fontSize: 10, color: '#FFF', fontWeight: '600' },
  lessonInfo: { padding: 12, gap: 6 },
  lessonTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  categoryTag: { fontSize: 10, color: Colors.accent, fontWeight: '700' },
  diffBadge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  diffText: { fontSize: 10, fontWeight: '700' },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 },

  // Drills
  drillsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  drillRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  drillLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  drillNum: { fontSize: 13, fontWeight: '700', color: Colors.subtext, width: 24 },
  drillTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  progressBar: {
    height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  drillRight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  drillDuration: { fontSize: 12, color: Colors.subtext },
});
