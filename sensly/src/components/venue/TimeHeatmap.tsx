/**
 * Time heatmap — shows noise levels by day × time-of-day.
 * Darker = louder. Helps users find the quietest time to visit.
 *
 * Data comes from ratings grouped by day_of_week + time_of_day.
 * Falls back to "No data yet" if fewer than 3 ratings exist.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';

interface TimeHeatmapProps {
  ratings: Array<{
    day_of_week: number | null;
    time_of_day: string | null;
    noise_db: number | null;
  }>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['morning', 'afternoon', 'evening', 'night'];
const TIME_LABELS: Record<string, string> = {
  morning: 'AM',
  afternoon: 'PM',
  evening: 'Eve',
  night: 'Night',
};

function noiseToOpacity(db: number | null): number {
  if (db == null) return 0;
  // 30 dB → 0.1 opacity, 90 dB → 0.9 opacity
  return Math.max(0.08, Math.min(0.9, (db - 30) / 70));
}

export function TimeHeatmap({ ratings }: TimeHeatmapProps) {
  if (ratings.length < 3) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Not enough ratings yet to show time patterns
        </Text>
      </View>
    );
  }

  // Build a day × time grid of average noise
  const grid: Record<string, number[]> = {};
  ratings.forEach((r) => {
    if (r.day_of_week == null || r.time_of_day == null || r.noise_db == null) return;
    const key = `${r.day_of_week}-${r.time_of_day}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(r.noise_db);
  });

  const avgGrid: Record<string, number | null> = {};
  Object.entries(grid).forEach(([key, vals]) => {
    avgGrid[key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });

  // Find quietest slot
  let quietestKey = '';
  let quietestDb = Infinity;
  Object.entries(avgGrid).forEach(([key, db]) => {
    if (db != null && db < quietestDb) { quietestDb = db; quietestKey = key; }
  });

  const [quietDay, quietTime] = quietestKey.split('-');
  const quietLabel = quietestKey
    ? `Best time: ${DAYS[parseInt(quietDay)]} ${TIME_LABELS[quietTime] ?? quietTime}`
    : null;

  return (
    <View style={styles.container}>
      {quietLabel && (
        <Text style={styles.bestTime}>🕐 {quietLabel}</Text>
      )}
      <View style={styles.grid}>
        {/* Time labels column */}
        <View style={styles.timeLabels}>
          <View style={styles.cornerCell} />
          {TIMES.map((t) => (
            <View key={t} style={styles.timeLabel}>
              <Text style={styles.timeLabelText}>{TIME_LABELS[t]}</Text>
            </View>
          ))}
        </View>

        {/* Day columns */}
        {DAYS.map((day, dayIdx) => (
          <View key={day} style={styles.dayColumn}>
            <Text style={styles.dayLabel}>{day}</Text>
            {TIMES.map((time) => {
              const key = `${dayIdx}-${time}`;
              const db = avgGrid[key] ?? null;
              const opacity = noiseToOpacity(db);
              return (
                <View
                  key={time}
                  style={[
                    styles.cell,
                    { backgroundColor: `rgba(204, 51, 17, ${opacity})` },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Quiet</Text>
        <View style={styles.legendBar}>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
            <View
              key={o}
              style={[styles.legendCell, { backgroundColor: `rgba(204, 51, 17, ${o})` }]}
            />
          ))}
        </View>
        <Text style={styles.legendText}>Loud</Text>
      </View>
    </View>
  );
}

const CELL_SIZE = 28;

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  bestTime: { ...typography.bodySm, color: colors.primary, fontWeight: '600' },
  grid: { flexDirection: 'row', gap: 2 },
  timeLabels: { gap: 2 },
  cornerCell: { height: 20 },
  timeLabel: {
    height: CELL_SIZE,
    justifyContent: 'center',
    paddingRight: spacing.xs,
  },
  timeLabelText: { ...typography.bodySm, color: colors.textMuted, fontSize: 10 },
  dayColumn: { flex: 1, gap: 2, alignItems: 'center' },
  dayLabel: { ...typography.bodySm, color: colors.textMuted, fontSize: 10, height: 20 },
  cell: {
    width: '100%',
    height: CELL_SIZE,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
  },
  placeholder: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
  },
  placeholderText: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center' },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  legendBar: { flexDirection: 'row', gap: 2 },
  legendCell: { width: 16, height: 10, borderRadius: 2 },
  legendText: { ...typography.bodySm, color: colors.textMuted, fontSize: 10 },
});
