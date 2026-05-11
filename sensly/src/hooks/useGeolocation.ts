/**
 * GPS location hook using expo-location.
 * Requests "while using" permission only
 * Returns current position and a permission status.
 */
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number | null;
}

interface UseGeolocationResult {
  position: GeoPosition | null;
  permissionGranted: boolean | null; // null = not yet asked
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const startWatch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPosition({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      });
    } catch (e: any) {
      setError('Could not get your location. Check GPS settings.');
    }

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 20,
        timeInterval: 10000,
      },
      (loc) => {
        setPosition({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
        });
      }
    );

    setIsLoading(false);
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);

    if (!granted) {
      setError('Location permission denied. Enable it in Settings to see nearby venues.');
      return;
    }

    await startWatch();
  };

  // Check existing permission on mount without prompting
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        setPermissionGranted(true);
        startWatch(); // already granted — skip the permission prompt
      } else {
        setPermissionGranted(false);
      }
    });

    return () => {
      watchRef.current?.remove();
    };
  }, []);

  return { position, permissionGranted, isLoading, error, requestPermission };
}
