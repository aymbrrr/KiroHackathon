/**
 * Kelp background — watercolor kelp images positioned at top and bottom of screen.
 * Wrap any screen content with this for the underwater theme.
 */
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

// @ts-ignore
import kelpTop from '../../../assets/kelp_1.png';
// @ts-ignore
import kelpBottom from '../../../assets/kelp_2.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface KelpBackgroundProps {
  children: React.ReactNode;
  showTop?: boolean;
  showBottom?: boolean;
}

export function KelpBackground({ children, showTop = false, showBottom = true }: KelpBackgroundProps) {
  return (
    <View style={styles.container}>
      {children}

      {/* Top kelp — positioned at top-right, flipped */}
      {showTop && (
        <Image
          source={kelpTop}
          style={styles.kelpTop}
          resizeMode="contain"
          pointerEvents="none"
        />
      )}

      {/* Bottom kelp — positioned at bottom */}
      {showBottom && (
        <Image
          source={kelpBottom}
          style={styles.kelpBottom}
          resizeMode="contain"
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  kelpTop: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    opacity: 0.4,
    transform: [{ scaleX: -1 }],
  },
  kelpBottom: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.45,
    opacity: 0.35,
  },
});
