import {
  NOISE_THRESHOLD_DEFAULTS,
  LIGHTING_SCALE,
  CROWDING_SCALE,
  SMELL_SCALE,
  PREDICTABILITY_SCALE,
  TRIGGER_OPTIONS,
} from '../../constants/sensoryScales';

/**
 * These tests lock in research-backed clinical constants.
 * A refactor that accidentally changes autism: 55 → 65 would silently
 * break the product's core safety promise to neurodivergent users.
 *
 * Sources: SPARK for Autism (2021), Hearing Health Foundation,
 * NIOSH, Cleveland Clinic, Frontiers in Psychiatry.
 */
describe('NOISE_THRESHOLD_DEFAULTS — clinical thresholds', () => {
  it('autism = 55 dB (SPARK 2021: hypersensitivity at everyday levels)', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.autism).toBe(55));
  it('spd = 55 dB (similar profile to autism)', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.spd).toBe(55));
  it('migraine = 55 dB (phonophobia threshold)', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.migraine).toBe(55));
  it('ptsd = 60 dB (hypervigilance lowers tolerance)', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.ptsd).toBe(60));
  it('anxiety = 60 dB', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.anxiety).toBe(60));
  it('adhd = 65 dB (real sensitivity, less acute than autism hyperacusis)', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.adhd).toBe(65));
  it('ocd = 65 dB', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.ocd).toBe(65));
  it('dyslexia = 65 dB', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.dyslexia).toBe(65));
  it('default = 65 dB (below 70 dB HHF safe limit)', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.default).toBe(65));
  it('other = 65 dB', () =>
    expect(NOISE_THRESHOLD_DEFAULTS.other).toBe(65));
});

describe('Scale arrays — 5 entries each (scores 1–5)', () => {
  it('LIGHTING_SCALE has 5 entries', () => expect(LIGHTING_SCALE).toHaveLength(5));
  it('CROWDING_SCALE has 5 entries', () => expect(CROWDING_SCALE).toHaveLength(5));
  it('SMELL_SCALE has 5 entries', () => expect(SMELL_SCALE).toHaveLength(5));
  it('PREDICTABILITY_SCALE has 5 entries', () => expect(PREDICTABILITY_SCALE).toHaveLength(5));

  it('LIGHTING_SCALE scores are 1–5 in order', () => {
    LIGHTING_SCALE.forEach((entry, i) => expect(entry.score).toBe(i + 1));
  });
  it('CROWDING_SCALE scores are 1–5 in order', () => {
    CROWDING_SCALE.forEach((entry, i) => expect(entry.score).toBe(i + 1));
  });
});

describe('TRIGGER_OPTIONS — all 5 categories present', () => {
  it('has sound triggers', () => expect(TRIGGER_OPTIONS.sound.length).toBeGreaterThan(0));
  it('has lighting triggers', () => expect(TRIGGER_OPTIONS.lighting.length).toBeGreaterThan(0));
  it('has smell triggers', () => expect(TRIGGER_OPTIONS.smell.length).toBeGreaterThan(0));
  it('has texture triggers', () => expect(TRIGGER_OPTIONS.texture.length).toBeGreaterThan(0));
  it('has unpredictability triggers', () => expect(TRIGGER_OPTIONS.unpredictability.length).toBeGreaterThan(0));
});
