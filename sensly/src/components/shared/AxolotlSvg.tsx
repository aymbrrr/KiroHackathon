import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Ellipse, Path, Circle, Rect } from 'react-native-svg';

export type AxolotlMood = 'happy' | 'thinking' | 'alert' | 'stressed' | 'relieved';

interface AxolotlSvgProps {
  mood?: AxolotlMood;
  size?: number;
  animate?: boolean;
}

// Face definitions in 160×128 base coordinate space
const FACES: Record<AxolotlMood, {
  leftEyeRx: number; leftEyeRy: number;
  rightEyeRx: number; rightEyeRy: number;
  mouth: string;
  leftBrow: string | null;
  rightBrow: string | null;
}> = {
  happy: {
    leftEyeRx: 6, leftEyeRy: 6,
    rightEyeRx: 6, rightEyeRy: 6,
    mouth: 'M 64,80 Q 80,96 96,80',
    leftBrow: null,
    rightBrow: null,
  },
  relieved: {
    leftEyeRx: 7, leftEyeRy: 3.5,
    rightEyeRx: 7, rightEyeRy: 3.5,
    mouth: 'M 64,80 Q 80,95 96,80',
    leftBrow: null,
    rightBrow: null,
  },
  thinking: {
    leftEyeRx: 6, leftEyeRy: 6,
    rightEyeRx: 7, rightEyeRy: 4,
    mouth: 'M 68,82 Q 80,90 92,82',
    leftBrow: 'M 43,57 Q 53,52 63,55',
    rightBrow: 'M 97,55 Q 107,52 117,57',
  },
  alert: {
    leftEyeRx: 8, leftEyeRy: 8,
    rightEyeRx: 8, rightEyeRy: 8,
    mouth: 'M 73,82 Q 80,91 87,82',
    leftBrow: 'M 42,52 Q 53,48 63,52',
    rightBrow: 'M 97,52 Q 107,48 118,52',
  },
  stressed: {
    leftEyeRx: 6, leftEyeRy: 7,
    rightEyeRx: 6, rightEyeRy: 7,
    mouth: 'M 64,87 Q 80,73 96,87',
    leftBrow: 'M 42,57 Q 53,63 63,57',
    rightBrow: 'M 97,57 Q 107,63 118,57',
  },
};

