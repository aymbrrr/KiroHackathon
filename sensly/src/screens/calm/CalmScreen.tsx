/**
 * Calm screen — 4-phase intervention flow.
 * Ported from designer's Calm.tsx.
 *
 * Phase 0: Breathing — animated circle with inhale/hold/exhale cycle
 * Phase 1: Tool picker — select calming tools
 * Phase 2: Guided intervention — step through tools with timer
 * Phase 3: Crisis averted — success screen
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, spacing, typography } from '../../constants/theme';
import { AppTabParamList } from '../../navigation/types';
import { AxolotlSvg } from '../../components/shared/AxolotlSvg';
import { ScaledText } from '../../components/shared/ScaledText';
import { useProfileStore } from '../../stores/profileStore';
import { KelpBackground } from '../../components/shared/KelpBackground';

// ─── Breathing phases ─────────────────────────────────────────────────────────
const BREATH_PHASES = [
  { label: 'Breathe in…',  durationS: 4,  scale: 1.18 },
  { label: 'Hold…',        durationS: 2,  scale: 1.18 },
  { label: 'Breathe out…', durationS: 6,  scale: 1.0  },
];

// ─── Calming tools — organized by sensory modality ────────────────────────────
// Research basis: somatic regulation strategies for neurodivergent adults
// Sources: simplypsychology.org, neurosparkhealth.com, floaatcenter.com, myndset-therapeutics.com
interface CalmTool {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  categories: string[];  // which trigger_categories this helps with
  diagnoses: string[];   // which diagnoses this is especially good for (empty = universal)
}

const ALL_TOOLS: CalmTool[] = [
  // Auditory
  { id: 'quiet',       emoji: '🏠', title: 'Quiet space',        sub: 'Move to a calm environment',           categories: ['sound', 'unpredictability'], diagnoses: [] },
  { id: 'headphones',  emoji: '🎧', title: 'Headphones',         sub: 'Block overwhelming sounds',            categories: ['sound'],                     diagnoses: ['autism', 'spd', 'migraine'] },
  { id: 'whitenoise',  emoji: '🌊', title: 'White noise',        sub: 'Mask unpredictable sounds',            categories: ['sound', 'unpredictability'], diagnoses: ['adhd'] },

  // Visual
  { id: 'eyes',        emoji: '👁️', title: 'Close eyes',         sub: 'Take a visual break',                 categories: ['lighting'],                  diagnoses: [] },
  { id: 'sunglasses',  emoji: '🕶️', title: 'Sunglasses',         sub: 'Reduce harsh light',                  categories: ['lighting'],                  diagnoses: ['autism', 'migraine'] },
  { id: 'dimlight',    emoji: '🌙', title: 'Find dim lighting',  sub: 'Move away from fluorescent lights',    categories: ['lighting'],                  diagnoses: ['autism', 'spd'] },

  // Breathing / regulation
  { id: 'breathe',     emoji: '🌬️', title: 'Deep breathing',     sub: 'Slow, calm breaths to reset',         categories: [],                            diagnoses: [] },
  { id: 'boxbreath',   emoji: '⬜', title: 'Box breathing',      sub: '4 in, 4 hold, 4 out, 4 hold',         categories: [],                            diagnoses: ['anxiety', 'ptsd'] },

  // Proprioceptive / tactile
  { id: 'pressure',    emoji: '🤗', title: 'Deep pressure',      sub: 'Firm hug, weighted item, or wall push', categories: ['texture'],                 diagnoses: ['autism', 'spd'] },
  { id: 'fidget',      emoji: '🧸', title: 'Fidget / comfort item', sub: 'Tactile grounding',                categories: ['texture'],                   diagnoses: ['adhd', 'anxiety'] },
  { id: 'chewy',       emoji: '🍬', title: 'Chewy snack',        sub: 'Oral proprioceptive input',            categories: [],                            diagnoses: ['autism', 'spd'] },

  // Movement (ADHD-specific)
  { id: 'movement',    emoji: '🚶', title: 'Walk or stretch',    sub: 'Gentle movement to discharge energy',  categories: [],                            diagnoses: ['adhd'] },
  { id: 'wallpush',    emoji: '🧱', title: 'Wall push-ups',      sub: 'Heavy work to regulate',               categories: [],                            diagnoses: ['adhd', 'spd'] },

  // Grounding (PTSD-specific)
  { id: 'grounding',   emoji: '🖐️', title: '5-4-3-2-1 grounding', sub: '5 things you see, 4 hear, 3 touch...', categories: ['unpredictability'],        diagnoses: ['ptsd', 'anxiety'] },
  { id: 'coldwater',   emoji: '💧', title: 'Cold water on wrists', sub: 'Vagal nerve reset',                  categories: [],                            diagnoses: ['ptsd', 'anxiety'] },

  // Olfactory
  { id: 'freshair',    emoji: '🌿', title: 'Fresh air',          sub: 'Step outside or open a window',        categories: ['smell'],                     diagnoses: [] },
];

// ─── Phase 0: Breathing ───────────────────────────────────────────────────────
function BreathingPhase({ onNext }: { onNext: () => void }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const phase = BREATH_PHASES[phaseIdx];
    Animated.timing(scaleAnim, {
      toValue: phase.scale,
      duration: phase.durationS * 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      setPhaseIdx((i) => (i + 1) % BREATH_PHASES.length);
    }, phase.durationS * 1000);

    return () => clearTimeout(timer);
  }, [phaseIdx]);

  const phase = BREATH_PHASES[phaseIdx];

  return (
    <View style={styles.phaseContainer}>
      <ScaledText style={styles.phaseTitle}>Calm with Sensly</ScaledText>
      <ScaledText style={styles.phaseSubtitle}>Take a moment · You're doing a great job.</ScaledText>

      {/* Breathing circle */}
      <View style={styles.breathingOuter}>
        <Animated.View style={[styles.breathingCircle, { transform: [{ scale: scaleAnim }] }]} />
        {/* Axolotl — relieved during breathing */}
        <View style={styles.breathingAxolotl}>
          <AxolotlSvg mood="relieved" size={130} animate={false} />
        </View>
      </View>

      <ScaledText style={styles.breathLabel}>{phase.label}</ScaledText>

      {/* Phase dots */}
      <View style={styles.phaseDots}>
        {BREATH_PHASES.map((_, i) => (
          <View
            key={i}
            style={[styles.phaseDot, i === phaseIdx && styles.phaseDotActive]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <ScaledText style={styles.primaryButtonText}>I'm ready — choose my tools →</ScaledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Phase 1: Tool picker ─────────────────────────────────────────────────────
function ToolPickerPhase({ onNext }: { onNext: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const { profile } = useProfileStore();

  // Personalize tools based on user's trigger categories and diagnosis
  const userCategories = (profile?.trigger_categories as string[]) ?? [];
  const userDiagnoses = (profile?.diagnosis_tags as string[]) ?? [];

  // Score each tool: higher = more relevant to this user
  const scoredTools = ALL_TOOLS.map(tool => {
    let score = 0;
    // Universal tools (no specific category/diagnosis) get base score
    if (tool.categories.length === 0 && tool.diagnoses.length === 0) score = 1;
    // Match trigger categories
    for (const cat of tool.categories) {
      if (userCategories.includes(cat)) score += 3;
    }
    // Match diagnoses
    for (const diag of tool.diagnoses) {
      if (userDiagnoses.includes(diag)) score += 2;
    }
    // Universal tools that match nothing still show but lower
    if (tool.diagnoses.length === 0) score += 1;
    return { ...tool, score };
  });

  // Sort by relevance, take top 8
  const TOOLS = scoredTools
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollPhaseContainer}
      showsVerticalScrollIndicator={false}
    >
      <ScaledText style={styles.phaseTitle}>Calm Steps</ScaledText>
      <ScaledText style={styles.phaseSubtitle}>Pick what helps you most right now.</ScaledText>

      <View style={{ gap: spacing.sm, width: '100%' }}>
        {TOOLS.map((tool) => {
          const sel = selected.includes(tool.id);
          return (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolCard, sel && styles.toolCardSelected]}
              onPress={() => {
                toggle(tool.id);
                Haptics.selectionAsync();
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: sel }}
            >
              <ScaledText style={styles.toolEmoji}>{tool.emoji}</ScaledText>
              <View style={{ flex: 1 }}>
                <ScaledText style={styles.toolTitle}>{tool.title}</ScaledText>
                <ScaledText style={styles.toolSub}>{tool.sub}</ScaledText>
              </View>
              <View style={[styles.toolCheck, sel && styles.toolCheckSelected]}>
                {sel && <ScaledText style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</ScaledText>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScaledText style={[styles.phaseSubtitle, { marginTop: spacing.md }]}>You've got this! 💕</ScaledText>

      <TouchableOpacity
        style={[styles.primaryButton, selected.length === 0 && styles.primaryButtonDisabled]}
        onPress={() => selected.length > 0 && onNext(selected)}
        disabled={selected.length === 0}
      >
        <ScaledText style={styles.primaryButtonText}>Start my calm plan →</ScaledText>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Phase 2: Guided intervention ────────────────────────────────────────────
function InterventionPhase({
  tools, onFinish,
}: {
  tools: typeof TOOLS;
  onFinish: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => { setTimeLeft(120); }, [stepIdx]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [stepIdx, timeLeft]);

  const tool = tools[stepIdx];
  const isLast = stepIdx === tools.length - 1;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const progress = (stepIdx + 1) / tools.length;

  return (
    <View style={styles.phaseContainer}>
      <ScaledText style={[styles.phaseSubtitle, { marginBottom: 2 }]}>
        Step {stepIdx + 1} of {tools.length}
      </ScaledText>
      <ScaledText style={styles.phaseTitle}>Sensory Reset</ScaledText>
      <ScaledText style={styles.phaseSubtitle}>You're in a safe space.</ScaledText>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>

      {/* Step card */}
      <View style={[styles.card, { alignItems: 'center', gap: spacing.sm, width: '100%' }]}>
        <ScaledText style={{ fontSize: 42 }}>{tool.emoji}</ScaledText>
        <ScaledText style={styles.phaseTitle}>{tool.title}</ScaledText>
        <ScaledText style={styles.phaseSubtitle}>{tool.sub}</ScaledText>
        <ScaledText style={[styles.timerText, { color: colors.primary }]}>{fmt(timeLeft)}</ScaledText>
        <ScaledText style={[styles.phaseSubtitle, { fontSize: 11 }]}>time remaining</ScaledText>
      </View>

      {/* Axolotl — happy during intervention */}
      <AxolotlSvg mood="happy" size={90} animate />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => isLast ? onFinish() : setStepIdx((i) => i + 1)}
      >
        <ScaledText style={styles.primaryButtonText}>
          {isLast ? 'Continue ✦' : 'Continue →'}
        </ScaledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Phase 3: Crisis averted ──────────────────────────────────────────────────
function CrisisAverted() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();

  return (
    <View style={[styles.phaseContainer, { justifyContent: 'center' }]}>
      {/* Axolotl — relieved on success */}
      <AxolotlSvg mood="relieved" size={150} animate />

      <ScaledText style={[styles.phaseTitle, { color: '#1D9A78', fontSize: 28, marginTop: spacing.lg }]}>
        You did it ✦
      </ScaledText>
      <ScaledText style={styles.phaseSubtitle}>
        Great job taking a moment for yourself.
      </ScaledText>

      {/* Risk badge */}
      <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: spacing.xl }]}>
        <View style={{ alignItems: 'center' }}>
          <ScaledText style={[styles.phaseSubtitle, { fontSize: 10 }]}>Before</ScaledText>
          <ScaledText style={[styles.phaseTitle, { color: '#FF8A8A', fontSize: 20 }]}>Stressed</ScaledText>
        </View>
        <ScaledText style={{ fontSize: 22, color: colors.primary }}>→</ScaledText>
        <View style={{ alignItems: 'center' }}>
          <ScaledText style={[styles.phaseSubtitle, { fontSize: 10 }]}>Now</ScaledText>
          <ScaledText style={[styles.phaseTitle, { color: '#7ED6A5', fontSize: 20 }]}>Calm</ScaledText>
        </View>
      </View>

      <ScaledText style={[styles.phaseSubtitle, { fontSize: 12 }]}>Sensly logged this moment ✦</ScaledText>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Home')}
        accessibilityRole="button"
        accessibilityLabel="Go back to home"
      >
        <ScaledText style={styles.primaryButtonText}>Back to home</ScaledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main CalmScreen ──────────────────────────────────────────────────────────
export function CalmScreen() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [selectedTools, setSelectedTools] = useState<typeof TOOLS>([]);

  // Reset to phase 0 every time the tab comes back into focus.
  // This ensures the flow restarts fresh after "Back to home" navigates away.
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Runs when screen loses focus (user navigates away)
        setPhase(0);
        setSelectedTools([]);
      };
    }, [])
  );

  const handleToolsSelected = (ids: string[]) => {
    const tools = ALL_TOOLS.filter((t) => ids.includes(t.id));
    setSelectedTools(tools.length > 0 ? tools : [ALL_TOOLS[0]]);
    setPhase(2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KelpBackground variant="kelp2">
      {phase === 0 && <BreathingPhase onNext={() => setPhase(1)} />}
      {phase === 1 && <ToolPickerPhase onNext={handleToolsSelected} />}
      {phase === 2 && <InterventionPhase tools={selectedTools} onFinish={() => setPhase(3)} />}
      {phase === 3 && <CrisisAverted />}
      </KelpBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  phaseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  scrollPhaseContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  phaseSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  breathingOuter: {
    width: 220, height: 220,
    alignItems: 'center', justifyContent: 'center',
  },
  breathingCircle: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(58,172,178,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(58,172,178,0.3)',
  },
  breathingAxolotl: {
    position: 'absolute',
  },
  breathLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  phaseDots: { flexDirection: 'row', gap: spacing.sm },
  phaseDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(58,172,178,0.2)',
  },
  phaseDotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 2,
    borderColor: 'rgba(35,88,105,0.25)',
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: '#43818F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(35,88,105,0.2)',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  toolCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(58,172,178,0.08)',
  },
  toolEmoji: { fontSize: 24 },
  toolTitle: { ...typography.label, color: colors.textPrimary },
  toolSub: { ...typography.bodySm, color: colors.textSecondary },
  toolCheck: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(58,172,178,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  toolCheckSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressTrack: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: 'rgba(58,172,178,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: colors.primary,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonDisabled: { backgroundColor: 'rgba(200,220,225,0.7)', shadowOpacity: 0 },
  primaryButtonText: { ...typography.label, color: '#fff', fontSize: 16 },
});
