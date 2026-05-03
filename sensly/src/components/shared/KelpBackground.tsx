/**
 * Kelp background — full-screen watercolor kelp image behind all content.
 * Wrap any screen content with this for the underwater theme.
 */
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

// @ts-ignore
import kelpBg from '../../../assets/background_kelp.png';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface KelpBackgroundProps {
  children: React.ReactNode;
  opacity?: number;
}

export function KelpBackground({ children, opacity = 0.35 }: KelpBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Full-screen kelp background image */}
      <Image
        source={kelpBg}
        style={[styles.bgImage, { opacity }]}
        resizeMode="contain"
        pointerEvents="none"
      />

      {/* Content on top */}
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