export function AxolotlSvg({ mood = 'happy', size = 128, animate = true }: AxolotlSvgProps) {
  const s = size / 128;
  const w = 160 * s;
  const h = 128 * s;
  const face = FACES[mood] ?? FACES.happy;

  // Idle bob animation: -5px to 0, 3.8s loop
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) {
      bobAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -5 * s,
          duration: 1900,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate, s]);

  // Gill frond helpers — positions in base coords, scaled
  const px = (n: number) => n * s;

  return (
    <Animated.View
      style={{
        width: w,
        height: h,
        flexShrink: 0,
        transform: [{ translateY: bobAnim }],
      }}
    >
      {/* ── Left gill fronds ── */}
      {/* Soft blob */}
      <View style={{
        position: 'absolute',
        left: px(3), top: px(36),
        height: px(64), width: px(80),
        borderRadius: px(40),
        backgroundColor: '#ffa8a8',
        opacity: 0.7,
        transform: [{ rotate: '-12deg' }],
      }} />
      {/* Horizontal bar */}
      <View style={{
        position: 'absolute',
        left: 0, top: px(48),
        height: px(20), width: px(64),
        borderRadius: 9999,
        backgroundColor: '#ff9e9e',
      }} />
      {/* Upper angled */}
      <View style={{
        position: 'absolute',
        left: px(4), top: px(28),
        height: px(20), width: px(64),
        borderRadius: 9999,
        backgroundColor: '#ffabab',
        transform: [{ rotate: '-24deg' }],
      }} />
      {/* Lower angled */}
      <View style={{
        position: 'absolute',
        left: px(12), top: px(70),
        height: px(20), width: px(56),
        borderRadius: 9999,
        backgroundColor: '#ffabab',
        transform: [{ rotate: '18deg' }],
      }} />

      {/* ── Right gill fronds ── */}
      {/* Soft blob */}
      <View style={{
        position: 'absolute',
        right: px(3), top: px(36),
        height: px(64), width: px(80),
        borderRadius: px(40),
        backgroundColor: '#ffa8a8',
        opacity: 0.7,
        transform: [{ rotate: '12deg' }],
      }} />
      {/* Horizontal bar */}
      <View style={{
        position: 'absolute',
        right: 0, top: px(48),
        height: px(20), width: px(64),
        borderRadius: 9999,
        backgroundColor: '#ff9e9e',
      }} />
      {/* Upper angled */}
      <View style={{
        position: 'absolute',
        right: px(4), top: px(28),
        height: px(20), width: px(64),
        borderRadius: 9999,
        backgroundColor: '#ffabab',
        transform: [{ rotate: '24deg' }],
      }} />
      {/* Lower angled */}
      <View style={{
        position: 'absolute',
        right: px(12), top: px(70),
        height: px(20), width: px(56),
        borderRadius: 9999,
        backgroundColor: '#ffabab',
        transform: [{ rotate: '-18deg' }],
      }} />

      {/* ── Main body — pink gradient ellipse 112×88 centered ── */}
      <View style={{
        position: 'absolute',
        left: (w - px(112)) / 2,
        top: px(24),
        height: px(88),
        width: px(112),
        borderRadius: px(48),
        backgroundColor: '#ffc8c0',
        borderWidth: 2 * s,
        borderColor: 'rgba(126,74,74,0.28)',
        // Approximate gradient with a lighter top tint via shadow
        shadowColor: '#ffe3de',
        shadowOffset: { width: 0, height: -px(10) },
        shadowOpacity: 0.6,
        shadowRadius: px(8),
      }} />

      {/* ── Belly — lighter pink ellipse at bottom ── */}
      <View style={{
        position: 'absolute',
        bottom: px(4),
        left: (w - px(96)) / 2,
        height: px(40),
        width: px(96),
        borderRadius: px(48),
        backgroundColor: '#ffc4bd',
      }} />

      {/* ── SVG face overlay ── */}
      <Svg
        style={{ position: 'absolute', left: 0, top: 0 }}
        width={w}
        height={h}
        viewBox="0 0 160 128"
      >
        {/* Left eye */}
        <Ellipse cx={53} cy={64} rx={face.leftEyeRx} ry={face.leftEyeRy} fill="#3d2425" />
        <Circle cx={50} cy={61} r={2.2} fill="white" opacity={0.9} />

        {/* Right eye */}
        <Ellipse cx={107} cy={64} rx={face.rightEyeRx} ry={face.rightEyeRy} fill="#3d2425" />
        <Circle cx={110} cy={61} r={2.2} fill="white" opacity={0.9} />

        {/* Eyebrows (mood-specific) */}
        {face.leftBrow !== null && (
          <Path
            d={face.leftBrow}
            fill="none"
            stroke="#3d2425"
            strokeWidth={2.8}
            strokeLinecap="round"
          />
        )}
        {face.rightBrow !== null && (
          <Path
            d={face.rightBrow}
            fill="none"
            stroke="#3d2425"
            strokeWidth={2.8}
            strokeLinecap="round"
          />
        )}

        {/* Nose */}
        <Circle cx={80} cy={74} r={2.5} fill="rgba(61,36,37,0.35)" />

        {/* Mouth */}
        <Path
          d={face.mouth}
          fill="none"
          stroke="#3d2425"
          strokeWidth={2.8}
          strokeLinecap="round"
        />

        {/* Cheek blushes */}
        <Ellipse cx={42} cy={77} rx={11} ry={6.5} fill="#ff7a70" opacity={0.55} />
        <Ellipse cx={118} cy={77} rx={11} ry={6.5} fill="#ff7a70" opacity={0.55} />
      </Svg>
    </Animated.View>
  );
}
