/**
 * Journal screen — weekly insights + recent sensory log entries.
 *
 * Visual style matches Figma Journal.tsx:
 * - Frosted glass cards (rgba white, border, shadow)
 * - Fredoka font (falls back to system until Person C loads it)
 * - Risk score circles with color coding
 * - AI Insights section from WeeklySummary.tsx
 *
 * Data sources:
 * - generate-insights Edge Function (weekly AI insights, cached)
 * - ratings table (recent log entries)
 * - user_activity table (streak count)
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, SafeAreaView,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { dbToLabel } from '../../lib/sensoryUtils';
import { ScaledText } from '../../components/shared/ScaledText';

interface Insight {
  text: string;
  type: 'pattern' | 'wellbeing' | 'streak' | 'prompt';
}

interface LogEntry {
  id: string;
  time: string;
  title: string;
  detail: string;
  risk: number;
}

function riskColor(risk: number): string {
  if (risk > 75) return '#EC7D6E';
  if (risk > 55) return '#F2B85B';
  return '#46B7AE';
}

function insightIcon(type: string): string {
  switch (type) {
    case 'pattern': return '🧠';
    case 'wellbeing': return '💚';
    case 'streak': return '🌱';
    default: return '✨';
  }
}

export function JournalScreen() {
  const { user } = useAuthStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch insights from Edge Function (cached weekly)
    try {
      const { data } = await supabase.functions.invoke('generate-insights', { body: {} });
      if (data?.insights) setInsights(data.insights);
    } catch {
      // Silently fail — show empty insights section
    }

    // Fetch recent ratings as log entries
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: ratings } = await supabase
      .from('ratings')
      .select('id, noise_db, crowding, lighting, time_of_day, created_at, venue_id')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (ratings && ratings.length > 0) {
      // Get venue names for the ratings
      const venueIds = [...new Set(ratings.map(r => r.venue_id).filter(Boolean))];
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name')
        .in('id', venueIds);

      const venueMap = new Map(venues?.map(v => [v.id, v.name]) ?? []);

      const entries: LogEntry[] = ratings.map(r => {
        const noiseRisk = r.noise_db ? Math.min(100, Math.round(((r.noise_db - 30) / 70) * 100)) : 0;
        const crowdRisk = r.crowding ? (r.crowding / 5) * 100 : 0;
        const risk = Math.round(noiseRisk * 0.6 + crowdRisk * 0.4);

        const date = new Date(r.created_at);
        const timeStr = date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
          date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return {
          id: r.id,
          time: timeStr,
          title: venueMap.get(r.venue_id) ?? 'Unknown venue',
          detail: r.noise_db ? `${r.noise_db} dB — ${dbToLabel(r.noise_db)}` : 'Manual rating',
          risk,
        };
      });

      setLogs(entries);
    }

    // Fetch streak
    const { data: activity } = await supabase
      .from('user_activity')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (activity) {
      const days = new Set(activity.map(a => a.created_at.split('T')[0]));
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (days.has(d.toISOString().split('T')[0])) {
          count++;
        } else {
          break;
        }
      }
      setStreak(count);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <ScaledText style={styles.heading}>Journal</ScaledText>
            <ScaledText style={styles.subtitle}>Recent sensory moments</ScaledText>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <ScaledText style={styles.streakText}>🌱 {streak} day{streak !== 1 ? 's' : ''}</ScaledText>
            </View>
          )}
        </View>

        {/* AI Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsCard}>
            <ScaledText style={styles.insightsTitle}>✦ AI Insights</ScaledText>
            {insights.map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <ScaledText style={styles.insightIcon}>{insightIcon(insight.type)}</ScaledText>
                <ScaledText style={styles.insightText}>{insight.text}</ScaledText>
              </View>
            ))}
          </View>
        )}

        {/* Log entries */}
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <ScaledText style={styles.emptyIcon}>📓</ScaledText>
            <ScaledText style={styles.emptyTitle}>No entries yet</ScaledText>
            <ScaledText style={styles.emptyBody}>
              Log an environment from the Map or Sense tab to start building your journal.
            </ScaledText>
          </View>
        ) : (
          <View style={styles.logList}>
            {logs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logContent}>
                  <ScaledText style={styles.logTime}>{log.time}</ScaledText>
                  <ScaledText style={styles.logTitle}>{log.title}</ScaledText>
                  <ScaledText style={styles.logDetail}>{log.detail}</ScaledText>
                </View>
                <View style={[styles.riskCircle, {
                  borderColor: riskColor(log.risk),
                  backgroundColor: riskColor(log.risk) + '18',
                }]}>
                  <ScaledText style={[styles.riskValue, { color: riskColor(log.risk) }]}>
                    {log.risk}%
                  </ScaledText>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.45)',
  borderWidth: 2,
  borderColor: 'rgba(35,88,105,0.35)',
  borderRadius: 24,
  shadowColor: '#43818F',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 24,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heading: {
    fontSize: 30,
    fontWeight: '600',
    color: '#183844',
  },
  subtitle: {
    color: '#426773',
    fontSize: 13,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: '#46B7AE22',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#46B7AE44',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#46B7AE',
  },

  // AI Insights card
  insightsCard: {
    ...CARD_STYLE,
    backgroundColor: 'rgba(240,250,251,0.8)',
    borderColor: 'rgba(79,179,191,0.3)',
    padding: 16,
    gap: 10,
  },
  insightsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#183844',
    marginBottom: 2,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightIcon: { fontSize: 16, marginTop: 1 },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#426773',
    lineHeight: 20,
  },

  // Log entries
  logList: { gap: 12 },
  logCard: {
    ...CARD_STYLE,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logContent: { flex: 1, minWidth: 0 },
  logTime: {
    color: '#5d7b86',
    fontSize: 11,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#183844',
    marginVertical: 3,
  },
  logDetail: {
    color: '#426773',
    fontSize: 13,
  },
  riskCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskValue: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#183844',
  },
  emptyBody: {
    color: '#7AABB5',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
