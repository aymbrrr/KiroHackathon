/**
 * Visual 1–5 sensory rating slider.
 * Large tap targets (min 48dp) for Self mode accessibility.
 * Each level has an icon + short label — never color-only.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { ScaledText } from '../shared/ScaledText';

export interface SliderOption {
  value: number;
  icon: string;
  label: string;
}

interface SensorySliderProps {
  label: string;
  options: SliderOption[];
  value: number | null;
  onChange: (value: number) => void;
}

export function SensorySlider({ label, options, value, onChange }: SensorySliderProps) {
  return (
    <View style={styles.container}>
      <ScaledText style={styles.label}>{label}</ScaledText>
      <View style={styles.options}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label}: ${opt.label}`}
            >
              <ScaledText style={styles.optionIcon}>{opt.icon}</ScaledText>
              <ScaledText style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {opt.label}
              </ScaledText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    ...frostedCard,
    minHeight: 64,
    gap: 4,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionIcon: { fontSize: 20 },
  optionLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 11,
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
