/**
 * GPS location hook using expo-location.
 * Requests "while using" permission only — never background location.
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

  const requestPermission = async () => {
    setIsLoading(true);
    setError(null);

    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);

    if (!granted) {
      setIsLoading(false);
      setError('Location permission denied. Enable it in Settings to see nearby venues.');
      return;
    }

    // Get initial position quickly
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

    // Watch for position updates
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 20, // update every 20 metres
        timeInterval: 10000,  // or every 10 seconds
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

  // Check existing permission on mount without prompting
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        setPermissionGranted(true);
        requestPermission(); // already granted — start watching
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
