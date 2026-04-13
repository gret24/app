import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, Dimensions, FlatList,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { getHeatmaps, resolveHeatmapUrl, HeatmapInfo } from '../api/heatmapService';

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_W = SCREEN_W - 32;
const IMG_H = IMG_W * (520 / 1040); // 2:1 aspect ratio

interface Props {
  videoStem: string; // e.g. "waves_g18"
  initialJersey?: string; // 기본 선택 선수
}

export default function HeatmapView({ videoStem, initialJersey }: Props) {
  const [heatmaps, setHeatmaps] = useState<HeatmapInfo[]>([]);
  const [selected, setSelected] = useState<HeatmapInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoStem) return;
    setLoading(true);
    setError(null);
    getHeatmaps(videoStem)
      .then(res => {
        const sorted = [...res.heatmaps].sort((a, b) => b.points - a.points);
        setHeatmaps(sorted);
        const init = initialJersey
          ? sorted.find(h => h.jersey === initialJersey) ?? sorted[0]
          : sorted[0];
        setSelected(init ?? null);
      })
      .catch(e => setError(e.message ?? 'Failed to load heatmaps'))
      .finally(() => setLoading(false));
  }, [videoStem]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>히트맵 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
      </View>
    );
  }

  if (!heatmaps.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>히트맵 없음</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 선수 선택 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {heatmaps.map(h => {
          const isActive = selected?.jersey === h.jersey;
          return (
            <Pressable
              key={h.jersey}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => { setSelected(h); setImgLoading(true); }}
            >
              <Text style={[styles.tabJersey, isActive && styles.tabTextActive]}>
                #{h.jersey}
              </Text>
              <Text style={[styles.tabName, isActive && styles.tabTextActive]}>
                {h.name.replace('_', ' ')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 히트맵 이미지 */}
      {selected && (
        <View style={styles.imgContainer}>
          <View style={styles.imgWrapper}>
            {imgLoading && (
              <View style={styles.imgOverlay}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            )}
            <Image
              source={{ uri: resolveHeatmapUrl(selected.image_url) }}
              style={styles.heatmapImg}
              resizeMode="contain"
              onLoadStart={() => setImgLoading(true)}
              onLoadEnd={() => setImgLoading(false)}
            />
          </View>

          {/* 선수 정보 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoName}>
              #{selected.jersey} {selected.name.replace('_', ' ')}
            </Text>
            {selected.points > 0 && (
              <Text style={styles.infoPoints}>
                {selected.points.toLocaleString()} pts
              </Text>
            )}
          </View>

          {/* 존 범례 */}
          <View style={styles.legend}>
            {[
              { label: 'DEF', color: '#3b82f6' },
              { label: 'NEU', color: '#a855f7' },
              { label: 'ATT', color: '#ef4444' },
            ].map(z => (
              <View key={z.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: z.color }]} />
                <Text style={styles.legendLabel}>{z.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  loadingText: { marginTop: 12, color: '#94a3b8', fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  emptyText: { color: '#64748b', fontSize: 14 },

  tabScroll: { maxHeight: 60 },
  tabRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#334155', backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabJersey: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  tabName: { fontSize: 10, color: '#64748b' },
  tabTextActive: { color: '#fff' },

  imgContainer: { paddingHorizontal: 16, paddingTop: 12 },
  imgWrapper: {
    width: IMG_W, height: IMG_H,
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1e293b',
    zIndex: 1,
  },
  heatmapImg: { width: IMG_W, height: IMG_H },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8,
  },
  infoName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  infoPoints: { fontSize: 12, color: '#64748b' },

  legend: {
    flexDirection: 'row', gap: 16, marginTop: 6, marginBottom: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: '#64748b' },
});
