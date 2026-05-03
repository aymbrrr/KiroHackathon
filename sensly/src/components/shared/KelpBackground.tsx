/**
 * Kelp background — full-screen watercolor kelp image behind all content.
 * Wrap any screen content with this for the underwater theme.
 *
 * source defaults to kelp_2 (original). Pass kelpBG2 for the new asset.
 */
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

// @ts-ignore
const kelpBottom = require('../../../assets/kelp_2.png');
// @ts-ignore
const kelpBG2 = require('../../../assets/kelpBG2.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface KelpBackgroundProps {
  children: React.ReactNode;
  opacity?: number;
  variant?: 'kelp1' | 'kelp2';
}

export function KelpBackground({ children, opacity = 0.35, variant = 'kelp1' }: KelpBackgroundProps) {
  const source = variant === 'kelp2' ? kelpBG2 : kelpBottom;

  return (
    <View style={styles.container}>
      <Image
        source={source}
        style={[styles.bgImage, { opacity }]}
        resizeMode="contain"
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 0,
  },
});
