import {
  dbToScore,
  dbToLabel,
  weightedOverallScore,
  scoreToPinStyle,
} from '../sensoryUtils';

describe('dbToScore', () => {
  it('maps < 40 dB to score 1', () => expect(dbToScore(35)).toBe(1));
  it('maps 40 dB to score 2',   () => expect(dbToScore(40)).toBe(2));
  it('maps 54 dB to score 2',   () => expect(dbToScore(54)).toBe(2));
  it('maps 55 dB to score 3',   () => expect(dbToScore(55)).toBe(3));
  it('maps 69 dB to score 3',   () => expect(dbToScore(69)).toBe(3));
  it('maps 70 dB to score 4',   () => expect(dbToScore(70)).toBe(4));
  it('maps 84 dB to score 4',   () => expect(dbToScore(84)).toBe(4));
  it('maps 85 dB to score 5',   () => expect(dbToScore(85)).toBe(5));
  it('maps 100 dB to score 5',  () => expect(dbToScore(100)).toBe(5));
});

describe('dbToLabel', () => {
  it('returns "Very quiet" for 35 dB',  () => expect(dbToLabel(35)).toBe('Very quiet'));
  it('returns "Moderate" for 60 dB',    () => expect(dbToLabel(60)).toBe('Moderate'));
  it('returns "Very loud" for 90 dB',   () => expect(dbToLabel(90)).toBe('Very loud'));
});

describe('weightedOverallScore', () => {
  it('returns null when all dimensions are null', () => {
    expect(weightedOverallScore({
      avg_noise_db: null, avg_lighting: null, avg_crowding: null,
      avg_smell: null, avg_predictability: null,
    })).toBeNull();
  });

  it('returns a score when only noise is available', () => {
    const score = weightedOverallScore({
      avg_noise_db: 55, avg_lighting: null, avg_crowding: null,
      avg_smell: null, avg_predictability: null,
    });
    expect(score).not.toBeNull();
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(5);
  });

  it('weights noise at 35% of the total', () => {
    // All dimensions at score 3 → overall should be 3
    const score = weightedOverallScore({
      avg_noise_db: 60,  // score 3
      avg_lighting: 3,
      avg_crowding: 3,
      avg_smell: 3,
      avg_predictability: 3,
    });
    expect(score).toBe(3);
  });
});

describe('scoreToPinStyle', () => {
  it('returns calm (blue/circle) for score 1.0', () =>
    expect(scoreToPinStyle(1.0)).toMatchObject({ variant: 'calm', shape: 'circle', color: '#0077BB' }));

  it('returns calm (blue/circle) for score 2.4', () =>
    expect(scoreToPinStyle(2.4)).toMatchObject({ variant: 'calm' }));

  it('returns moderate (orange/square) for score 2.5', () =>
    expect(scoreToPinStyle(2.5)).toMatchObject({ variant: 'moderate', shape: 'square', color: '#EE7733' }));

  it('returns loud (red/triangle) for score 3.5', () =>
    expect(scoreToPinStyle(3.5)).toMatchObject({ variant: 'loud', shape: 'triangle', color: '#CC3311' }));

  it('returns moderate for null score', () =>
    expect(scoreToPinStyle(null)).toMatchObject({ variant: 'moderate' }));
});
