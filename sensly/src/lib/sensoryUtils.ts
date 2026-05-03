/**
 * Sensory scoring utilities.
 *
 * dB SPL thresholds are research-informed:
 * - Hearing Health Foundation: 70 dB is the upper safe limit for sustained exposure
 * - SPARK for Autism (2021): 50–70% of autistic people experience hypersensitivity
 *   at levels neurotypical people find unremarkable (as low as 55–65 dB)
 * - NIOSH: 85 dB is the occupational hearing damage threshold
 */

// ─── Noise ───────────────────────────────────────────────────────────────────

export type NoiseScore = 1 | 2 | 3 | 4 | 5;

export interface NoiseLevel {
  score: NoiseScore;
  label: string;
  context: string;
  color: string;
}

const NOISE_LEVELS: NoiseLevel[] = [
  { score: 1, label: 'Very quiet',  context: 'Empty library, quiet bedroom',       color: '#0077BB' },
  { score: 2, label: 'Quiet',       context: 'Soft conversation, small café',       color: '#44AA99' },
  { score: 3, label: 'Moderate',    context: 'Busy café, open-plan office',         color: '#EE7733' },
  { score: 4, label: 'Loud',        context: 'Restaurant at peak, busy bar',        color: '#EE3377' },
  { score: 5, label: 'Very loud',   context: 'Hearing risk — NIOSH damage threshold', color: '#CC3311' },
];

/** Convert a dB SPL reading to a 1–5 score */
export function dbToScore(db: number): NoiseScore {
  if (db < 40)  return 1;
  if (db < 55)  return 2;
  if (db < 70)  return 3;
  if (db < 85)  return 4;
  return 5;
}

/** Get the full noise level descriptor for a dB reading */
export function dbToLevel(db: number): NoiseLevel {
  return NOISE_LEVELS[dbToScore(db) - 1];
}

/** Get the human-readable label for a dB reading */
export function dbToLabel(db: number): string {
  return dbToLevel(db).label;
}

// ─── Overall venue score ─────────────────────────────────────────────────────

export interface VenueScores {
  avg_noise_db:        number | null;
  avg_lighting:        number | null;
  avg_crowding:        number | null;
  avg_smell:           number | null;
  avg_predictability:  number | null;
}

/**
 * Weighted overall score for a venue.
 *
 * Weights reflect relative sensory impact for neurodivergent users:
 *   noise:          35% — highest impact, auto-measured
 *   lighting:       25%
 *   crowding:       20%
 *   predictability: 15%
 *   smell:           5%
 *
 * Returns null if no dimensions have data yet.
 */
export function weightedOverallScore(scores: VenueScores): number | null {
  const weights = {
    noise:          0.35,
    lighting:       0.25,
    crowding:       0.20,
    predictability: 0.15,
    smell:          0.05,
  };

  // Convert avg_noise_db to 1–5 scale for weighting
  const noiseScore = scores.avg_noise_db != null
    ? dbToScore(scores.avg_noise_db)
    : null;

  const dimensions = [
    { value: noiseScore,               weight: weights.noise },
    { value: scores.avg_lighting,      weight: weights.lighting },
    { value: scores.avg_crowding,      weight: weights.crowding },
    { value: scores.avg_predictability,weight: weights.predictability },
    { value: scores.avg_smell,         weight: weights.smell },
  ];

  const available = dimensions.filter(d => d.value != null);
  if (available.length === 0) return null;

  // Re-normalize weights to available dimensions
  const totalWeight = available.reduce((sum, d) => sum + d.weight, 0);
  const weighted = available.reduce(
    (sum, d) => sum + (d.value! * d.weight),
    0
  );

  return Math.round((weighted / totalWeight) * 10) / 10;
}

// ─── Pin colors (colorblind-safe: blue/orange/red + shape redundancy) ────────

export type PinVariant = 'calm' | 'moderate' | 'loud';

export interface PinStyle {
  variant:  PinVariant;
  color:    string;   // hex
  shape:    'circle' | 'square' | 'triangle';
  label:    string;
}

const PIN_STYLES: Record<PinVariant, PinStyle> = {
  calm:     { variant: 'calm',     color: '#0077BB', shape: 'circle',   label: 'Sensory-friendly' },
  moderate: { variant: 'moderate', color: '#EE7733', shape: 'square',   label: 'Moderate'         },
  loud:     { variant: 'loud',     color: '#CC3311', shape: 'triangle', label: 'High-stimulation' },
};

/** Get the colorblind-safe pin style for an overall score */
export function scoreToPinStyle(score: number | null): PinStyle {
  if (score == null) return PIN_STYLES.moderate; // unknown → neutral
  if (score <= 2.4)  return PIN_STYLES.calm;
  if (score <= 3.4)  return PIN_STYLES.moderate;
  return PIN_STYLES.loud;
}

// ─── Live environment risk score ──────────────────────────────────────────────

/**
 * Composite risk score from live sensor readings.
 * Formula from designer's Dashboard.tsx:
 *   risk = clamp(sound * 0.45 + motion * 0.25 + light / 35, 0, 100)
 *
 * Returns 0–100. Used to drive axolotl mood and alert state.
 */
export function computeRiskScore(soundDb: number, motionLevel: number): number {
  return Math.round(Math.max(0, Math.min(100, soundDb * 0.45 + motionLevel * 0.25)));
}

/**
 * Map a risk score to an axolotl mood.
 * Matches the designer's moodCopy thresholds in Dashboard.tsx.
 */
export type AxolotlMood = 'happy' | 'thinking' | 'alert' | 'stressed' | 'relieved';

export function riskToMood(risk: number): AxolotlMood {
  if (risk > 75) return 'stressed';
  if (risk > 55) return 'alert';
  if (risk > 35) return 'thinking';
  return 'happy';
}

export interface RiskLevel {
  label: string;
  message: string;
  color: string;
}

export function riskToLevel(risk: number): RiskLevel {
  if (risk > 75) return { label: 'Support recommended', message: 'Try a sensory reset soon.', color: '#EC7D6E' };
  if (risk > 55) return { label: 'Stress may be rising', message: 'Noise and motion are trending up.', color: '#F2B85B' };
  return { label: 'All systems calm', message: 'You seem regulated right now.', color: '#46B7AE' };
}
