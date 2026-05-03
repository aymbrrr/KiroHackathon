/**
 * ScaledText — drop-in replacement for <Text> that respects
 * the user's text size setting from AccessibilityContext.
 *
 * Usage: import { ScaledText as Text } from '@/components/shared/ScaledText'
 * Then use exactly like <Text> — all props are forwarded.
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAccessibility } from '../../contexts/AccessibilityContext';

export function ScaledText({ style, children, ...props }: TextProps) {
  const { fontScale } = useAccessibility();

  const flat = StyleSheet.flatten(style) ?? {};
  const baseFontSize = (flat as any).fontSize;

  const scaledStyle = baseFontSize
    ? { fontSize: baseFontSize * fontScale }
    : {};

  return (
    <Text style={[style, scaledStyle]} {...props}>
      {children}
    </Text>
  );
}
