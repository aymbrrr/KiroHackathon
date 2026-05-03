/**
 * ScaledText — drop-in replacement for <Text> that respects
 * the user's text size and dyslexia mode settings.
 *
 * Usage: import { ScaledText as Text } from '@/components/shared/ScaledText'
 *
 * The component multiplies the fontSize in the style prop by the user's
 * chosen scale factor, and applies OpenDyslexic font when dyslexia mode is on.
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAccessibility } from '../../contexts/AccessibilityContext';

export function ScaledText({ style, children, ...props }: TextProps) {
  const { fontScale, fontFamily, letterSpacing } = useAccessibility();

  // Flatten the style to read fontSize
  const flat = StyleSheet.flatten(style) ?? {};
  const baseFontSize = (flat as any).fontSize;

  const scaledStyle = {
    ...(fontFamily ? { fontFamily } : {}),
    ...(letterSpacing ? { letterSpacing } : {}),
    ...(baseFontSize ? { fontSize: baseFontSize * fontScale } : {}),
  };

  return (
    <Text style={[style, scaledStyle]} {...props}>
      {children}
    </Text>
  );
}
