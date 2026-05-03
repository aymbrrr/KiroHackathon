/**
 * Motion sensor hook using expo-sensors DeviceMotion.
 * Returns a 0–100 motion level derived from accelerometer magnitude.
 *
 * Formula: magnitude of acceleration vector (excluding gravity) → clamped 0–100.
 * Updates every 500ms — sufficient for dashboard display, not battery-intensive.
 *
 * Graceful degradation: if DeviceMotion is unavailable (simulator, some devices),
 * returns 0 silently — the dashboard still works with sound-only risk score.
 */
import { useState, useEffect, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';

interface UseMotionSensorResult {
  motionLevel: number;   // 0–100
  isAvailable: boolean;
}

const UPDATE_INTERVAL_MS = 500;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function useMotionSensor(): UseMotionSensorResult {
  const [motionLevel, setMotionLevel] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const smoothedRef = useRef(0);

  useEffect(() => {
    let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;

    DeviceMotion.isAvailableAsync().then((available) => {
      setIsAvailable(available);
      if (!available) return;

      DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);

      subscription = DeviceMotion.addListener((data) => {
        const a = data.acceleration;
        if (!a) return;

        // Magnitude of user-caused acceleration (gravity removed by expo-sensors)
        const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);

        // Scale: 0 m/s² = 0, ~5 m/s² = 100 (vigorous movement)
        const raw = clamp(Math.round((mag / 5) * 100), 0, 100);

        // Smooth with exponential moving average to avoid jitter
        smoothedRef.current = Math.round(smoothedRef.current * 0.7 + raw * 0.3);
        setMotionLevel(smoothedRef.current);
      });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return { motionLevel, isAvailable };
}
