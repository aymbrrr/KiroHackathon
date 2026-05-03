/**
 * Venue map pin — uses the custom mapPin asset.
 * Tinted by score color so calm/moderate/loud are still distinguishable.
 */
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { scoreToPinStyle } from '../../lib/sensoryUtils';
import { Venue } from '../../stores/venueStore';

// @ts-ignore
const mapPinImage = require('../../../assets/mapPin.png');

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
      tracksViewChanges={false}
      accessibilityLabel={`${venue.name} — ${pin.label}`}
    >
      <View style={styles.container}>
        <Image
          source={mapPinImage}
          style={[styles.pin, { tintColor: pin.color }]}
          resizeMode="contain"
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 36,
    height: 36,
  },
});
