/**
 * Input validation and sanitization.
 *
 * All user-provided values pass through here before being sent to Supabase.
 * Supabase JS uses parameterized queries (SQL injection not possible via client),
 * but we validate at the application layer too for defense in depth.
 */

/** Allowed self-reported diagnosis tags — whitelist approach */
const ALLOWED_DIAGNOSIS_TAGS = [
  'autism',
  'adhd',
  'ptsd',
  'spd',           // sensory processing disorder
  'migraine',
  'anxiety',
  'ocd',
  'dyslexia',
  'other',
] as const;

export type DiagnosisTag = typeof ALLOWED_DIAGNOSIS_TAGS[number];

export const validate = {
  /** Trim and truncate free-form text */
  text: (input: string, maxLength = 500): string =>
    input.trim().slice(0, maxLength),

  /** Validate a 1–5 sensory rating */
  rating: (value: number): number => {
    const n = Math.round(value);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }
    return n;
  },

  /** Validate a dB SPL reading (reasonable device mic range) */
  db: (value: number): number => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('dB value must be a number');
    }
    return Math.round(Math.max(0, Math.min(140, value)));
  },

  /** Validate a noise threshold (profile setting) */
  noiseThreshold: (value: number): number => {
    const n = Math.round(value);
    if (n < 30 || n > 100) {
      throw new Error('Noise threshold must be between 30 and 100 dB');
    }
    return n;
  },

  /** Validate a diagnosis tag against the whitelist */
  diagnosisTag: (tag: string): DiagnosisTag => {
    const normalized = tag.toLowerCase().trim() as DiagnosisTag;
    if (!ALLOWED_DIAGNOSIS_TAGS.includes(normalized)) {
      throw new Error(`Unknown diagnosis tag: "${tag}"`);
    }
    return normalized;
  },

  /** Validate an array of diagnosis tags */
  diagnosisTags: (tags: string[]): DiagnosisTag[] =>
    tags.map(validate.diagnosisTag),

  /** Validate latitude */
  lat: (value: number): number => {
    if (value < -90 || value > 90) throw new Error('Invalid latitude');
    return value;
  },

  /** Validate longitude */
  lng: (value: number): number => {
    if (value < -180 || value > 180) throw new Error('Invalid longitude');
    return value;
  },
};
