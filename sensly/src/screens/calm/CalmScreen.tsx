/**
 * Calm screen — 4-phase intervention flow.
 * Ported from designer's Calm.tsx.
 *
 * Phase 0: Breathing — animated circle with inhale/hold/exhale cycle
 * Phase 1: Tool picker — select calming tools (with preset chips)
 * Phase 2: Calm plan — checklist of selected tools, interactive sub-screens
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
  categories: string[];       // which trigger_categories this helps with
  diagnoses: string[];        // which diagnoses this is especially good for (empty = universal)
  interactive?: boolean;      // whether this tool has an interactive sub-screen
  interactiveDurationS?: number; // total session duration in seconds (for display hint)
  durationHint: string;       // human-readable time hint shown in checklist
}

const ALL_TOOLS: CalmTool[] = [
  // Auditory
  { id: 'quiet',      emoji: '🏠', title: 'Quiet space',           sub: 'Move to a calm environment',            categories: ['sound', 'unpredictability'], diagnoses: [],                        durationHint: 'when ready' },
  { id: 'headphones', emoji: '🎧', title: 'Headphones',            sub: 'Block overwhelming sounds',             categories: ['sound'],                     diagnoses: ['autism', 'spd', 'migraine'], durationHint: 'as needed' },
  { id: 'whitenoise', emoji: '🌊', title: 'White noise',           sub: 'Mask unpredictable sounds',             categories: ['sound', 'unpredictability'], diagnoses: ['adhd'],                  durationHint: 'as needed' },

  // Visual
  { id: 'eyes',       emoji: '👁️', title: 'Close eyes',            sub: 'Take a visual break',                  categories: ['lighting'],                  diagnoses: [],                        durationHint: 'when ready' },
  { id: 'sunglasses', emoji: '🕶️', title: 'Sunglasses',            sub: 'Reduce harsh light',                   categories: ['lighting'],                  diagnoses: ['autism', 'migraine'],    durationHint: 'as needed' },
  { id: 'dimlight',   emoji: '🌙', title: 'Find dim lighting',     sub: 'Move away from fluorescent lights',     categories: ['lighting'],                  diagnoses: ['autism', 'spd'],         durationHint: 'when ready' },

  // Breathing / regulation
  { id: 'breathe',    emoji: '🌬️', title: 'Deep breathing',        sub: 'Slow, calm breaths to reset',          categories: [],                            diagnoses: [],                        interactive: true, interactiveDurationS: 90,  durationHint: '~90 sec' },
  { id: 'boxbreath',  emoji: '⬜', title: 'Box breathing',         sub: '4 in, 4 hold, 4 out, 4 hold',          categories: [],                            diagnoses: ['anxiety', 'ptsd'],       interactive: true, interactiveDurationS: 48,  durationHint: '~2 min' },

  // Proprioceptive / tactile
  { id: 'pressure',   emoji: '🤗', title: 'Deep pressure',         sub: 'Firm hug, weighted item, or wall push', categories: ['texture'],                  diagnoses: ['autism', 'spd'],         durationHint: 'as needed' },
  { id: 'fidget',     emoji: '🧸', title: 'Fidget / comfort item', sub: 'Tactile grounding',                     categories: ['texture'],                   diagnoses: ['adhd', 'anxiety'],       durationHint: 'as needed' },
  { id: 'chewy',      emoji: '🍬', title: 'Chewy snack',           sub: 'Oral proprioceptive input',             categories: [],                            diagnoses: ['autism', 'spd'],         durationHint: 'as needed' },

  // Movement (ADHD-specific)
  { id: 'movement',   emoji: '🚶', title: 'Walk or stretch',       sub: 'Gentle movement to discharge energy',   categories: [],                            diagnoses: ['adhd'],                  durationHint: '~5 min' },
  { id: 'wallpush',   emoji: '🧱', title: 'Wall push-ups',         sub: 'Heavy work to regulate',                categories: [],                            diagnoses: ['adhd', 'spd'],           interactive: true, interactiveDurationS: 60,  durationHint: '~1 min' },

  // Grounding (PTSD-specific)
  { id: 'grounding',  emoji: '🖐️', title: '5-4-3-2-1 grounding',  sub: '5 things you see, 4 hear, 3 touch…',   categories: ['unpredictability'],          diagnoses: ['ptsd', 'anxiety'],       interactive: true, interactiveDurationS: 120, durationHint: '~2 min' },
  { id: 'coldwater',  emoji: '💧', title: 'Cold water on wrists',  sub: 'Vagal nerve reset',                     categories: [],                            diagnoses: ['ptsd', 'anxiety'],       interactive: true, interactiveDurationS: 30,  durationHint: '30 sec' },

  // Olfactory
  { id: 'freshair',   emoji: '🌿', title: 'Fresh air',             sub: 'Step outside or open a window',         categories: ['smell'],                     diagnoses: [],                        durationHint: 'when ready' },
];

// ─── Preset tool selections ───────────────────────────────────────────────────
const PRESETS: { label: string; ids: string[] }[] = [
  { label: 'Autism',   ids: ['quiet', 'eyes', 'breathe', 'pressure', 'headphones'] },
  { label: 'ADHD',     ids: ['movement', 'wallpush', 'fidget', 'whitenoise', 'boxbreath'] },
  { label: 'PTSD',     ids: ['grounding', 'coldwater', 'breathe', 'dimlight'] },
  { label: 'Anxiety',  ids: ['breathe', 'grounding', 'coldwater', 'fidget'] },
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
  const [activePreset, setActivePreset] = useState<string | null>(null);
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

  const toggle = (id: string) => {
    setActivePreset(null);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyPreset = (preset: { label: string; ids: string[] }) => {
    setActivePreset(preset.label);
    setSelected(preset.ids);
    Haptics.selectionAsync();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollPhaseContainer}
      showsVerticalScrollIndicator={false}
    >
      <ScaledText style={styles.phaseTitle}>Calm Steps</ScaledText>
      <ScaledText style={styles.phaseSubtitle}>Pick what helps you most right now.</ScaledText>

      {/* Preset chips */}
      <View style={{ width: '100%', gap: spacing.xs }}>
        <ScaledText style={styles.presetLabel}>Quick start for:</ScaledText>
        <View style={styles.presetRow}>
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.label;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.presetChip, isActive && styles.presetChipActive]}
                onPress={() => applyPreset(preset)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <ScaledText style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                  {preset.label}
                </ScaledText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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

// ─── Interactive sub-screen: Deep breathing (90 seconds) ─────────────────────
function BreatheInteractive({ onDone }: { onDone: () => void }) {
  const PHASES = [
    { label: 'Breathe in…', durationS: 4, scale: 1.18 },
    { label: 'Hold…',       durationS: 2, scale: 1.18 },
    { label: 'Breathe out…',durationS: 6, scale: 1.0  },
  ];
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Breathing animation cycle
  useEffect(() => {
    const p = PHASES[phaseIdx];
    Animated.timing(scaleAnim, {
      toValue: p.scale,
      duration: p.durationS * 1000,
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => setPhaseIdx((i) => (i + 1) % PHASES.length), p.durationS * 1000);
    return () => clearTimeout(t);
  }, [phaseIdx]);

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) { onDone(); return; }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.interactiveOverlay}>
      <ScaledText style={styles.phaseTitle}>Deep Breathing</ScaledText>
      <ScaledText style={[styles.phaseSubtitle, { marginBottom: spacing.md }]}>
        Follow the circle
      </ScaledText>

      <View style={styles.breathingOuter}>
        <Animated.View style={[styles.breathingCircle, { transform: [{ scale: scaleAnim }] }]} />
        <View style={styles.breathingAxolotl}>
          <AxolotlSvg mood="relieved" size={130} animate={false} />
        </View>
      </View>

      <ScaledText style={styles.breathLabel}>{PHASES[phaseIdx].label}</ScaledText>
      <ScaledText style={[styles.timerText, { color: colors.primary }]}>{fmt(timeLeft)}</ScaledText>
      <ScaledText style={[styles.phaseSubtitle, { fontSize: 11 }]}>remaining</ScaledText>

      <TouchableOpacity style={[styles.primaryButton, { marginTop: spacing.md }]} onPress={onDone}>
        <ScaledText style={styles.primaryButtonText}>Done</ScaledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Interactive sub-screen: Box breathing (4-4-4-4, 3 cycles) ───────────────
function BoxBreathInteractive({ onDone }: { onDone: () => void }) {
  const BOX_PHASES = [
    { label: 'Breathe in…', side: 0 },
    { label: 'Hold…',       side: 1 },
    { label: 'Breathe out…',side: 2 },
    { label: 'Hold…',       side: 3 },
  ];
  const PHASE_DURATION = 4; // seconds per phase
  const TOTAL_CYCLES = 3;

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(PHASE_DURATION);
  const [cycle, setCycle] = useState(1);
  const [done, setDone] = useState(false);

  // Animated square border progress (0 → 1 per side)
  const sideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (done) return;
    // Animate the current side fill
    sideAnim.setValue(0);
    Animated.timing(sideAnim, {
      toValue: 1,
      duration: PHASE_DURATION * 1000,
      useNativeDriver: false,
    }).start();

    setCountdown(PHASE_DURATION);
    const countId = setInterval(() => setCountdown((c) => c - 1), 1000);

    const phaseTimer = setTimeout(() => {
      clearInterval(countId);
      const nextPhase = (phaseIdx + 1) % BOX_PHASES.length;
      const nextCycle = nextPhase === 0 ? cycle + 1 : cycle;
      if (nextPhase === 0 && cycle >= TOTAL_CYCLES) {
        setDone(true);
        setTimeout(onDone, 600);
      } else {
        setPhaseIdx(nextPhase);
        setCycle(nextCycle);
      }
    }, PHASE_DURATION * 1000);

    return () => {
      clearInterval(countId);
      clearTimeout(phaseTimer);
    };
  }, [phaseIdx, done]);

  const currentSide = BOX_PHASES[phaseIdx].side;
  const BOX_SIZE = 140;
  const STROKE = 4;

  // Each side of the box: top, right, bottom, left
  // We highlight the active side with a teal overlay
  const sideStyles: Record<number, object> = {
    0: { top: 0,    left: 0,    width: BOX_SIZE, height: STROKE },
    1: { top: 0,    right: 0,   width: STROKE,   height: BOX_SIZE },
    2: { bottom: 0, left: 0,    width: BOX_SIZE, height: STROKE },
    3: { top: 0,    left: 0,    width: STROKE,   height: BOX_SIZE },
  };

  return (
    <View style={styles.interactiveOverlay}>
      <ScaledText style={styles.phaseTitle}>Box Breathing</ScaledText>
      <ScaledText style={[styles.phaseSubtitle, { marginBottom: spacing.lg }]}>
        Cycle {cycle} of {TOTAL_CYCLES}
      </ScaledText>

      {/* Animated square */}
      <View style={{
        width: BOX_SIZE, height: BOX_SIZE,
        borderWidth: STROKE,
        borderColor: 'rgba(79,179,191,0.25)',
        borderRadius: 8,
        marginBottom: spacing.lg,
        position: 'relative',
      }}>
        {/* Active side highlight */}
        <Animated.View style={[
          { position: 'absolute', backgroundColor: colors.primary, borderRadius: 2 },
          sideStyles[currentSide],
          currentSide === 0 || currentSide === 2
            ? { width: sideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, BOX_SIZE] }) }
            : { height: sideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, BOX_SIZE] }) },
        ]} />
      </View>

      <ScaledText style={styles.breathLabel}>{BOX_PHASES[phaseIdx].label}</ScaledText>
      <ScaledText style={[styles.timerText, { color: colors.primary, fontSize: 56 }]}>
        {countdown}
      </ScaledText>

      <TouchableOpacity style={[styles.primaryButton, { marginTop: spacing.lg }]} onPress={onDone}>
        <ScaledText style={styles.primaryButtonText}>Done</ScaledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Interactive sub-screen: 5-4-3-2-1 grounding ─────────────────────────────
