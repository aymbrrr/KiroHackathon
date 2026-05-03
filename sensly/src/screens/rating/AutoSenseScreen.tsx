/**
 * AutoSense screen — Step 1 of the rating flow.
 * Measures ambient noise for 30 seconds using the phone mic.
 * Shows live dB gauge with countdown. User can stop early.
 *
 * On complete: passes measurement result to the next rating step.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, frostedCard } from '../../constants/theme';
import { useAudioMeter, MeasurementResult } from '../../hooks/useAudioMeter';
import { DbGauge } from '../../components/sensing/DbGauge';
import { VenueDetector } from '../../components/sensing/VenueDetector';
import { useGeolocation } from '../../hooks/useGeolocation';
import { dbToLabel } from '../../lib/sensoryUtils';

export type RatingStackParamList = {
  AutoSense: { venueId: string; venueName: string };
  ManualRating: { venueId: string; venueName: string; noiseMeasurement?: MeasurementResult };
};

type Props = {
  navigation: NativeStackNavigationProp<RatingStackParamList, 'AutoSense'>;
  route: RouteProp<RatingStackParamList, 'AutoSense'>;
};

const MEASUREMENT_SECONDS = 30;

export function AutoSenseScreen({ navigation, route }: Props) {
  const { venueId, venueName } = route.params;
  const { db, isListening, start, stop, permissionGranted, error } = useAudioMeter();
  const { position } = useGeolocation();
  const [secondsLeft, setSecondsLeft] = useState(MEASUREMENT_SECONDS);
  const [phase, setPhase] = useState<'idle' | 'measuring' | 'done'>('idle');
  const [result, setResult] = useState<MeasurementResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  // Auto-start measurement on mount (with guard against double-invoke in strict mode)
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      handleStart();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase === 'measuring') {
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleStop();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStart = async () => {
    setPhase('measuring');
    setSecondsLeft(MEASUREMENT_SECONDS);
    await start();
  };

  // Cleanup mic on unmount
  useEffect(() => {
    return () => { stop(); };
  }, []);

  const handleStop = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const measurement = await stop();
    setResult(measurement);
    setPhase('done');
  };

  const handleContinue = () => {
    navigation.replace('ManualRating', {
      venueId,
      venueName,
      noiseMeasurement: result ?? undefined,
    });
  };

  const handleSkip = () => {
    navigation.replace('ManualRating', { venueId, venueName });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip noise measurement"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{venueName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <VenueDetector position={position} />

        <DbGauge db={db} isListening={isListening} size={220} />

        {phase === 'measuring' && (
          <View style={styles.statusBlock}>
            <Text style={styles.statusMono}>MEASURING</Text>
            <Text style={styles.countdown}>{secondsLeft}s remaining</Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}

        {phase === 'done' && result && (
          <View style={[frostedCard, styles.resultBlock]}>
            <Text style={styles.resultHeading}>
              This place is <Text style={styles.resultDb}>{result.avg} dB</Text>
            </Text>
            <Text style={styles.resultLabel}>{dbToLabel(result.avg)}</Text>
            <Text style={styles.resultDetail}>
              Peak: {result.peak} dB · Quiet: {result.min} dB · {result.samples} samples
            </Text>
          </View>
        )}

        {phase === 'idle' && error && (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {phase === 'measuring' && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStop}
            accessibilityRole="button"
            accessibilityLabel="Stop measurement early"
          >
            <Text style={styles.stopButtonText}>Done early</Text>
          </TouchableOpacity>
        )}

        {phase === 'done' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to rate other dimensions"
          >
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </TouchableOpacity>
        )}

        {(phase === 'idle' || error) && (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStart}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Start measuring</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
              <Text style={styles.skipLinkText}>Skip noise — rate other dimensions</Text>
            </TouchableOpacity>
            <Text style={styles.skipHint}>
              Noise can only be measured when you're at the venue. Other ratings can be submitted anytime.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  skipText: { ...typography.body, color: colors.primary },
  title: { ...typography.heading3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  statusBlock: { alignItems: 'center', gap: spacing.xs },
  statusMono: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  countdown: { ...typography.heading2, color: colors.primary },
  resultBlock: { alignItems: 'center', gap: spacing.xs, padding: spacing.lg, width: '100%' },
  resultHeading: { ...typography.bodyLg, color: colors.textPrimary, textAlign: 'center' },
  resultDb: { fontWeight: '800', color: colors.primary },
  resultLabel: { ...typography.body, color: colors.textSecondary },
  resultDetail: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center' },
  errorBlock: {
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: spacing.md,
  },
  errorText: { ...typography.bodySm, color: colors.error, textAlign: 'center' },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: { ...typography.label, color: colors.textInverse, fontSize: 17 },
  stopButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 30,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  stopButtonText: { ...typography.label, color: colors.textPrimary, fontSize: 17 },
  skipLink: { alignItems: 'center', paddingVertical: spacing.sm },
  skipLinkText: { ...typography.body, color: colors.textMuted },
  skipHint: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.md },
  errorText: { ...typography.bodySm, color: colors.error, textAlign: 'center', marginTop: spacing.xs },
});
