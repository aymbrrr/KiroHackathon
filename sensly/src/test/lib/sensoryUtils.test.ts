import {
  dbToScore,
  dbToLabel,
  weightedOverallScore,
  scoreToPinStyle,
  computeRiskScore,
  riskToMood,
  riskToLevel,
} from '../../lib/sensoryUtils';

describe('dbToScore — boundaries', () => {
  it('< 40 → 1',  () => expect(dbToScore(39)).toBe(1));
  it('= 40 → 2',  () => expect(dbToScore(40)).toBe(2));
  it('= 54 → 2',  () => expect(dbToScore(54)).toBe(2));
  it('= 55 → 3',  () => expect(dbToScore(55)).toBe(3));
  it('= 69 → 3',  () => expect(dbToScore(69)).toBe(3));
  it('= 70 → 4',  () => expect(dbToScore(70)).toBe(4));
  it('= 84 → 4',  () => expect(dbToScore(84)).toBe(4));
  it('= 85 → 5',  () => expect(dbToScore(85)).toBe(5));
  it('negative → 1', () => expect(dbToScore(-10)).toBe(1));
  it('0 → 1',     () => expect(dbToScore(0)).toBe(1));
  it('200 → 5',   () => expect(dbToScore(200)).toBe(5));
});

describe('weightedOverallScore', () => {
  const all = (v: number) => ({
    avg_noise_db: v === 1 ? 30 : v === 2 ? 45 : v === 3 ? 60 : v === 4 ? 75 : 90,
    avg_lighting: v,
    avg_crowding: v,
    avg_smell: v,
    avg_predictability: v,
  });

  it('all dims at 1 → 1', () => expect(weightedOverallScore(all(1))).toBe(1));
  it('all dims at 5 → 5', () => expect(weightedOverallScore(all(5))).toBe(5));
  it('all dims at 3 → 3', () => expect(weightedOverallScore(all(3))).toBe(3));

  it('re-normalizes when only noise + lighting available', () => {
    const score = weightedOverallScore({
      avg_noise_db: 60, // score 3
      avg_lighting: 3,
      avg_crowding: null,
      avg_smell: null,
      avg_predictability: null,
    });
    expect(score).toBe(3); // both at 3, re-normalized weight still averages to 3
  });

  it('loud noise + calm everything else → score > 2', () => {
    // noise=5 (weight 0.35), all others=1 (weights 0.65 total)
    // weighted = (5*0.35 + 1*0.25 + 1*0.20 + 1*0.15 + 1*0.05) / 1.0 = 1.75+0.65 = 2.4
    const score = weightedOverallScore({
      avg_noise_db: 90, // score 5, weight 0.35
      avg_lighting: 1,
      avg_crowding: 1,
      avg_smell: 1,
      avg_predictability: 1,
    });
    expect(score).toBeGreaterThan(2);
  });

  it('avg_noise_db: 0 is treated as valid (not null)', () => {
    const score = weightedOverallScore({
      avg_noise_db: 0, // score 1
      avg_lighting: null,
      avg_crowding: null,
      avg_smell: null,
      avg_predictability: null,
    });
    expect(score).not.toBeNull();
    expect(score).toBe(1);
  });
});

describe('scoreToPinStyle — boundaries', () => {
  it('2.4 → calm',     () => expect(scoreToPinStyle(2.4)).toMatchObject({ variant: 'calm' }));
  it('2.5 → moderate', () => expect(scoreToPinStyle(2.5)).toMatchObject({ variant: 'moderate' }));
  it('3.4 → moderate', () => expect(scoreToPinStyle(3.4)).toMatchObject({ variant: 'moderate' }));
  it('3.5 → loud',     () => expect(scoreToPinStyle(3.5)).toMatchObject({ variant: 'loud' }));
  it('null → moderate',() => expect(scoreToPinStyle(null)).toMatchObject({ variant: 'moderate' }));
  it('calm has blue circle',    () => expect(scoreToPinStyle(1)).toMatchObject({ color: '#0077BB', shape: 'circle' }));
  it('moderate has orange square', () => expect(scoreToPinStyle(3)).toMatchObject({ color: '#EE7733', shape: 'square' }));
  it('loud has red triangle',   () => expect(scoreToPinStyle(5)).toMatchObject({ color: '#CC3311', shape: 'triangle' }));
});

describe('computeRiskScore', () => {
  it('clamps to 0 for negative inputs', () => {
    expect(computeRiskScore(-100, -100)).toBe(0);
  });
  it('clamps to 100 for very high inputs', () => {
    expect(computeRiskScore(1000, 1000)).toBe(100);
  });
  it('without opts uses sound*0.45 + motion*0.25 formula', () => {
    // 100*0.45 + 100*0.25 = 45 + 25 = 70
    expect(computeRiskScore(100, 100)).toBe(70);
  });
  it('with opts uses noise+crowding formula', () => {
    // noiseRisk = min(100, round(((100-30)/70)*100)) = 100
    // crowdRisk = (5/5)*100 = 100
    // result = round(max(0, min(100, 100*0.6 + 100*0.4))) = 100
    expect(computeRiskScore(100, 0, { crowding: 5 })).toBe(100);
  });
  it('with opts and 0 crowding', () => {
    const result = computeRiskScore(30, 0, { crowding: 0 });
    expect(result).toBe(0); // noiseRisk = 0, crowdRisk = 0
  });
  it('with opts and null crowding', () => {
    const result = computeRiskScore(30, 0, { crowding: null });
    expect(result).toBeGreaterThanOrEqual(0);
  });
  it('Infinity clamps to 100', () => {
    expect(computeRiskScore(Infinity, 0)).toBe(100);
  });
});

describe('riskToMood — boundaries', () => {
  it('0 → happy',    () => expect(riskToMood(0)).toBe('happy'));
  it('35 → happy',   () => expect(riskToMood(35)).toBe('happy'));
  it('36 → thinking',() => expect(riskToMood(36)).toBe('thinking'));
  it('55 → thinking',() => expect(riskToMood(55)).toBe('thinking'));
  it('56 → alert',   () => expect(riskToMood(56)).toBe('alert'));
  it('75 → alert',   () => expect(riskToMood(75)).toBe('alert'));
  it('76 → stressed',() => expect(riskToMood(76)).toBe('stressed'));
  it('100 → stressed',() => expect(riskToMood(100)).toBe('stressed'));
});

describe('riskToLevel', () => {
  it('low risk → calm color', () => {
    expect(riskToLevel(20).color).toBe('#46B7AE');
  });
  it('medium risk → warning color', () => {
    expect(riskToLevel(60).color).toBe('#F2B85B');
  });
  it('high risk → error color', () => {
    expect(riskToLevel(80).color).toBe('#EC7D6E');
  });
  it('returns label and message', () => {
    const level = riskToLevel(20);
    expect(level.label).toBeTruthy();
    expect(level.message).toBeTruthy();
  });
});