function GroundingInteractive({ onDone }: { onDone: () => void }) {
  const STEPS = [
    { count: 5, sense: 'SEE',   instruction: 'Look around and name 5 things you can see.' },
    { count: 4, sense: 'HEAR',  instruction: 'Listen carefully. Name 4 things you can hear.' },
    { count: 3, sense: 'TOUCH', instruction: 'Notice 3 things you can physically feel or touch.' },
    { count: 2, sense: 'SMELL', instruction: 'Name 2 things you can smell right now.' },
    { count: 1, sense: 'TASTE', instruction: 'Name 1 thing you can taste.' },
  ];

  const [stepIdx, setStepIdx] = useState(0);
  const isLast = stepIdx === STEPS.length - 1;
  const step = STEPS[stepIdx];

  const advance = () => {
    if (isLast) {
      onDone();
    } else {
      setStepIdx((i) => i + 1);
      Haptics.selectionAsync();
    }
  };

  return (
    <View style={[styles.interactiveOverlay, { justifyContent: 'flex-start', paddingTop: spacing.xl }]}>
      <ScaledText style={styles.phaseTitle}>5-4-3-2-1 Grounding</ScaledText>

      {/* Progress dots */}
      <View style={styles.phaseDots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.phaseDot, i === stepIdx && styles.phaseDotActive]} />
        ))}
      </View>

      <View style={[styles.card, { alignItems: 'center', gap: spacing.md, width: '100%', marginTop: spacing.lg }]}>
        <ScaledText style={{ fontSize: 64, fontWeight: '700', color: colors.primary }}>
          {step.count}
        </ScaledText>
        <ScaledText style={[styles.phaseTitle, { fontSize: 20 }]}>
          things you can{' '}
          <ScaledText style={{ color: colors.primary }}>{step.sense}</ScaledText>
        </ScaledText>
        <ScaledText style={styles.phaseSubtitle}>{step.instruction}</ScaledText>
      </View>

      <ScaledText style={[styles.phaseSubtitle, { marginTop: spacing.md, fontSize: 13 }]}>
        Take your time. There's no rush.
      </ScaledText>

      <TouchableOpacity
        style={[styles.primaryButton, { marginTop: spacing.lg }]}
        onPress={advance}
      >
        <ScaledText style={styles.primaryButtonText}>
          {isLast ? 'Done ✦' : 'Next →'}
        </ScaledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Interactive sub-screen: Cold water on wrists (30 seconds) ───────────────
