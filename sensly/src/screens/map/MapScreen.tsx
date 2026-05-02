/**
 * Map screen — Step 3.
 * Shows nearby venues as colorblind-safe pins on a react-native-maps map.
 * GPS centers the map on the user. Tapping a pin opens the venue bottom sheet.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text, ActivityIndicator,
} from 'react-native';
import MapView, { Region, PROVIDER_DEFAULT } from 'react-native-maps';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useGeolocation } from '../../hooks/useGeolocation';
import { useVenueStore, Venue } from '../../stores/venueStore';
import { VenuePin } from '../../components/map/VenuePin';
import { OfflineBanner } from '../../components/shared/OfflineBanner';
import { colors, spacing, typography } from '../../constants/theme';
import { dbToLabel, scoreToPinStyle } from '../../lib/sensoryUtils';
import { AppRootParamList } from '../../navigation/types';

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();

  const { position, permissionGranted, error: geoError, requestPermission } = useGeolocation();
  const { nearbyVenues, fetchNearbyFromDB, isLoading } = useVenueStore();

  // Center map on user when position first arrives
  useEffect(() => {
    if (position) {
      const newRegion = {
        latitude: position.lat,
        longitude: position.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
      fetchNearbyFromDB(position.lat, position.lng);
    }
  }, [position?.lat, position?.lng]);

  // Request permission on mount if not yet granted
  useEffect(() => {
    if (permissionGranted === false) {
      requestPermission();
    }
  }, [permissionGranted]);

  const handlePinPress = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    bottomSheetRef.current?.expand();
  }, []);

  const handleCenterOnMe = () => {
    if (position) {
      const r = {
        latitude: position.lat,
        longitude: position.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(r, 600);
    } else {
      requestPermission();
    }
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={permissionGranted === true}
        showsMyLocationButton={false}
        onRegionChangeComplete={(r) => {
          setRegion(r);
          // Refetch venues when map moves significantly
          fetchNearbyFromDB(r.latitude, r.longitude);
        }}
      >
        {nearbyVenues.map((venue) => (
          <VenuePin
            key={venue.id}
            venue={venue}
            onPress={handlePinPress}
          />
        ))}
      </MapView>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {/* Location permission prompt */}
      {permissionGranted === false && geoError && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>
            Enable location to see nearby venues
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Center on me FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCenterOnMe}
        accessibilityRole="button"
        accessibilityLabel="Center map on my location"
      >
        <Text style={styles.fabIcon}>📍</Text>
      </TouchableOpacity>

      {/* Venue bottom sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['40%', '65%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        onClose={() => setSelectedVenue(null)}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selectedVenue && (
            <VenueCard
              venue={selectedVenue}
              onRate={() => {
                bottomSheetRef.current?.close();
                navigation.navigate('Rating', {
                  venueId: selectedVenue.id,
                  venueName: selectedVenue.name,
                });
              }}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

function VenueCard({ venue, onRate }: { venue: Venue; onRate: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const pin = scoreToPinStyle(venue.overall_score);
  const noiseLabel = venue.avg_noise_db != null
    ? `${Math.round(venue.avg_noise_db)} dB — ${dbToLabel(venue.avg_noise_db)}`
    : 'No noise data yet';

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.scoreDot, { backgroundColor: pin.color }]} />
        <View style={cardStyles.titleBlock}>
          <Text style={cardStyles.name} numberOfLines={1}>{venue.name}</Text>
          {venue.address && (
            <Text style={cardStyles.address} numberOfLines={1}>{venue.address}</Text>
          )}
        </View>
        <View style={[cardStyles.scoreBadge, { backgroundColor: pin.color + '22' }]}>
          <Text style={[cardStyles.scoreLabel, { color: pin.color }]}>{pin.label}</Text>
        </View>
      </View>

      <View style={cardStyles.stats}>
        <StatChip icon="🎙️" label={noiseLabel} />
        <StatChip icon="⭐" label={`${venue.total_ratings} rating${venue.total_ratings !== 1 ? 's' : ''}`} />
      </View>

      {venue.sensory_features && Array.isArray(venue.sensory_features) && venue.sensory_features.length > 0 && (
        <View style={cardStyles.features}>
          {(venue.sensory_features as string[]).slice(0, 3).map((f, i) => (
            <View key={i} style={cardStyles.featureChip}>
              <Text style={cardStyles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={cardStyles.buttonRow}>
        <TouchableOpacity
          style={cardStyles.secondaryButton}
          onPress={() => navigation.navigate('VenueDetail', { venueId: venue.id })}
          accessibilityRole="button"
          accessibilityLabel={`See full details for ${venue.name}`}
        >
          <Text style={cardStyles.secondaryButtonText}>Full details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={cardStyles.rateButton}
          onPress={onRate}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${venue.name}`}
        >
          <Text style={cardStyles.rateButtonText}>🎙️ Rate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={cardStyles.statChip}>
      <Text style={cardStyles.statIcon}>{icon}</Text>
      <Text style={cardStyles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: spacing.xl,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: spacing.sm,
  },
  permissionBanner: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionText: { ...typography.bodySm, color: colors.textPrimary, flex: 1 },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  permissionButtonText: { ...typography.label, color: '#fff', fontSize: 13 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabIcon: { fontSize: 22 },
  sheetBackground: { backgroundColor: colors.surface, borderRadius: 20 },
  sheetHandle: { backgroundColor: colors.border, width: 40 },
  sheetContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});

const cardStyles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scoreDot: { width: 12, height: 12, borderRadius: 6 },
  titleBlock: { flex: 1 },
  name: { ...typography.heading3, color: colors.textPrimary },
  address: { ...typography.bodySm, color: colors.textMuted, marginTop: 2 },
  scoreBadge: { borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  scoreLabel: { ...typography.bodySm, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statIcon: { fontSize: 13 },
  statLabel: { ...typography.bodySm, color: colors.textSecondary },
  features: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  featureChip: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  featureText: { ...typography.bodySm, color: colors.primary },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: { ...typography.label, color: colors.textPrimary, fontSize: 14 },
  rateButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  rateButtonText: { ...typography.label, color: colors.textInverse, fontSize: 14 },
});
