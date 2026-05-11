/**
 * Audio meter hook — measures ambient dB SPL using expo-av.
 *
 * Uses expo-av Recording with isMeteringEnabled: true.
 * status.metering returns dBFS (negative, 0 = max loudness).
 *
 * Conversion: dBFS → dB SPL (approximate)
 *   Most phone mics clip around 90–100 dB SPL.
 *   -60 dBFS ≈ 30 dB SPL (quiet room)
 *     0 dBFS ≈ 90 dB SPL (very loud)
 *   Formula: dbSPL = clamp(metering + 90, 30, 100)
 *
 * NOTE: This is a relative measurement, not calibrated SPL.
 * Label readings as "quieter than a busy café" not absolute dB.
 */
import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export interface MeasurementResult {
  avg: number;
  peak: number;
  min: number;
  samples: number;
}

interface UseAudioMeterResult {
  db: number;                          // current live dB reading
  isListening: boolean;
  start: () => Promise<boolean>;
  stop: () => Promise<MeasurementResult | null>;
  permissionGranted: boolean | null;
  error: string | null;
}

const MEASUREMENT_DURATION_MS = 30_000;
const DB_OFFSET = 90; // dBFS → approximate dB SPL
const DB_MIN = 30;
const DB_MAX = 100;

function clampDb(metering: number): number {
  return Math.round(Math.max(DB_MIN, Math.min(DB_MAX, metering + DB_OFFSET)));
}

export function useAudioMeter(): UseAudioMeterResult {
  const [db, setDb] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const readingsRef = useRef<number[]>([]);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    readingsRef.current = [];

    // Stop any existing recording first (prevents "only one recording" error)
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // Already stopped — ignore
      }
      recordingRef.current = null;
    }

    // Request mic permission
    const { status: existingStatus } = await Audio.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status: newStatus } = await Audio.requestPermissionsAsync();
      finalStatus = newStatus;
    }

    if (finalStatus !== 'granted') {
      setPermissionGranted(false);
      setError('Microphone permission denied. Go to Settings → Expo Go → Microphone to enable.');
      return false;
    }
    setPermissionGranted(true);

    // Configure audio session for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    try {
      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            const reading = clampDb(status.metering);
            setDb(reading);
            readingsRef.current.push(reading);
          }
        },
        100 // update every 100ms
      );

      recordingRef.current = recording;
      setIsListening(true);
      return true;
    } catch (e: any) {
      setError(`Mic error: ${e.message ?? 'unknown'}. Try closing other apps using the mic.`);
      setIsListening(false);
      return false;
    }
  }, []);

  const stop = useCallback(async (): Promise<MeasurementResult | null> => {
    if (!recordingRef.current) return null;

    try {
      await recordingRef.current.stopAndUnloadAsync();
    } catch {
      // Recording may already be stopped
    }

    // Reset audio mode
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    recordingRef.current = null;
    setIsListening(false);

    const readings = readingsRef.current;
    if (readings.length === 0) return null;

    const avg = Math.round(readings.reduce((a, b) => a + b, 0) / readings.length);
    const peak = Math.max(...readings);
    const min = Math.min(...readings);

    return { avg, peak, min, samples: readings.length };
  }, []);

  return { db, isListening, start, stop, permissionGranted, error };
}
