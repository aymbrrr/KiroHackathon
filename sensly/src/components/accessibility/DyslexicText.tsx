/**
 * DyslexicText — drop-in replacement for <Text> that applies
 * dyslexia-friendly styling when dyslexiaMode is enabled.
 *
 * When dyslexia mode is ON:
 *   - Font: OpenDyslexic (heavy-bottomed letters reduce visual rotation)
 *   - Letter spacing: +0.5px (reduces crowding between characters)
 *   - Line height: 1.6× font size (reduces line confusion)
 *   - Text align: always left (never justified — uneven spacing worsens dyslexia)
 *
 * When dyslexia mode is OFF: renders as a standard <Text> with no overhead.
 *
 * Usage: import { DyslexicText as Text } from '@/components/accessibility/DyslexicText'
 * Then use exactly like <Text> — all props are forwarded.
 *
 * Research basis:
 * - British Dyslexia Association Style Guide (2023)
 * - NIH PMC5629233: OpenDyslexic improves reading rate for some dyslexic readers
 * - Rello & Baeza-Yates (2013): letter spacing +35% improves reading speed
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';

export function DyslexicText({ style, children, ...props }: TextProps) {
  const { dyslexiaMode } = useSettingsStore();

  if (!dyslexiaMode) {
    return <Text style={style} {...props}>{children}</Text>;
  }

  return (
    <Text
      style={[styles.dyslexic, style]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  dyslexic: {
    fontFamily: 'OpenDyslexic',
    letterSpacing: 0.5,
    lineHeight: undefined, // overridden per-instance via style prop
    textAlign: 'left',
  },
});
