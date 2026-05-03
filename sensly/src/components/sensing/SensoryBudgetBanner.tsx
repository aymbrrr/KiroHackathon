/**
 * Sensory budget banner — fires when ambient noise exceeds the user's threshold.
 *
 * Self mode: haptic pulse only (Light impact) — no visual banner.
 * Support mode: haptic + visible top banner.
 *
 * Trauma-informed design: uses Light haptic (not Heavy), no alarm sounds,
 * no countdown pressure. Banner is dismissible.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../../constants/theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { dbToLabel } from '../../lib/sensoryUtils';
import { ScaledText } from '../shared/ScaledText';

interface SensoryBudgetBannerProps {
  currentDb: number;
  threshold: number;
}

const TRIGGER_DURATION_MS = 5000; // must exceed threshold for 5s before alerting

export function SensoryBudgetBanner({ currentDb, threshold }: SensoryBudgetBannerProps) {
  const { uiMode } = useSettingsStore();
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const exceedingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAlertRef = useRef(0);

  useEffect(() => {
    const exceeding = currentDb > threshold;

    if (exceeding && !exceedingRef.current) {
      // Started exceeding — start timer
      exceedingRef.current = true;
      timerRef.current = setTimeout(() => {
        const now = Date.now();
        // Don't re-alert more than once per 30 seconds
        if (now - lastAlertRef.current < 30_000) return;
        lastAlertRef.current = now;

        // Haptic — always Light, never Heavy (trauma-informed)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (uiMode === 'support') {
          setVisible(true);
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      }, TRIGGER_DURATION_MS);
    } else if (!exceeding) {
      exceedingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentDb, threshold, uiMode]);

  const dismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible || uiMode === 'self') return null;

  return (
    <Animated.View style={[styles.banner, { opacity }]}>
      <View style={styles.content}>
        <ScaledText style={styles.text}>
          🔊 Current noise: <ScaledText style={styles.bold}>{currentDb} dB</ScaledText> — above your comfort level ({threshold} dB)
        </ScaledText>
        <ScaledText style={styles.subtext}>{dbToLabel(currentDb)}</ScaledText>
      </View>
      <TouchableOpacity
        onPress={dismiss}
        style={styles.dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss noise alert"
      >
        <ScaledText style={styles.dismissText}>✕</ScaledText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 100,
  },
  content: { flex: 1, gap: 2 },
  text: { ...typography.bodySm, color: '#fff', lineHeight: 18 },
  bold: { fontWeight: '700' },
  subtext: { ...typography.bodySm, color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  dismiss: { padding: spacing.xs },
  dismissText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
