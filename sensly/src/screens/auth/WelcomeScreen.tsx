import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Animated, Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../constants/theme';
import { AuthStackParamList } from '../../navigation/types';
import { AxolotlSvg } from '../../components/shared/AxolotlSvg';
import { ScaledText } from '../../components/shared/ScaledText';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const STORY = [
  {
    mood: 'stressed' as const,
    bgStart: '#1A4D55',
    bgEnd: '#2A6B76',
    textColor: 'rgba(255,255,255,0.92)',
    subColor: 'rgba(255,255,255,0.55)',
    title: 'Some days feel like too much.',
    sub: 'The noise. The lights. The chaos.',
    axolotlSize: 110,
    cta: false,
  },
  {
    mood: 'thinking' as const,
    bgStart: '#2A7A85',
    bgEnd: '#3A9EA5',
    textColor: 'rgba(255,255,255,0.92)',
    subColor: 'rgba(255,255,255,0.6)',
    title: 'Sensly watches quietly for you.',
    sub: "Learning what feels safe, before it's too late.",
    axolotlSize: 120,
    cta: false,
  },
  {
    mood: 'happy' as const,
    bgStart: '#DFF6F7',
    bgEnd: '#B8E5EA',
    textColor: '#1A4D55',
    subColor: '#4A8A96',
    title: 'Your calm companion.',
    sub: 'Monitor · Predict · Prevent',
    axolotlSize: 130,
    cta: true,
  },
];

export function WelcomeScreen({ navigation }: Props) {
  const [slide, setSlide] = useState(0);
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const tapHintAnim = useRef(new Animated.Value(0)).current;

  // Auto-advance first two slides
  useEffect(() => {
    if (slide < 2) {
      const timer = setTimeout(() => advanceSlide(), 2800);
      return () => clearTimeout(timer);
    }
  }, [slide]);

  // Tap-to-continue pulsing hint on slides 0 and 1
  useEffect(() => {
    if (slide < 2) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(tapHintAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          Animated.timing(tapHintAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        { iterations: -1 }
      );
      const delay = setTimeout(() => loop.start(), 1500);
      return () => {
        clearTimeout(delay);
        loop.stop();
        tapHintAnim.setValue(0);
      };
    }
  }, [slide]);

  const advanceSlide = () => {
    if (slide >= 2) return;
    // Animate out
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: -20, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setSlide((s) => Math.min(s + 1, 2));
      translateYAnim.setValue(20);
      // Animate in
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 330, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 0, duration: 330, useNativeDriver: true }),
      ]).start();
    });
  };

  const current = STORY[slide];

  // Background color: interpolate between slide bg colors using a simple approach
  // We use the bgStart color as the solid background and overlay a tinted View
  const bgColor = current.bgStart;

  const dotActiveColor = slide === 2 ? '#1A5060' : 'rgba(255,255,255,0.9)';
  const dotInactiveColor = slide === 2 ? 'rgba(30,80,100,0.25)' : 'rgba(255,255,255,0.3)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <TouchableOpacity
        style={styles.fullArea}
        activeOpacity={1}
        onPress={() => { if (slide < 2) advanceSlide(); }}
        accessibilityRole="button"
        accessibilityLabel={slide < 2 ? 'Tap to continue' : undefined}
      >
        {/* Slide dots */}
        <View style={styles.dotsRow}>
          {STORY.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === slide ? 18 : 6,
                  backgroundColor: i === slide ? dotActiveColor : dotInactiveColor,
                },
              ]}
            />
          ))}
        </View>

        {/* Slide content */}
        <Animated.View
          style={[
            styles.slideContent,
            { opacity: opacityAnim, transform: [{ translateY: translateYAnim }] },
          ]}
        >
          {/* Axolotl */}
          <AxolotlSvg mood={current.mood} size={current.axolotlSize} animate />

          <View style={{ height: 28 }} />

          {/* Title */}
          <ScaledText style={[styles.title, { color: current.textColor }]}>
            {current.title}
          </ScaledText>

          {/* Subtitle */}
          <ScaledText style={[styles.subtitle, { color: current.subColor }]}>
            {current.sub}
          </ScaledText>

          {/* CTA on final slide */}
          {current.cta && (
            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={styles.beginButton}
                onPress={() => navigation.navigate('SignUp')}
                accessibilityRole="button"
                accessibilityLabel="Begin — create your account"
              >
                <ScaledText style={styles.beginButtonText}>Begin</ScaledText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => navigation.navigate('SignIn')}
                accessibilityRole="button"
                accessibilityLabel="Already using Sensly? Sign in"
              >
                <ScaledText style={styles.continueButtonText}>
                  Already using Sensly? Continue →
                </ScaledText>
              </TouchableOpacity>
            </View>
          )}

          {/* Tap hint on first two slides */}
          {!current.cta && (
            <Animated.Text
              style={[styles.tapHint, { opacity: tapHintAnim, color: 'rgba(255,255,255,0.4)' }]}
            >
              TAP TO CONTINUE
            </Animated.Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 20,
  },
  dot: {
    height: 6,
    borderRadius: 9999,
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  title: {
    fontWeight: '600',
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 10,
    maxWidth: 260,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 220,
  },
  ctaContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  beginButton: {
    backgroundColor: '#2A8A96',
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 48,
    shadowColor: '#2A8A96',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 6,
  },
  beginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
    paddingVertical: spacing.sm,
  },
  continueButtonText: {
    color: '#4A8A96',
    fontSize: 13,
    opacity: 0.7,
  },
  tapHint: {
    marginTop: 32,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
});
