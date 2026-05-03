/**
 * Design tokens for Sensly.
 *
 * Color system is neurodivergent-friendly:
 * - Off-white background (#F8F6F2) reduces glare for photosensitive users
 * - Muted, desaturated palette reduces visual stress for autistic users
 * - All text/background pairs meet WCAG AA (4.5:1); Self mode targets AAA (7:1)
 * - Colorblind-safe venue pins use blue/orange/red + shape redundancy (see sensoryUtils.ts)
 * - No pure red/green pairs as primary signals (deuteranopia affects ~6% of men)
 */

export const colors = {
  // Backgrounds
  background:       '#F0FAFB',  // calm teal-tinted off-white
  backgroundMuted:  '#EFEDE8',
  surface:          'rgba(255,255,255,0.85)',
  surfaceMuted:     '#E8F6F8',

  // Text
  textPrimary:      '#1A4D55',  // deep teal — replaces warm near-black
  textSecondary:    '#426773',
  textMuted:        '#5d7b86',
  textInverse:      '#FFFFFF',

  // Brand
  primary:          '#4FB3BF',  // teal — designer's primary
  primaryMuted:     '#E8F6F8',

  // Extended teal palette (designer tokens)
  tealLight:        '#7DCDD6',
  tealDark:         '#2A8A96',
  tealPale:         '#B8E5EA',
  bgCalm:           '#F0FAFB',
  bgGentle:         '#E8F6F8',

  // Sensory score colors (colorblind-safe)
  calm:             '#0077BB',  // blue  — score 1.0–2.4
  moderate:         '#EE7733',  // orange — score 2.5–3.4
  loud:             '#CC3311',  // red   — score 3.5–5.0

  // Semantic
  success:          '#44AA99',  // teal — not green (avoids red/green confusion)
  warning:          '#EE7733',  // orange
  error:            '#CC3311',  // red
  info:             '#0077BB',  // blue

  // UI
  border:           'rgba(79,179,191,0.2)',
  borderMuted:      'rgba(79,179,191,0.15)',
  overlay:          'rgba(26, 24, 20, 0.5)',
} as const;

export const spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
} as const;

export const radius = {
  sm:   4,
  md:   8,
  lg:   16,
  full: 9999,
} as const;

/**
 * Typography scale.
 *
 * Self mode uses larger sizes (minimum 20sp) for use during sensory overload.
 * Support mode uses standard sizes (minimum 16sp).
 * Line height is always 1.5× font size — tight line spacing is a primary dyslexia barrier.
 */
export const typography = {
  // Support mode (standard)
  bodyLg:   { fontSize: 18, lineHeight: 27 },
  body:     { fontSize: 16, lineHeight: 24 },
  bodySm:   { fontSize: 14, lineHeight: 21 },
  label:    { fontSize: 14, lineHeight: 21, fontWeight: '600' as const },
  caption:  { fontSize: 12, lineHeight: 18 },
  heading1: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  heading2: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  heading3: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },

  // Self mode overrides (applied when settingsStore.uiMode === 'self')
  self: {
    body:     { fontSize: 20, lineHeight: 30 },
    bodySm:   { fontSize: 18, lineHeight: 27 },
    label:    { fontSize: 18, lineHeight: 27, fontWeight: '600' as const },
    heading2: { fontSize: 26, lineHeight: 34, fontWeight: '700' as const },
  },
} as const;

/**
 * Animation constraints.
 *
 * Caps enforce neurodivergent-friendly motion:
 * - 200ms max for transitions (ADHD cognitive load)
 * - 300ms max for gauge fills
 * - No looping animations anywhere in the app
 * - All animations check reduceMotionEnabled and fall back to instant
 */
export const animation = {
  fast:    150,
  normal:  200,
  slow:    300,  // max — only for dB gauge arc fill
} as const;

/** Minimum tap target size (WCAG 2.5.5 — 44×44pt minimum) */
export const tapTarget = {
  min: 44,
  selfMode: 56,  // larger in Self mode for use during sensory overload
} as const;

/**
 * Frosted glass card style — designer's exact spec.
 * Use as a base style for cards throughout the app.
 */
export const frostedCard = {
  backgroundColor: 'rgba(255,255,255,0.45)',
  borderWidth: 2,
  borderColor: 'rgba(35,88,105,0.35)',
  borderRadius: 20,
  shadowColor: '#43818F',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 3,
} as const;
