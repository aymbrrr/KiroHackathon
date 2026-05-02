/**
 * Venue detector — shows "You're at [venue name]" based on GPS + Nominatim reverse geocode.
 * Debounced to 1 req/sec to respect Nominatim's ToS.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GeoPosition } from '../../hooks/useGeolocation';
import { colors, typography, spacing } from '../../constants/theme';

interface VenueDetectorProps {
  position: GeoPosition | null;
  onVenueDetected?: (name: string, address: string) => void;
}

interface NominatimResult {
  display_name: string;
  address: {
    amenity?: string;
    shop?: string;
    road?: string;
    house_number?: string;
    city?: string;
  };
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const DEBOUNCE_MS = 1500; // > 1 req/sec per Nominatim ToS

export function VenueDetector({ position, onVenueDetected }: VenueDetectorProps) {
  const [venueName, setVenueName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPositionRef = useRef<string>('');

  useEffect(() => {
    if (!position) return;

    const key = `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`;
    if (key === lastPositionRef.current) return; // same position, skip
    lastPositionRef.current = key;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = `${NOMINATIM_URL}?lat=${position.lat}&lon=${position.lng}&format=json&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Sensly/1.0 (sensly.app)' }, // Nominatim requires User-Agent
        });
        const data: NominatimResult = await res.json();

        const name = data.address?.amenity ?? data.address?.shop ?? null;
        const road = data.address?.road ?? '';
        const number = data.address?.house_number ?? '';
        const address = [number, road].filter(Boolean).join(' ');

        setVenueName(name);
        if (name) onVenueDetected?.(name, address);
      } catch {
        // Silently fail — venue detection is enhancement, not requirement
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [position?.lat, position?.lng]);

  if (!position) return null;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : venueName ? (
        <Text style={styles.text}>📍 You're at <Text style={styles.bold}>{venueName}</Text></Text>
      ) : (
        <Text style={styles.text}>📍 Measuring your current location</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  bold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
