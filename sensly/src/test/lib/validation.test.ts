import { validate } from '../../lib/validation';

describe('validate.text — sanitization', () => {
  it('trims whitespace', () => expect(validate.text('  hello  ')).toBe('hello'));
  it('truncates to default 500', () => expect(validate.text('a'.repeat(600))).toHaveLength(500));
  it('truncates to custom maxLength', () => expect(validate.text('a'.repeat(20), 10)).toHaveLength(10));
  it('empty string returns empty', () => expect(validate.text('')).toBe(''));

  // Unicode control character attacks
  it('strips zero-width space \\u200B', () =>
    expect(validate.text('hel\u200Blo')).toBe('hello'));
  it('strips zero-width non-joiner \\u200C', () =>
    expect(validate.text('hel\u200Clo')).toBe('hello'));
  it('strips zero-width joiner \\u200D', () =>
    expect(validate.text('hel\u200Dlo')).toBe('hello'));
  it('strips RTL override \\u202E (bidirectional text attack)', () =>
    expect(validate.text('hel\u202Elo')).toBe('hello'));
  it('strips LTR override \\u202D', () =>
    expect(validate.text('hel\u202Dlo')).toBe('hello'));
  it('strips BOM \\uFEFF', () =>
    expect(validate.text('\uFEFFhello')).toBe('hello'));

  it('preserves normal unicode (emoji)', () =>
    expect(validate.text('hello 🌊')).toBe('hello 🌊'));
  it('preserves accented characters', () =>
    expect(validate.text('café')).toBe('café'));
  it('preserves CJK characters', () =>
    expect(validate.text('你好')).toBe('你好'));
});

describe('validate.rating', () => {
  it('accepts 1–5', () => [1, 2, 3, 4, 5].forEach(n => expect(validate.rating(n)).toBe(n)));
  it('throws on 0',  () => expect(() => validate.rating(0)).toThrow());
  it('throws on 6',  () => expect(() => validate.rating(6)).toThrow());
  it('throws on negative', () => expect(() => validate.rating(-1)).toThrow());
  it('rounds 3.4 → 3', () => expect(validate.rating(3.4)).toBe(3));
  it('rounds 4.5 → 5', () => expect(validate.rating(4.5)).toBe(5));
  it('throws on 5.5 (rounds to 6)', () => expect(() => validate.rating(5.5)).toThrow());
});

describe('validate.db', () => {
  it('clamps -10 → 0',   () => expect(validate.db(-10)).toBe(0));
  it('clamps 200 → 140', () => expect(validate.db(200)).toBe(140));
  it('rounds 62.7 → 63', () => expect(validate.db(62.7)).toBe(63));
  it('throws on NaN',    () => expect(() => validate.db(NaN)).toThrow());
  it('clamps Infinity → 140',  () => expect(validate.db(Infinity)).toBe(140));
  it('clamps -Infinity → 0',   () => expect(validate.db(-Infinity)).toBe(0));
  it('accepts 0',        () => expect(validate.db(0)).toBe(0));
  it('accepts 140',      () => expect(validate.db(140)).toBe(140));
});

describe('validate.noiseThreshold', () => {
  it('accepts 30',  () => expect(validate.noiseThreshold(30)).toBe(30));
  it('accepts 100', () => expect(validate.noiseThreshold(100)).toBe(100));
  it('accepts 65',  () => expect(validate.noiseThreshold(65)).toBe(65));
  it('throws on 29',  () => expect(() => validate.noiseThreshold(29)).toThrow());
  it('throws on 101', () => expect(() => validate.noiseThreshold(101)).toThrow());
});

describe('validate.diagnosisTag — security', () => {
  it('accepts known tags', () =>
    ['autism', 'adhd', 'ptsd', 'spd', 'migraine', 'anxiety', 'ocd', 'dyslexia', 'other']
      .forEach(tag => expect(validate.diagnosisTag(tag)).toBe(tag)));
  it('normalizes to lowercase', () => expect(validate.diagnosisTag('AUTISM')).toBe('autism'));
  it('normalizes mixed case', () => expect(validate.diagnosisTag('Adhd')).toBe('adhd'));
  it('trims whitespace', () => expect(validate.diagnosisTag(' autism ')).toBe('autism'));
  it('throws on unknown tag', () => expect(() => validate.diagnosisTag('schizophrenia')).toThrow());
  it('throws on SQL injection attempt', () =>
    expect(() => validate.diagnosisTag("autism'; DROP TABLE profiles;--")).toThrow());
  it('throws on XSS attempt', () =>
    expect(() => validate.diagnosisTag('<script>alert(1)</script>')).toThrow());
  it('throws on empty string', () => expect(() => validate.diagnosisTag('')).toThrow());
});

describe('validate.diagnosisTags', () => {
  it('empty array returns []', () => expect(validate.diagnosisTags([])).toEqual([]));
  it('valid array returns normalized', () =>
    expect(validate.diagnosisTags(['autism', 'ADHD'])).toEqual(['autism', 'adhd']));
  it('throws on first invalid tag', () =>
    expect(() => validate.diagnosisTags(['autism', 'invalid'])).toThrow());
});

describe('validate.lat / validate.lng', () => {
  it('lat accepts -90',  () => expect(validate.lat(-90)).toBe(-90));
  it('lat accepts 90',   () => expect(validate.lat(90)).toBe(90));
  it('lat throws -91',   () => expect(() => validate.lat(-91)).toThrow());
  it('lat throws 91',    () => expect(() => validate.lat(91)).toThrow());
  it('lng accepts -180', () => expect(validate.lng(-180)).toBe(-180));
  it('lng accepts 180',  () => expect(validate.lng(180)).toBe(180));
  it('lng throws -181',  () => expect(() => validate.lng(-181)).toThrow());
  it('lng throws 181',   () => expect(() => validate.lng(181)).toThrow());
});
