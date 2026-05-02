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
 * Phone mics vary — readings are consistent within a device, not across devices.
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
  start: () => Promise<void>;
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

  const start = useCallback(async () => {
    setError(null);
    readingsRef.current = [];

    // Request mic permission
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      setPermissionGranted(false);
      setError('Microphone permission denied. Enable it in Settings to auto-measure noise.');
      return;
    }
    setPermissionGranted(true);

    // Configure audio session for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

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
