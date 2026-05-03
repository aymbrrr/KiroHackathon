/**
 * Map screen — Step 3.
 * Shows nearby venues as colorblind-safe pins on a react-native-maps map.
 * GPS centers the map on the user. Tapping a pin opens the venue bottom sheet.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ActivityIndicator,
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
import { colors, spacing, typography, frostedCard } from '../../constants/theme';
import { dbToLabel, scoreToPinStyle } from '../../lib/sensoryUtils';
import { AppRootParamList } from '../../navigation/types';
import { ScaledText } from '../../components/shared/ScaledText';

const DEFAULT_REGION: Region = {
  latitude: 35.2850,
  longitude: -120.6620,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();

  const { position, permissionGranted, error: geoError, requestPermission } = useGeolocation();
  const { nearbyVenues, fetchNearbyFromDB, isLoading } = useVenueStore();

  // Fetch venues for default region on mount (before GPS locks)
  // Use wide radius to catch all SLO venues (campus + downtown + In-N-Out)
  useEffect(() => {
    fetchNearbyFromDB(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude, 5);
  }, []);

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

      {/* Map header — SafeAreaView keeps it below the notch */}
      <SafeAreaView edges={['top']} style={styles.mapHeaderSafe}>
        <ScaledText style={styles.mapTitle}>🗺️ Sensory Map</ScaledText>
        <ScaledText style={styles.mapSubtitle}>Tap a pin to see sensory details</ScaledText>
      </SafeAreaView>

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
          fetchNearbyFromDB(r.latitude, r.longitude, 5);
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
          <ScaledText style={styles.permissionText}>
            Enable location to see nearby venues
          </ScaledText>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <ScaledText style={styles.permissionButtonText}>Enable</ScaledText>
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
        <ScaledText style={styles.fabIcon}>📍</ScaledText>
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
                  venueLat: selectedVenue.lat,
                  venueLng: selectedVenue.lng,
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
          <ScaledText style={cardStyles.name} numberOfLines={1}>{venue.name}</ScaledText>
          {venue.address && (
            <ScaledText style={cardStyles.address} numberOfLines={1}>{venue.address}</ScaledText>
          )}
        </View>
        <View style={[cardStyles.scoreBadge, { backgroundColor: pin.color + '22' }]}>
          <ScaledText style={[cardStyles.scoreLabel, { color: pin.color }]}>{pin.label}</ScaledText>
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
              <ScaledText style={cardStyles.featureText}>{f}</ScaledText>
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
          <ScaledText style={cardStyles.secondaryButtonText}>Full details</ScaledText>
        </TouchableOpacity>
        <TouchableOpacity
          style={cardStyles.rateButton}
          onPress={onRate}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${venue.name}`}
        >
          <ScaledText style={cardStyles.rateButtonText}>🎙️ Rate</ScaledText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={cardStyles.statChip}>
      <ScaledText style={cardStyles.statIcon}>{icon}</ScaledText>
      <ScaledText style={cardStyles.statLabel}>{label}</ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapHeaderSafe: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  mapTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  mapSubtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
  },
  map: {
    flex: 1,
    margin: spacing.sm,
    borderRadius: 24,
    overflow: 'hidden',
  },
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
    ...frostedCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 22 },
  sheetBackground: { backgroundColor: 'rgba(248,254,252,0.98)', borderRadius: 24 },
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
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: 30,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  rateButtonText: { ...typography.label, color: colors.textInverse, fontSize: 14 },
});
