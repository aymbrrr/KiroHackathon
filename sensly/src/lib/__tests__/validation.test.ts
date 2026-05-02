import { validate } from '../validation';

describe('validate.rating', () => {
  it('accepts 1–5', () => {
    [1, 2, 3, 4, 5].forEach(n => expect(validate.rating(n)).toBe(n));
  });
  it('throws on 0',  () => expect(() => validate.rating(0)).toThrow());
  it('throws on 6',  () => expect(() => validate.rating(6)).toThrow());
  it('rounds floats', () => expect(validate.rating(3.4)).toBe(3));
});

describe('validate.db', () => {
  it('clamps to 0–140', () => {
    expect(validate.db(-10)).toBe(0);
    expect(validate.db(200)).toBe(140);
  });
  it('rounds to integer', () => expect(validate.db(62.7)).toBe(63));
  it('throws on NaN',     () => expect(() => validate.db(NaN)).toThrow());
});

describe('validate.noiseThreshold', () => {
  it('accepts 30–100', () => {
    expect(validate.noiseThreshold(55)).toBe(55);
    expect(validate.noiseThreshold(65)).toBe(65);
  });
  it('throws below 30', () => expect(() => validate.noiseThreshold(20)).toThrow());
  it('throws above 100', () => expect(() => validate.noiseThreshold(110)).toThrow());
});

describe('validate.diagnosisTag', () => {
  it('accepts known tags', () => {
    expect(validate.diagnosisTag('autism')).toBe('autism');
    expect(validate.diagnosisTag('ADHD')).toBe('adhd');  // normalizes to lowercase
  });
  it('throws on unknown tag', () =>
    expect(() => validate.diagnosisTag('schizophrenia')).toThrow());
});

describe('validate.text', () => {
  it('trims whitespace', () =>
    expect(validate.text('  hello  ')).toBe('hello'));
  it('truncates to maxLength', () =>
    expect(validate.text('a'.repeat(600), 500)).toHaveLength(500));
});
