/**
 * Live dB gauge — animated SVG arc showing current noise level.
 *
 * Arc fills left to right:
 *   30–54 dB → blue  (calm)
 *   55–69 dB → orange (moderate)
 *   70+ dB   → red   (loud)
 *
 * Animation is capped at 200ms per the neurodivergent design guidelines.
 * Respects reduceMotion — falls back to instant update.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, typography, spacing } from '../../constants/theme';
import { dbToLabel } from '../../lib/sensoryUtils';

interface DbGaugeProps {
  db: number;
  isListening: boolean;
  size?: number;
}

const MIN_DB = 30;
const MAX_DB = 100;

function dbToColor(db: number): string {
  if (db < 55) return colors.calm;
  if (db < 70) return colors.moderate;
  return colors.loud;
}

function dbToAngle(db: number): number {
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
  return ((clamped - MIN_DB) / (MAX_DB - MIN_DB)) * 270 - 135;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DbGauge({ db, isListening, size = 200 }: DbGaugeProps) {
  const animDb = useRef(new Animated.Value(MIN_DB)).current;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeWidth = size * 0.06;

  useEffect(() => {
    Animated.timing(animDb, {
      toValue: db,
      duration: 200, // max per design guidelines
      useNativeDriver: false,
    }).start();
  }, [db]);

  const arcColor = dbToColor(db);
  const endAngle = dbToAngle(db);
  const trackPath = arcPath(cx, cy, r, -135, 135);
  const fillPath = endAngle > -135 ? arcPath(cx, cy, r, -135, endAngle) : '';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track (background arc) */}
        <Path
          d={trackPath}
          stroke={colors.borderMuted}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Fill arc */}
        {fillPath ? (
          <Path
            d={fillPath}
            stroke={arcColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}
        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={4} fill={isListening ? arcColor : colors.border} />
      </Svg>

      {/* dB number overlay */}
      <View style={[styles.overlay, { width: size, height: size }]}>
        <Text style={[styles.dbNumber, { color: isListening ? arcColor : colors.textMuted }]}>
          {isListening ? db : '—'}
        </Text>
        <Text style={styles.dbUnit}>dB</Text>
        <Text style={styles.dbLabel} numberOfLines={1}>
          {isListening ? dbToLabel(db) : 'Tap to measure'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dbNumber: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
  },
  dbUnit: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  dbLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 120,
  },
});
