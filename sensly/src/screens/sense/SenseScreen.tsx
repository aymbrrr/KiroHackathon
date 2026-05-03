/**
 * Sense screen — quick 5-second ambient capture.
 *
 * Shows a fullscreen overlay with a large axolotl placeholder that reacts
 * to live dB readings. After capture, shows the result with a label.
 *
 * Reuses useAudioMeter hook (same as AutoSense, shorter duration).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView, Animated,
} from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { useAudioMeter, MeasurementResult } from '../../hooks/useAudioMeter';
import { dbToLabel, dbToLevel } from '../../lib/sensoryUtils';
import { ScaledText } from '../../components/shared/ScaledText';

const CAPTURE_DURATION_MS = 5_000;

type Phase = 'idle' | 'capturing' | 'result';

export function SenseScreen() {
  const { db, isListening, start, stop, permissionGranted, error } = useAudioMeter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated scale for the axolotl placeholder — pulses with dB
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'capturing' && db > 0) {
      // Scale 0.9–1.3 based on dB (30–90 range)
      const scale = 0.9 + ((db - 30) / 60) * 0.4;
      Animated.spring(pulseAnim, {
        toValue: Math.min(1.3, Math.max(0.9, scale)),
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    }
  }, [db, phase]);

  const startCapture = useCallback(async () => {
    setPhase('capturing');
    setCountdown(5);
    setResult(null);
    await start();

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-stop after 5 seconds
    timerRef.current = setTimeout(async () => {
      const measurement = await stop();
      setResult(measurement);
      setPhase('result');
      if (countdownRef.current) clearInterval(countdownRef.current);
    }, CAPTURE_DURATION_MS);
  }, [start, stop]);

  const reset = useCallback(() => {
    setPhase('idle');
    setResult(null);
    setCountdown(5);
    pulseAnim.setValue(1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (isListening) stop();
    };
  }, []);

  // Determine axolotl mood from dB
  const getMood = (dbVal: number): string => {
    if (dbVal < 40) return '😊';  // happy
    if (dbVal < 55) return '🤔';  // thinking
    if (dbVal < 70) return '😐';  // alert
    if (dbVal < 85) return '😰';  // stressed
    return '😫';                   // overwhelmed
  };

  return (
    <SafeAreaView style={styles.container}>
      {phase === 'idle' && (
        <View style={styles.centered}>
          {/* Axolotl placeholder — replace with <AxolotlSvg mood="happy" size={200} /> when Person C delivers */}
          <View style={styles.axolotlPlaceholder}>
            <ScaledText style={styles.axolotlEmoji}>🦎</ScaledText>
          </View>
          <ScaledText style={styles.heading}>Quick Sense Check</ScaledText>
          <ScaledText style={styles.body}>
            Tap to measure the noise around you for 5 seconds.
          </ScaledText>
          {error && <ScaledText style={styles.errorText}>{error}</ScaledText>}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={startCapture}
            accessibilityRole="button"
            accessibilityLabel="Start 5-second noise capture"
          >
            <ScaledText style={styles.captureButtonText}>🎙️  Start sensing</ScaledText>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'capturing' && (
        <View style={styles.captureOverlay}>
          <ScaledText style={styles.countdownText}>{countdown}</ScaledText>
          <Animated.View
            style={[
              styles.axolotlCapture,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <ScaledText style={styles.axolotlCaptureEmoji}>{getMood(db)}</ScaledText>
          </Animated.View>
          <ScaledText style={styles.liveDb}>{db} dB</ScaledText>
          <ScaledText style={styles.liveLabel}>{dbToLabel(db)}</ScaledText>
          <ScaledText style={styles.listeningText}>Listening...</ScaledText>
        </View>
      )}

      {phase === 'result' && result && (
        <View style={styles.centered}>
          <View style={[styles.resultBadge, { backgroundColor: dbToLevel(result.avg).color + '20' }]}>
            <ScaledText style={[styles.resultDb, { color: dbToLevel(result.avg).color }]}>
              {result.avg} dB
            </ScaledText>
            <ScaledText style={styles.resultLabel}>{dbToLabel(result.avg)}</ScaledText>
          </View>
          <ScaledText style={styles.resultContext}>{dbToLevel(result.avg).context}</ScaledText>
          <View style={styles.resultDetails}>
            <ScaledText style={styles.detailText}>Peak: {result.peak} dB</ScaledText>
            <ScaledText style={styles.detailText}>Low: {result.min} dB</ScaledText>
          </View>
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={reset}
              accessibilityRole="button"
            >
              <ScaledText style={styles.secondaryButtonText}>Measure again</ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  heading: { ...typography.heading1, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  errorText: { ...typography.bodySm, color: colors.error, textAlign: 'center' },

  // Axolotl placeholder — replace with AxolotlSvg component
  axolotlPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  axolotlEmoji: { fontSize: 80 },

  // Capture button
  captureButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  captureButtonText: { ...typography.label, color: colors.textInverse, fontSize: 18 },

  // Capture overlay — fullscreen during measurement
  captureOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  countdownText: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.primary,
    opacity: 0.3,
  },
  axolotlCapture: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  axolotlCaptureEmoji: { fontSize: 100 },
  liveDb: { ...typography.heading1, color: colors.textPrimary, fontSize: 48 },
  liveLabel: { ...typography.body, color: colors.textSecondary, fontSize: 18 },
  listeningText: { ...typography.bodySm, color: colors.textMuted },

  // Result
  resultBadge: {
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultDb: { fontSize: 48, fontWeight: '800' },
  resultLabel: { ...typography.heading3, color: colors.textPrimary },
  resultContext: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  resultDetails: { flexDirection: 'row', gap: spacing.xl },
  detailText: { ...typography.bodySm, color: colors.textMuted },
  resultActions: { marginTop: spacing.lg },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  secondaryButtonText: { ...typography.label, color: colors.primary },
});
