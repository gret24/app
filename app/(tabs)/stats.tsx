import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../api/userService';
import { apiGet } from '../../api/client';

interface SpeedOverall {
  avg_speed_kmh: number;
  max_speed_kmh: number;
  total_distance_km: number;
  total_ice_time_min: number;
}

interface SpeedPeriod {
  period: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [jerseyNumber, setJerseyNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [speedData, setSpeedData] = useState<{ overall: SpeedOverall; per_period: SpeedPeriod[] } | null>(null);
  const [speedError, setSpeedError] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getUserProfile(user.uid).then(profile => {
      if (profile?.jerseyNumber) {
        setJerseyNumber(String(profile.jerseyNumber));
        fetchSpeed(String(profile.jerseyNumber));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [user?.uid]);

  const fetchSpeed = async (jersey: string) => {
    try {
      const data = await apiGet<any>(`/stats/game1_val/player/${jersey}/speed`);
      if (data?.overall && Object.keys(data.overall).length > 0) {
        setSpeedData(data);
      } else {
        setSpeedError(true);
      }
    } catch {
      setSpeedError(true);
    } finally {
      setLoading(false);
    }
  };

  const iqScore = 72; // mock - would come from quiz results
  const learningProgress = 35; // mock

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Stats</Text>
        {jerseyNumber && <Text style={styles.headerSub}>Jersey #{jerseyNumber}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game IQ card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Game IQ Score</Text>
          <View style={styles.iqRow}>
            <Text style={styles.iqScore}>{iqScore}</Text>
            <View style={styles.iqBadge}>
              <Text style={styles.iqBadgeText}>
                {iqScore >= 85 ? 'Elite' : iqScore >= 70 ? 'Advanced' : iqScore >= 50 ? 'Developing' : 'Beginner'}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${iqScore}%` }]} />
          </View>
          <Text style={styles.cardSub}>Based on quiz performance across all categories</Text>
        </View>

        {/* Learning progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Learning Progress</Text>
          <View style={styles.progressHeader}>
            <Text style={styles.progressPct}>{learningProgress}%</Text>
            <Text style={styles.progressSub}>15-Week Curriculum</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${learningProgress}%`, backgroundColor: '#34C759' }]} />
          </View>
          <Text style={styles.cardSub}>Week {Math.ceil(learningProgress / 100 * 15)} of 15 in progress</Text>
        </View>

        {/* Speed / ice time stats */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.loadingText}>Loading speed stats...</Text>
          </View>
        ) : speedData ? (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderTopColor: Colors.accent }]}>
                <Text style={styles.statIcon}>⚡</Text>
                <Text style={styles.statValue}>{speedData.overall.avg_speed_kmh}</Text>
                <Text style={styles.statUnit}>km/h avg</Text>
                <Text style={styles.statLabel}>Avg Speed</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: '#FF3B30' }]}>
                <Text style={styles.statIcon}>🚀</Text>
                <Text style={styles.statValue}>{speedData.overall.max_speed_kmh}</Text>
                <Text style={styles.statUnit}>km/h</Text>
                <Text style={styles.statLabel}>Top Speed</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: '#34C759' }]}>
                <Text style={styles.statIcon}>📏</Text>
                <Text style={styles.statValue}>{speedData.overall.total_distance_km}</Text>
                <Text style={styles.statUnit}>km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>

            {/* Per-period breakdown */}
            {speedData.per_period.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Period Breakdown</Text>
                <View style={styles.periodList}>
                  {speedData.per_period.map(p => (
                    <View key={p.period} style={styles.periodRow}>
                      <Text style={styles.periodLabel}>P{p.period}</Text>
                      <View style={styles.periodBar}>
                        <View style={[
                          styles.periodBarFill,
                          { width: `${Math.min((p.avg_speed_kmh / 30) * 100, 100)}%` },
                        ]} />
                      </View>
                      <Text style={styles.periodValue}>{p.avg_speed_kmh} km/h</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Upload your game to see your stats</Text>
            <Text style={styles.emptySub}>
              {jerseyNumber
                ? 'Analyze a game video to get personal speed & ice time stats.'
                : 'Set your jersey number in Profile to get personalized stats.'}
            </Text>
          </View>
        )}

        {/* Ice time (static) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Ice Time</Text>
          <View style={styles.iceTimeRow}>
            {[
              { game: 'vs Falcons', time: '18:42', shifts: 14 },
              { game: 'vs Wolves', time: '16:08', shifts: 12 },
              { game: 'Practice', time: '22:15', shifts: 18 },
            ].map(g => (
              <View key={g.game} style={styles.iceTimeCard}>
                <Text style={styles.iceTimeGame}>{g.game}</Text>
                <Text style={styles.iceTimeVal}>{g.time}</Text>
                <Text style={styles.iceTimeSub}>{g.shifts} shifts</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8, gap: 2 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 14, color: Colors.accent, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.subtext },
  iqRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iqScore: { fontSize: 48, fontWeight: '800', color: Colors.accent },
  iqBadge: {
    backgroundColor: Colors.accent + '22', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.accent + '55',
  },
  iqBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  progressBarBg: {
    height: 8, borderRadius: 4,
    backgroundColor: Colors.input, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressPct: { fontSize: 28, fontWeight: '800', color: '#34C759' },
  progressSub: { fontSize: 13, color: Colors.subtext },
  loadingCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 32, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  loadingText: { fontSize: 13, color: Colors.subtext },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: Colors.border,
    borderTopWidth: 3,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statUnit: { fontSize: 10, color: Colors.subtext },
  statLabel: { fontSize: 11, color: Colors.subtext, marginTop: 2 },
  periodList: { gap: 10 },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodLabel: { fontSize: 13, fontWeight: '700', color: Colors.subtext, width: 24 },
  periodBar: {
    flex: 1, height: 8, borderRadius: 4,
    backgroundColor: Colors.input, overflow: 'hidden',
  },
  periodBarFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.accent },
  periodValue: { fontSize: 12, color: Colors.text, fontWeight: '600', width: 72, textAlign: 'right' },
  emptyCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 40, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.subtext, textAlign: 'center', lineHeight: 18 },
  iceTimeRow: { flexDirection: 'row', gap: 8 },
  iceTimeCard: {
    flex: 1, backgroundColor: Colors.input, borderRadius: 10,
    padding: 12, alignItems: 'center', gap: 2,
  },
  iceTimeGame: { fontSize: 10, color: Colors.subtext, textAlign: 'center' },
  iceTimeVal: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  iceTimeSub: { fontSize: 10, color: Colors.subtext },
});
