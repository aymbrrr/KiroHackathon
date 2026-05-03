/**
 * Offline banner — shown when device has no network connection.
 * Uses @react-native-community/netinfo to detect connectivity.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors, typography, spacing } from '../../constants/theme';
import { ScaledText } from './ScaledText';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      Animated.timing(opacity, {
        toValue: offline ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, { opacity }]}>
      <View style={styles.dot} />
      <ScaledText style={styles.text}>No connection — map unavailable</ScaledText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF8A8A',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.9,
  },
  text: {
    ...typography.bodySm,
    color: '#fff',
    fontWeight: '600',
  },
});
