/**
 * 5-axis sensory radar chart using victory-native.
 * Axes: Noise, Lighting, Crowding, Smell, Predictability
 * All scores on 1–5 scale. Higher = more stimulating.
 *
 * Colorblind-safe: uses the primary blue fill, not red/green.
 * Self mode: shows only 3 axes (noise, lighting, crowding).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryChart, VictoryPolarAxis, VictoryArea, VictoryTheme } from 'victory-native';
import { colors, typography, spacing } from '../../constants/theme';
import { Venue } from '../../stores/venueStore';
import { dbToScore } from '../../lib/sensoryUtils';

interface SensoryRadarProps {
  venue: Venue;
  selfMode?: boolean;
  size?: number;
}

const ALL_AXES = [
  { key: 'noise',          label: 'Noise' },
  { key: 'lighting',       label: 'Lighting' },
  { key: 'crowding',       label: 'Crowding' },
  { key: 'smell',          label: 'Smell' },
  { key: 'predictability', label: 'Predictability' },
];

const SELF_AXES = [
  { key: 'noise',    label: 'Noise' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'crowding', label: 'Crowding' },
];

export function SensoryRadar({ venue, selfMode = false, size = 260 }: SensoryRadarProps) {
  const axes = selfMode ? SELF_AXES : ALL_AXES;

  const noiseScore = venue.avg_noise_db != null ? dbToScore(venue.avg_noise_db) : null;

  const scores: Record<string, number> = {
    noise:          noiseScore ?? 3,
    lighting:       venue.avg_lighting ?? 3,
    crowding:       venue.avg_crowding ?? 3,
    smell:          venue.avg_smell ?? 3,
    predictability: venue.avg_predictability ?? 3,
  };

  const hasData = venue.total_ratings > 0;

  const data = axes.map((axis) => ({
    x: axis.label,
    y: scores[axis.key],
  }));

  if (!hasData) {
    return (
      <View style={[styles.placeholder, { width: size, height: size / 2 }]}>
        <Text style={styles.placeholderText}>No ratings yet — be the first!</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, alignSelf: 'center' }}>
      <VictoryChart
        polar
        width={size}
        height={size}
        theme={VictoryTheme.clean}
        domain={{ y: [0, 5] }}
      >
        {axes.map((axis) => (
          <VictoryPolarAxis
            key={axis.key}
            dependentAxis={false}
            axisValue={axis.label}
            label={axis.label}
            labelPlacement="perpendicular"
            style={{
              axisLabel: {
                fill: colors.textSecondary,
                fontSize: 11,
                fontWeight: '500',
              },
              axis: { stroke: colors.borderMuted },
              grid: { stroke: colors.borderMuted, strokeDasharray: '4,4' },
            }}
          />
        ))}
        <VictoryPolarAxis
          dependentAxis
          tickValues={[1, 2, 3, 4, 5]}
          style={{
            axis: { stroke: 'none' },
            tickLabels: { fill: 'none' },
            grid: { stroke: colors.borderMuted, strokeDasharray: '2,4' },
          }}
        />
        <VictoryArea
          data={data}
          style={{
            data: {
              fill: colors.primary + '33',
              stroke: colors.primary,
              strokeWidth: 2,
            },
          }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
  },
  placeholderText: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