function ColdWaterInteractive({ onDone }: { onDone: () => void }) {
  const [timeLeft, setTimeLeft] = useState(30);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing water drop
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) { onDone(); return; }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  return (
    <View style={styles.interactiveOverlay}>
      <ScaledText style={styles.phaseTitle}>Cold Water Reset</ScaledText>

      <Animated.Text style={{ fontSize: 72, transform: [{ scale: pulseAnim }] }}>
        💧
      </Animated.Text>

      <ScaledText style={[styles.breathLabel, { textAlign: 'center' }]}>
        Run cold water over your wrists
      </ScaledText>

      <ScaledText style={[styles.timerText, { color: colors.primary, fontSize: 64 }]}>
        {timeLeft}
      </ScaledText>
      <ScaledText style={[styles.phaseSubtitle, { fontSize: 11 }]}>seconds</ScaledText>

      <TouchableOpacity style={[styles.primaryButton, { marginTop: spacing.lg }]} onPress={onDone}>
        <ScaledText style={styles.primaryButtonText}>Done</ScaledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Interactive sub-screen: Wall push-ups (10 reps) ─────────────────────────
function WallPushInteractive({ onDone }: { onDone: () => void }) {
  const TARGET = 10;
  const [reps, setReps] = useState(0);

  const addRep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = reps + 1;
    setReps(next);
    if (next >= TARGET) {
      setTimeout(onDone, 500);
    }
  };

  return (
    <View style={styles.interactiveOverlay}>
      <ScaledText style={styles.phaseTitle}>Wall Push-ups</ScaledText>
      <ScaledText style={[styles.phaseSubtitle, { marginBottom: spacing.lg }]}>
        Place hands on wall, shoulder-width apart
      </ScaledText>

      <ScaledText style={{ fontSize: 20, color: colors.textSecondary, marginBottom: spacing.sm }}>
        Reps completed
      </ScaledText>
      <ScaledText style={[styles.timerText, { color: colors.primary, fontSize: 64 }]}>
        {reps} / {TARGET}
      </ScaledText>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { marginTop: spacing.md, marginBottom: spacing.lg }]}>
        <View style={[styles.progressFill, { width: `${(reps / TARGET) * 100}%` as any }]} />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.tealDark }]}
        onPress={addRep}
        disabled={reps >= TARGET}
        accessibilityRole="button"
        accessibilityLabel={`Count rep, currently ${reps} of ${TARGET}`}
      >
        <ScaledText style={styles.primaryButtonText}>+ Rep</ScaledText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, styles.primaryButtonDisabled, { marginTop: spacing.sm }]}
        onPress={onDone}
      >
        <ScaledText style={[styles.primaryButtonText, { color: colors.textSecondary }]}>Done early</ScaledText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Phase 2: Calm plan (checklist) ──────────────────────────────────────────
