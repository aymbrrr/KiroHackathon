/**
 * 5-axis sensory radar chart — custom SVG implementation.
 * Does not use victory-native (v41 uses Skia API, incompatible with old VictoryChart).
 *
 * Axes: Noise, Lighting, Crowding, Smell, Predictability (all 1–5 scale).
 * Higher score = more stimulating = larger polygon.
 * Self mode: shows only 3 axes (noise, lighting, crowding).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
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

function polarPoint(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export function SensoryRadar({ venue, selfMode = false, size = 240 }: SensoryRadarProps) {
  const axes = selfMode ? SELF_AXES : ALL_AXES;
  const n = axes.length;
  // Add padding around the SVG so labels don't clip
  const padding = 36;
  const svgSize = size + padding * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const maxR = size * 0.35;
  const labelR = size * 0.46;

  const noiseScore = venue.avg_noise_db != null ? dbToScore(venue.avg_noise_db) : null;

  const scores: Record<string, number> = {
    noise:          noiseScore ?? 0,
    lighting:       venue.avg_lighting ?? 0,
    crowding:       venue.avg_crowding ?? 0,
    smell:          venue.avg_smell ?? 0,
    predictability: venue.avg_predictability ?? 0,
  };

  const hasData = venue.total_ratings > 0;

  // Angle for each axis (start from top, go clockwise)
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  // Grid rings at 1, 2, 3, 4, 5
  const rings = [1, 2, 3, 4, 5];

  // Data polygon points
  const dataPoints = axes.map((axis, i) => {
    const angle = startAngle + i * angleStep;
    const score = scores[axis.key] ?? 0;
    const r = (score / 5) * maxR;
    return polarPoint(cx, cy, r, angle);
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid ring polygons
  const ringPolygons = rings.map((ring) => {
    const pts = axes.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const r = (ring / 5) * maxR;
      return polarPoint(cx, cy, r, angle);
    });
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  });

  if (!hasData) {
    return (
      <View style={[styles.placeholder, { height: size * 0.4 }]}>
        <Text style={styles.placeholderText}>No ratings yet — be the first!</Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={svgSize} height={svgSize}>
        {/* Grid rings */}
        {ringPolygons.map((pts, i) => (
          <Polygon
            key={i}
            points={pts}
            fill="none"
            stroke={colors.borderMuted}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const angle = startAngle + i * angleStep;
          const end = polarPoint(cx, cy, maxR, angle);
          return (
            <Line
              key={i}
              x1={cx} y1={cy}
              x2={end.x} y2={end.y}
              stroke={colors.borderMuted}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPolygon}
          fill={colors.primary + '33'}
          stroke={colors.primary}
          strokeWidth={2}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.primary} />
        ))}

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const angle = startAngle + i * angleStep;
          const lp = polarPoint(cx, cy, labelR, angle);
          const textAnchor =
            Math.abs(lp.x - cx) < 5 ? 'middle' :
            lp.x < cx ? 'end' : 'start';
          return (
            <SvgText
              key={i}
              x={lp.x}
              y={lp.y + 4}
              textAnchor={textAnchor}
              fontSize={11}
              fill={colors.textSecondary}
              fontWeight="500"
            >
              {axis.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    width: '100%',
  },
  placeholderText: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
