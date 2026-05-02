/**
 * Sensory scale constants — labels, ranges, and defaults.
 *
 * Lighting scale is research-backed:
 * - Autism-friendly lighting: warm white 2700K–3000K, < 300 lux (neurolaunch.com)
 * - Fluorescent/cool white > 4000K consistently associated with sensory distress
 * - ADHD and migraine sufferers also benefit from warm, lower-intensity lighting
 */

// ─── Lighting ─────────────────────────────────────────────────────────────────

export const LIGHTING_SCALE = [
  {
    score: 1,
    label: 'Very dim',
    illuminance: '< 50 lux',
    colorTemp: 'Warm (2700K)',
    example: 'Candlelit restaurant, dim lounge',
  },
  {
    score: 2,
    label: 'Dim',
    illuminance: '50–150 lux',
    colorTemp: 'Warm white (2700–3000K)',
    example: 'Cozy café, bookshop',
  },
  {
    score: 3,
    label: 'Moderate',
    illuminance: '150–300 lux',
    colorTemp: 'Neutral white (3000–4000K)',
    example: 'Standard office, casual restaurant',
  },
  {
    score: 4,
    label: 'Bright',
    illuminance: '300–500 lux',
    colorTemp: 'Cool white (4000K+)',
    example: 'Supermarket, fast food',
  },
  {
    score: 5,
    label: 'Harsh',
    illuminance: '> 500 lux',
    colorTemp: 'Daylight/fluorescent (5000K+)',
    example: 'Hospital, big-box retail, stadium',
  },
] as const;

// ─── Crowding ─────────────────────────────────────────────────────────────────

export const CROWDING_SCALE = [
  { score: 1, label: 'Empty',    description: 'Almost no one here' },
  { score: 2, label: 'Quiet',    description: 'A few people, plenty of space' },
  { score: 3, label: 'Moderate', description: 'Noticeable but manageable' },
  { score: 4, label: 'Busy',     description: 'Crowded, limited personal space' },
  { score: 5, label: 'Packed',   description: 'Very crowded, overwhelming' },
] as const;

// ─── Smell ────────────────────────────────────────────────────────────────────

export const SMELL_SCALE = [
  { score: 1, label: 'Neutral',      description: 'No noticeable smell' },
  { score: 2, label: 'Mild',         description: 'Faint, pleasant or neutral' },
  { score: 3, label: 'Noticeable',   description: 'Present but not overwhelming' },
  { score: 4, label: 'Strong',       description: 'Hard to ignore' },
  { score: 5, label: 'Overwhelming', description: 'Very strong, may cause distress' },
] as const;

// ─── Predictability ───────────────────────────────────────────────────────────

export const PREDICTABILITY_SCALE = [
  { score: 1, label: 'Chaotic',      description: 'Unpredictable, constantly changing' },
  { score: 2, label: 'Variable',     description: 'Some unpredictability' },
  { score: 3, label: 'Moderate',     description: 'Mostly predictable' },
  { score: 4, label: 'Consistent',   description: 'Reliable, few surprises' },
  { score: 5, label: 'Very routine', description: 'Highly predictable environment' },
] as const;

// ─── Noise threshold defaults by profile type ─────────────────────────────────
// Research basis: SPARK for Autism (2021), Hearing Health Foundation, NIOSH

export const NOISE_THRESHOLD_DEFAULTS: Record<string, number> = {
  autism:   55,  // 50–70% of autistic people hypersensitive at everyday levels
  spd:      55,  // sensory processing disorder — similar profile to autism
  migraine: 55,  // phonophobia during and between episodes
  ptsd:     60,  // hypervigilance lowers effective tolerance
  anxiety:  60,
  adhd:     65,  // real sensitivity but typically less acute than autism hyperacusis
  ocd:      65,
  dyslexia: 65,
  other:    65,
  default:  65,  // below 70 dB Hearing Health Foundation safe limit
};

// ─── Trigger options for onboarding ──────────────────────────────────────────

export const TRIGGER_OPTIONS = {
  sound: [
    'Loud music',
    'Crowds talking',
    'Sirens',
    'High-pitched sounds',
    'Sudden noises',
    'Background TV/radio',
    'Echoing spaces',
  ],
  lighting: [
    'Fluorescent lights',
    'Bright sunlight',
    'Flickering lights',
    'Dim lighting',
    'Screens at night',
  ],
  smell: [
    'Perfume / cologne',
    'Food smells',
    'Cleaning products',
    'Smoke',
    'Petrol / chemicals',
  ],
  texture: [
    'Certain fabrics',
    'Sticky surfaces',
    'Wet surfaces',
  ],
  unpredictability: [
    'Unexpected changes',
    'Loud announcements',
    'Busy visual environments',
    'Queues / waiting',
    'Unfamiliar places',
  ],
} as const;
