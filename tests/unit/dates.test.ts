import { describe, expect, it } from 'vitest';
import { dateSortKey, parseDate } from '../../src/core/dates';

describe('parseDate', () => {
  // Every row of the table in docs/concept/data-model.md §4.
  it.each([
    ['12.03.1923', { y: 1923, m: 3, d: 12 }],
    ['12.3.1923', { y: 1923, m: 3, d: 12 }],
    ['1. 2. 1923', { y: 1923, m: 2, d: 1 }],
    ['03.1923', { y: 1923, m: 3 }],
    ['März 1923', { y: 1923, m: 3 }],
    ['Mär. 1923', { y: 1923, m: 3 }],
    ['maerz 1923', { y: 1923, m: 3 }],
    ['Dez 1923', { y: 1923, m: 12 }],
    ['1923', { y: 1923 }],
    ['850', { y: 850 }],
    ['ca. 1850', { y: 1850, q: 'about' }],
    ['ca 1850', { y: 1850, q: 'about' }],
    ['um 1850', { y: 1850, q: 'about' }],
    ['~1850', { y: 1850, q: 'about' }],
    ['Um 1850', { y: 1850, q: 'about' }],
    ['vor 1900', { y: 1900, q: 'before' }],
    ['nach 1900', { y: 1900, q: 'after' }],
    ['zw. 1890 und 1895', { y: 1890, q: 'between', y2: 1895 }],
    ['zwischen 1890 und 1895', { y: 1890, q: 'between', y2: 1895 }],
    ['1890-1895', { y: 1890, q: 'between', y2: 1895 }],
    ['1890 – 1895', { y: 1890, q: 'between', y2: 1895 }],
    ['1890 bis 1895', { y: 1890, q: 'between', y2: 1895 }],
    ['Ostern 1923', { text: 'Ostern 1923' }],
  ])('reads %j', (input, expected) => {
    expect(parseDate(input)).toEqual(expected);
  });

  // GEN-05: English and French input is understood too, whatever the UI language. Always day before month.
  it.each([
    ['12/03/1923', { y: 1923, m: 3, d: 12 }],
    ['03/1923', { y: 1923, m: 3 }],
    ['12 Mar 1923', { y: 1923, m: 3, d: 12 }],
    ['12 March 1923', { y: 1923, m: 3, d: 12 }],
    ['12. März 1923', { y: 1923, m: 3, d: 12 }],
    ['May 1923', { y: 1923, m: 5 }],
    ['Sept. 1923', { y: 1923, m: 9 }],
    ['about 1850', { y: 1850, q: 'about' }],
    ['abt. 1850', { y: 1850, q: 'about' }],
    ['c. 1850', { y: 1850, q: 'about' }],
    ['circa 1850', { y: 1850, q: 'about' }],
    ['before 1900', { y: 1900, q: 'before' }],
    ['bef. 1900', { y: 1900, q: 'before' }],
    ['after 1900', { y: 1900, q: 'after' }],
    ['aft. 1900', { y: 1900, q: 'after' }],
    ['between 1890 and 1895', { y: 1890, q: 'between', y2: 1895 }],
    ['1890 to 1895', { y: 1890, q: 'between', y2: 1895 }],
    ['1er mars 1923', { y: 1923, m: 3, d: 1 }],
    ['12 février 1923', { y: 1923, m: 2, d: 12 }],
    ['fevrier 1923', { y: 1923, m: 2 }],
    ['août 1923', { y: 1923, m: 8 }],
    ['déc. 1923', { y: 1923, m: 12 }],
    ['juin 1923', { y: 1923, m: 6 }],
    ['juil. 1923', { y: 1923, m: 7 }],
    ['vers 1850', { y: 1850, q: 'about' }],
    ['env. 1850', { y: 1850, q: 'about' }],
    ['avant 1900', { y: 1900, q: 'before' }],
    ['av. 1900', { y: 1900, q: 'before' }],
    ['après 1900', { y: 1900, q: 'after' }],
    ['ap. 1900', { y: 1900, q: 'after' }],
    ['<1900', { y: 1900, q: 'before' }],
    ['> 1900', { y: 1900, q: 'after' }],
    ['entre 1890 et 1895', { y: 1890, q: 'between', y2: 1895 }],
    ['1890 à 1895', { y: 1890, q: 'between', y2: 1895 }],
  ])('reads %j (English, French)', (input, expected) => {
    expect(parseDate(input)).toEqual(expected);
  });

  // "v." could mean "vers" or "vor": a German "v. 1900" must not turn into "about 1900".
  it('keeps "v. 1900" as text', () => {
    expect(parseDate('v. 1900')).toEqual({ text: 'v. 1900' });
  });

  it('keeps an abbreviation that fits two months as text ("jui": juin or juillet)', () => {
    expect(parseDate('jui 1923')).toEqual({ text: 'jui 1923' });
  });

  it('trims surrounding spaces', () => {
    expect(parseDate('  1923 ')).toEqual({ y: 1923 });
  });

  it('returns undefined for empty input', () => {
    expect(parseDate('')).toBeUndefined();
    expect(parseDate('   ')).toBeUndefined();
  });

  it.each([
    '31.02.1923', // no such day
    '29.02.1923', // not a leap year
    '00.03.1923',
    '12.13.1923', // month 13
    '13.1923',
    '12.03.23', // two-digit years are ambiguous
    'Mai', // no year
    'Ma 1923', // too short to tell Mai from März
    '30 February 1923', // no such day
    'entre 1895 et 1890', // range backwards
    '1895-1890', // range backwards
    '1890-1890',
  ])('keeps %j as text instead of guessing', (input) => {
    expect(parseDate(input)).toEqual({ text: input });
  });

  it('accepts 29 February in a leap year', () => {
    expect(parseDate('29.02.1924')).toEqual({ y: 1924, m: 2, d: 29 });
  });
});

describe('dateSortKey', () => {
  it('orders day, month and year precision', () => {
    expect(dateSortKey({ y: 1923, m: 3, d: 12 })).toBe(19230312);
    expect(dateSortKey({ y: 1923, m: 3 })).toBe(19230300);
    expect(dateSortKey({ y: 1923 })).toBe(19230000);
  });

  it('sorts qualified dates by their (first) year', () => {
    expect(dateSortKey({ y: 1850, q: 'about' })).toBe(18500000);
    expect(dateSortKey({ y: 1900, q: 'before' })).toBe(19000000);
    expect(dateSortKey({ y: 1890, q: 'between', y2: 1895 })).toBe(18900000);
  });

  it('has no key for text dates or missing dates', () => {
    expect(dateSortKey({ text: 'Ostern 1923' })).toBeUndefined();
    expect(dateSortKey(undefined)).toBeUndefined();
  });
});
