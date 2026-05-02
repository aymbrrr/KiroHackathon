/**
 * Colorblind-safe venue map pin.
 *
 * Uses shape + color redundancy so the map is readable without color perception:
 *   calm     → blue  #0077BB + circle
 *   moderate → orange #EE7733 + square
 *   loud     → red   #CC3311 + triangle
 *
 * Rendered as a custom marker on react-native-maps.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { scoreToPinStyle } from '../../lib/sensoryUtils';
import { Venue } from '../../stores/venueStore';

interface VenuePinProps {
  venue: Venue;
  onPress: (venue: Venue) => void;
}

export function VenuePin({ venue, onPress }: VenuePinProps) {
  const pin = scoreToPinStyle(venue.overall_score);

  return (
    <Marker
      coordinate={{ latitude: venue.lat, longitude: venue.lng }}
      onPress={() => onPress(venue)}
      tracksViewChanges={false} // perf: don't re-render on every map move
      accessibilityLabel={`${venue.name} — ${pin.label}`}
    >
      <View style={[styles.pin, { backgroundColor: pin.color }]}>
        <PinShape shape={pin.shape} />
      </View>
    </Marker>
  );
}

function PinShape({ shape }: { shape: 'circle' | 'square' | 'triangle' }) {
  if (shape === 'circle') {
    return <View style={styles.circle} />;
  }
  if (shape === 'square') {
    return <View style={styles.square} />;
  }
  // Triangle via border trick
  return <View style={styles.triangle} />;
}

const PIN_SIZE = 32;

const styles = StyleSheet.create({
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  square: {
    width: 12,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.9)',
  },
});