function CalmPlanPhase({
  tools,
  onFinish,
}: {
  tools: CalmTool[];
  onFinish: () => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [activeInteractive, setActiveInteractive] = useState<string | null>(null);

  const checkedCount = checked.size;
  const progress = tools.length > 0 ? checkedCount / tools.length : 0;

  const markDone = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return next;
    });
  };

  const openInteractive = (id: string) => {
    setActiveInteractive(id);
  };

  const closeInteractive = (id: string) => {
    setActiveInteractive(null);
    markDone(id);
  };

  // Render the correct interactive sub-screen
  const renderInteractive = () => {
    if (!activeInteractive) return null;
    const id = activeInteractive;
    switch (id) {
      case 'breathe':
        return <BreatheInteractive onDone={() => closeInteractive(id)} />;
      case 'boxbreath':
        return <BoxBreathInteractive onDone={() => closeInteractive(id)} />;
      case 'grounding':
        return <GroundingInteractive onDone={() => closeInteractive(id)} />;
      case 'coldwater':
        return <ColdWaterInteractive onDone={() => closeInteractive(id)} />;
      case 'wallpush':
        return <WallPushInteractive onDone={() => closeInteractive(id)} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollPhaseContainer}
        showsVerticalScrollIndicator={false}
      >
        <ScaledText style={styles.phaseTitle}>Your Calm Plan</ScaledText>
        <ScaledText style={styles.phaseSubtitle}>
          Work through these at your own pace.
        </ScaledText>

        {/* Progress bar */}
        <View style={{ width: '100%', gap: spacing.xs }}>
          <ScaledText style={[styles.phaseSubtitle, { fontSize: 12, textAlign: 'right' }]}>
            {checkedCount} / {tools.length} done
          </ScaledText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
        </View>

        {/* Tool checklist */}
        <View style={{ gap: spacing.sm, width: '100%' }}>
          {tools.map((tool) => {
            const isChecked = checked.has(tool.id);
            return (
              <View
                key={tool.id}
                style={[styles.planCard, isChecked && styles.planCardChecked]}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}
                  onPress={() => !tool.interactive && toggleCheck(tool.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  activeOpacity={tool.interactive ? 1 : 0.7}
                >
                  <ScaledText style={styles.toolEmoji}>{tool.emoji}</ScaledText>
                  <View style={{ flex: 1 }}>
                    <ScaledText style={[styles.planCardTitle, isChecked && styles.planCardTitleChecked]}>
                      {tool.title}
                    </ScaledText>
                    <ScaledText style={styles.toolSub}>{tool.sub}</ScaledText>
                    <ScaledText style={styles.durationHint}>{tool.durationHint}</ScaledText>
                    {tool.interactive && (
                      <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => openInteractive(tool.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Start ${tool.title}`}
                      >
                        <ScaledText style={styles.startButtonText}>Start →</ScaledText>
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[styles.toolCheck, isChecked && styles.toolCheckSelected]}
                    onPress={() => toggleCheck(tool.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isChecked && (
                      <ScaledText style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</ScaledText>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <ScaledText style={[styles.phaseSubtitle, { marginTop: spacing.md, fontSize: 13 }]}>
          You're doing great 💕
        </ScaledText>

        <TouchableOpacity
          style={[styles.primaryButton, checkedCount === 0 && styles.primaryButtonDisabled]}
          onPress={() => checkedCount > 0 && onFinish()}
          disabled={checkedCount === 0}
        >
          <ScaledText style={styles.primaryButtonText}>All done ✦</ScaledText>
        </TouchableOpacity>
      </ScrollView>

      {/* Interactive overlay — rendered on top of checklist */}
      {activeInteractive !== null && (
        <View style={StyleSheet.absoluteFillObject}>
          {renderInteractive()}
        </View>
      )}
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
  const [selectedTools, setSelectedTools] = useState<CalmTool[]>([]);

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
        {phase === 2 && <CalmPlanPhase tools={selectedTools} onFinish={() => setPhase(3)} />}
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
    borderColor: colors.primary,
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

  // ── Plan checklist styles ──────────────────────────────────────────────────
  planCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(35,88,105,0.2)',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  planCardChecked: {
    opacity: 0.5,
  },
  planCardTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  planCardTitleChecked: {
    textDecorationLine: 'line-through',
  },
  startButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  startButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  durationHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  // ── Interactive overlay ────────────────────────────────────────────────────
  interactiveOverlay: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
    zIndex: 10,
  },

  // ── Preset chips ──────────────────────────────────────────────────────────
  presetLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  presetChipActive: {
    backgroundColor: 'rgba(79,179,191,0.12)',
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  presetChipTextActive: {
    color: colors.tealDark,
  },
});
