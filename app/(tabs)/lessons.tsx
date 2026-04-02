import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import TacticsDiagram from '../../components/TacticsDiagram';
import IceTimeDiagram from '../../components/IceTimeDiagram';

// ── mock 시프트 데이터 (IceTimeDiagram 데모용) ──────────────
const DEMO_SHIFTS = [
  { shift_number: 1, start_time: 109,  end_time: 121,  duration: 12 },
  { shift_number: 2, start_time: 203,  end_time: 224,  duration: 21 },
  { shift_number: 3, start_time: 321,  end_time: 358,  duration: 37 },
  { shift_number: 4, start_time: 600,  end_time: 640,  duration: 40 },
  { shift_number: 5, start_time: 1200, end_time: 1260, duration: 60 },
];

// ── mock 레슨 데이터 ────────────────────────────────────────
const LESSONS = [
  { id: '1', title: 'Skating Fundamentals',  youtube: 'LPmGKBaRMhc', cat: 'Skating',  diff: 'Beginner',     dur: '8:32'  },
  { id: '2', title: 'Wrist Shot Technique',   youtube: 'r5IJufntqL0', cat: 'Shooting', diff: 'Intermediate', dur: '12:15' },
  { id: '3', title: 'Stickhandling Drills',   youtube: 'XiEBxBkBCBo', cat: 'Basics',   diff: 'Beginner',     dur: '10:04' },
  { id: '4', title: 'Defensive Positioning',  youtube: '9kgBiMk8HMc', cat: 'Defense',  diff: 'Intermediate', dur: '15:20' },
  { id: '5', title: 'Power Skating',          youtube: 'jF4PLbD6Ofs', cat: 'Skating',  diff: 'Advanced',     dur: '18:00' },
  { id: '6', title: 'Puck Handling Advanced', youtube: '3HQxDMZMIVs', cat: 'Basics',   diff: 'Advanced',     dur: '14:30' },
];

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#00CC66', Intermediate: '#FFD700', Advanced: '#FF6644',
};

type LessonsTab = 'videos' | 'tactics' | 'icetime';

export default function LessonsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LessonsTab>('videos');

  const TABS: { key: LessonsTab; label: string; icon: string }[] = [
    { key: 'videos',  label: '영상 레슨',    icon: '🎬' },
    { key: 'tactics', label: '전술 다이어그램', icon: '🗺️' },
    { key: 'icetime', label: '아이스타임',    icon: '⏱️' },
  ];

  return (
    <View style={s.root}>
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.title}>🎬 영상 레슨</Text>
      </View>

      {/* 탭 */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <Pressable
            key={t.key}
            style={[s.tab, activeTab === t.key && s.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabLabel, activeTab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── 영상 레슨 ── */}
      {activeTab === 'videos' && (
        <FlatList
          data={LESSONS}
          keyExtractor={i => i.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <Pressable style={s.lessonCard} onPress={() => router.push(`/lesson/${item.id}` as any)}>
              {/* 썸네일 */}
              <View style={s.thumbWrap}>
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${item.youtube}/hqdefault.jpg` }}
                  style={s.thumb}
                  resizeMode="cover"
                />
                <View style={s.ytBadge}><Text style={s.ytBadgeText}>YT</Text></View>
                <View style={s.durBadge}><Text style={s.durText}>{item.dur}</Text></View>
              </View>
              {/* 정보 */}
              <View style={s.lessonInfo}>
                <Text style={s.lessonTitle} numberOfLines={2}>{item.title}</Text>
                <View style={s.tagRow}>
                  <View style={s.catBadge}><Text style={s.catText}>{item.cat}</Text></View>
                  <View style={[s.diffBadge, { backgroundColor: DIFF_COLOR[item.diff] + '33' }]}>
                    <Text style={[s.diffText, { color: DIFF_COLOR[item.diff] }]}>{item.diff}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* ── 전술 다이어그램 ── */}
      {activeTab === 'tactics' && (
        <ScrollView contentContainerStyle={s.listContent}>
          <Text style={s.sectionTitle}>전술 패턴 애니메이션</Text>
          <Text style={s.sectionDesc}>
            브레이크아웃, 파워플레이, 포체크 등 주요 전술 패턴을 링크 다이어그램으로 확인하세요.
          </Text>
          <TacticsDiagram team="HOME" autoPlay={true} />
          <View style={{ height: 20 }} />
          <Text style={s.sectionTitle}>어웨이팀 시점</Text>
          <TacticsDiagram team="AWAY" autoPlay={false} />
        </ScrollView>
      )}

      {/* ── 아이스타임 다이어그램 ── */}
      {activeTab === 'icetime' && (
        <ScrollView contentContainerStyle={s.listContent}>
          <Text style={s.sectionTitle}>아이스타임 시프트 재생</Text>
          <Text style={s.sectionDesc}>
            선수의 시프트별 빙판 위 위치를 구간마다 확인하세요.
            실제 분석 후 Videos → Ice Time Shifts에서 상세 데이터를 볼 수 있습니다.
          </Text>
          <IceTimeDiagram
            shifts={DEMO_SHIFTS}
            playerJersey="47"
            playerTeam="HOME"
            autoPlay={true}
          />
          <View style={s.infoCard}>
            <Text style={s.infoIcon}>💡</Text>
            <Text style={s.infoText}>
              실제 경기 데이터는 Player 분석에서 영상을 선택하고 선수를 고른 후
              Ice Time Shifts 탭에서 확인할 수 있어요.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card, gap: 2 },
  tabActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 11, fontWeight: '700', color: Colors.subtext, textAlign: 'center' },
  tabLabelActive: { color: Colors.accent },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  // 레슨 카드
  lessonCard: { backgroundColor: Colors.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  thumbWrap: { position: 'relative', width: '100%', aspectRatio: 16/9 },
  thumb: { width: '100%', height: '100%' },
  ytBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF0000CC', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  ytBadgeText: { fontSize: 10, fontWeight: '800', color: 'white' },
  durBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#000000BB', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  durText: { fontSize: 11, color: 'white', fontWeight: '600' },
  lessonInfo: { padding: 12, gap: 8 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tagRow: { flexDirection: 'row', gap: 6 },
  catBadge: { backgroundColor: Colors.input, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 11, color: Colors.subtext, fontWeight: '600' },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '700' },
  // 섹션
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: Colors.subtext, lineHeight: 20, marginBottom: 16 },
  // 안내 카드
  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginTop: 8, alignItems: 'flex-start' },
  infoIcon: { fontSize: 20 },
  infoText: { flex: 1, fontSize: 13, color: Colors.subtext, lineHeight: 20 },
});
