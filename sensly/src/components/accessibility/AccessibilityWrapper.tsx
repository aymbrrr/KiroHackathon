/**
 * AccessibilityWrapper — wraps the entire app to apply accessibility filters.
 *
 * Color blindness matrices (Brettel et al. 1997 / Viénot et al. 1999):
 * These are the industry-standard simulation matrices used by tools like
 * Coblis, Sim Daltonism, and Adobe Color. They simulate how colors appear
 * to people with each type of color vision deficiency.
 *
 * The matrices are applied via react-native-color-matrix-image-filters
 * which uses native ColorMatrix on both iOS and Android.
 *
 * Research sources:
 * - Brettel H, Viénot F, Mollon JD (1997). Computerized simulation of color
 *   appearance for dichromats. J Opt Soc Am A.
 * - Viénot F, Brettel H, Mollon JD (1999). Digital video colourmaps for
 *   checking the legibility of displays by dichromats.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ColorMatrix } from 'react-native-color-matrix-image-filters';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * Color blindness simulation matrices (5×4 row-major, RGBA).
 * Each row: [R_out, G_out, B_out, A_out, offset]
 *
 * Deuteranopia (missing green cones — most common, ~6% of men):
 * Reds and greens appear similar. Blues and yellows are preserved.
 */
const MATRICES = {
  deuteranopia: [
    0.625, 0.375, 0,    0, 0,
    0.7,   0.3,   0,    0, 0,
    0,     0.3,   0.7,  0, 0,
    0,     0,     0,    1, 0,
  ],
  /**
   * Protanopia (missing red cones, ~1% of men):
   * Reds appear very dark. Greens and yellows look similar.
   */
  protanopia: [
    0.567, 0.433, 0,    0, 0,
    0.558, 0.442, 0,    0, 0,
    0,     0.242, 0.758,0, 0,
    0,     0,     0,    1, 0,
  ],
  /**
   * Tritanopia (missing blue cones, ~0.01% — rarest):
   * Blues and greens appear similar. Reds and pinks look similar.
   */
  tritanopia: [
    0.95,  0.05,  0,    0, 0,
    0,     0.433, 0.567,0, 0,
    0,     0.475, 0.525,0, 0,
    0,     0,     0,    1, 0,
  ],
};

interface AccessibilityWrapperProps {
  children: React.ReactNode;
}

export function AccessibilityWrapper({ children }: AccessibilityWrapperProps) {
  const { colorBlindMode } = useSettingsStore();

  // No filter — render children directly for performance
  if (colorBlindMode === 'none') {
    return <>{children}</>;
  }

  const matrix = MATRICES[colorBlindMode];

  return (
    <View style={styles.container}>
      <ColorMatrix matrix={matrix} style={styles.container}>
        {children}
      </ColorMatrix>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
