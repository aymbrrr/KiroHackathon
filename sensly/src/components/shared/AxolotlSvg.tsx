/**
 * Axolotl mascot — uses the custom watercolor PNG.
 * Keeps the same interface (mood, size, animate) so all existing imports work.
 * The mood affects a subtle tint overlay and the idle bob animation.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Image, View, StyleSheet } from 'react-native';

// @ts-ignore — PNG import
import axolotlImage from '../../../assets/axolotl_updated.png';

export type AxolotlMood = 'happy' | 'thinking' | 'alert' | 'stressed' | 'relieved';

interface AxolotlSvgProps {
  mood?: AxolotlMood;
  size?: number;
  animate?: boolean;
}

const MOOD_TINTS: Record<AxolotlMood, string> = {
  happy:    'rgba(70, 183, 174, 0.08)',   // subtle teal glow
  thinking: 'rgba(242, 184, 91, 0.12)',   // subtle amber
  alert:    'rgba(242, 184, 91, 0.18)',   // stronger amber
  stressed: 'rgba(236, 125, 110, 0.15)',  // subtle coral
  relieved: 'rgba(70, 183, 174, 0.12)',   // subtle teal
};

export function AxolotlSvg({ mood = 'happy', size = 120, animate = true }: AxolotlSvgProps) {
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) {
      bobAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animate]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ translateY: bobAnim }],
        },
      ]}
    >
      <Image
        source={axolotlImage}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
      {/* Mood tint overlay */}
      <View
        style={[
          styles.tintOverlay,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: MOOD_TINTS[mood],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    // PNG has transparent background — renders cleanly
  },
  tintOverlay: {
    position: 'absolute',
  },
});
