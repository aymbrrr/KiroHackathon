/**
 * Daily check-in modal — "How are you feeling today?"
 *
 * Shown once on app open when user is signed in.
 * Three quick options that adjust the noise threshold for the day:
 *   Good day → use normal settings
 *   Sensitive day → lower threshold by 10 dB
 *   Hard day → lower threshold by 20 dB + show familiar places
 *
 * Visual style matches Figma frosted glass cards.
 * Trauma-informed: no pressure, easy to dismiss, no punishment for skipping.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Animated,
} from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { useProfileStore } from '../../stores/profileStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

interface DailyCheckInProps {
  visible: boolean;
  onDismiss: () => void;
}

const OPTIONS = [
  {
    key: 'good',
    emoji: '🟢',
    label: 'Good day',
    desc: 'Use my normal settings',
    offset: 0,
  },
  {
    key: 'sensitive',
    emoji: '🟡',
    label: 'Sensitive day',
    desc: 'Lower my thresholds a bit',
    offset: -10,
  },
  {
    key: 'hard',
    emoji: '🔴',
    label: 'Hard day',
    desc: 'Extra protection today',
    offset: -20,
  },
] as const;

export function DailyCheckIn({ visible, onDismiss }: DailyCheckInProps) {
  const { profile, setDailyOverride } = useProfileStore();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSelect = async (key: string, offset: number) => {
    setSelected(key);

    const baseThreshold = profile?.noise_threshold ?? 65;
    const todayThreshold = offset === 0 ? null : baseThreshold + offset;

    setDailyOverride(todayThreshold);

    // Log to Supabase
    if (user && profile) {
      await supabase.from('daily_checkins').insert({
        user_id: user.id,
        profile_id: profile.id,
        noise_threshold_today: todayThreshold ?? baseThreshold,
        notes: key === 'hard' ? 'Hard day — extra protection' : null,
      });

      // Log activity for streak
      await supabase.from('user_activity').insert({
        user_id: user.id,
        activity_type: 'check_in',
      });
    }

    // Brief pause to show selection, then dismiss
    setTimeout(onDismiss, 400);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.emoji}>🌤️</Text>
          <Text style={styles.heading}>How are you feeling today?</Text>
          <Text style={styles.subtitle}>
            This adjusts your sensory thresholds for today only.
          </Text>

          {/* Options */}
          <View style={styles.options}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.option,
                  selected === opt.key && styles.optionSelected,
                ]}
                onPress={() => handleSelect(opt.key, opt.offset)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selected === opt.key }}
                accessibilityLabel={`${opt.label}: ${opt.desc}`}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Skip */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onDismiss}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 56, 68, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    borderColor: 'rgba(35,88,105,0.3)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#43818F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#183844',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#426773',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  options: { width: '100%', gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 2,
    borderColor: 'rgba(35,88,105,0.2)',
    borderRadius: 18,
    padding: 14,
    minHeight: 56,
  },
  optionSelected: {
    borderColor: '#4FB3BF',
    backgroundColor: 'rgba(79,179,191,0.12)',
  },
  optionEmoji: { fontSize: 28 },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#183844',
  },
  optionDesc: {
    fontSize: 13,
    color: '#5d7b86',
    marginTop: 1,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 14,
    color: '#7AABB5',
    fontWeight: '500',
  },
});
