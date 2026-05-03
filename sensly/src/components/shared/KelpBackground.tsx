/**
 * Kelp background — full-screen watercolor kelp image behind all content.
 * Wrap any screen content with this for the underwater theme.
 */
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

// @ts-ignore
import kelpBottom from '../../../assets/kelp_2.png';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface KelpBackgroundProps {
  children: React.ReactNode;
  opacity?: number;
}

export function KelpBackground({ children, opacity = 0.3 }: KelpBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Full-screen kelp background image */}
      <Image
        source={kelpBottom}
        style={[styles.bgImage, { opacity }]}
        resizeMode="cover"
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
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.45,
    zIndex: 0,
  },
});
