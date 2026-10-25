import { describe, expect, it } from 'vitest';
import { parseDate } from '../../../src/core/dates';
import type { FlexDate, Partnership, Person } from '../../../src/core/model/types';
import {
  cardLine,
  childWord,
  dateHint,
  errorText,
  eventText,
  fmtDate,
  fmtYear,
  fullName,
  initials,
  kindLabel,
  parentWord,
  partnershipDetail,
  partnerWord,
  personFacts,
  shortName,
  siblingWord,
  tooltipLines,
  yearsLine,
} from '../../../src/ui/text';
import { de } from '../../../src/ui/i18n/de';
import { familieBrandt } from '../../fixtures/familie-brandt';

const anna: Person = {
  id: 'a',
  givenNames: 'Anna Maria',
  surname: 'Müller',
  birthName: 'Schmidt',
  gender: 'female',
  birth: { date: { y: 1923, m: 3, d: 12 }, place: 'Kiel' },
  death: { date: { y: 2001 } },
};
const kim: Person = { id: 'k', givenNames: 'Kim' };
const unknown: Person = { id: 'u' };
const couple = (fields: Omit<Partnership, 'id' | 'partners'>): Partnership => ({
  id: 'r',
  partners: ['a', 'b'],
  ...fields,
});

describe('dates (PERS-06)', () => {
  it('shows a date as precisely as it is known', () => {
    expect(fmtDate({ y: 1923, m: 3, d: 12 })).toBe('12.03.1923');
    expect(fmtDate({ y: 1923, m: 3 })).toBe('03.1923');
    expect(fmtDate({ y: 1923 })).toBe('1923');
    expect(fmtDate({ y: 1850, q: 'about' })).toBe('ca. 1850');
    expect(fmtDate({ y: 1900, q: 'before' })).toBe('vor 1900');
    expect(fmtDate({ y: 1900, q: 'after' })).toBe('nach 1900');
    expect(fmtDate({ y: 1890, q: 'between', y2: 1895 })).toBe('1890 bis 1895');
    expect(fmtDate({ text: 'Ostern 1920' })).toBe('Ostern 1920');
    expect(fmtDate(undefined)).toBe('');
  });

  it('shows only the year in lists, keeping the qualifier', () => {
    expect(fmtYear({ y: 1923, m: 3, d: 12 })).toBe('1923');
    expect(fmtYear({ y: 1850, q: 'about' })).toBe('ca. 1850');
    expect(fmtYear({ text: 'Ostern 1920' })).toBe('Ostern 1920');
  });

  it('joins date and place', () => {
    expect(eventText(anna.birth)).toBe('12.03.1923 in Kiel');
    expect(eventText({ place: 'Kiel' })).toBe('in Kiel');
    expect(eventText(undefined)).toBe('');
  });
});

describe('card and names (PERS-04)', () => {
  it('shows birth and death years', () => {
    expect(yearsLine(anna)).toBe('* 1923 † 2001');
    expect(yearsLine({ id: 'x', deceased: true })).toBe('†');
    expect(yearsLine(kim)).toBe('');
  });

  it('gives the card years only, with symbols for vague dates in every language', () => {
    expect(cardLine(anna)).toBe('* 1923\u2002† 2001');
    expect(cardLine({ id: 'x', birth: { date: { y: 1923, m: 3 } } })).toBe('* 1923');
    const vague = (date: FlexDate) => cardLine({ id: 'x', birth: { date } });
    expect(vague({ y: 1850, q: 'about' })).toBe('* ~1850');
    expect(vague({ y: 1900, q: 'before' })).toBe('* <1900');
    expect(vague({ y: 1900, q: 'after' })).toBe('* >1900');
    expect(vague({ y: 1890, q: 'between', y2: 1895 })).toBe('* 1890/1895');
    expect(vague({ text: 'Ostern 1920' })).toBe('* Ostern 1920');
  });

  it('uses all given names for the full name and the first one for the short name', () => {
    expect(fullName(anna)).toBe('Anna Maria Müller');
    expect(shortName(anna)).toBe('Anna Müller');
    expect(shortName({ id: 'x', givenNames: 'Karl Otto', surname: 'Brandt' })).toBe('Karl Brandt');
    expect(fullName({ id: 'x', occupation: 'Fischer' })).toBe('Ohne Namen');
    expect(fullName(unknown)).toBe('Unbekannt');
    expect(shortName(unknown)).toBe('Unbekannt');
  });

  it('builds initials for the photo placeholder', () => {
    expect(initials(anna)).toBe('AM');
    expect(initials(kim)).toBe('K');
    expect(initials(unknown)).toBe('?');
  });
});

describe('wording (PERS-07)', () => {
  it('uses gendered words only when a gender is set', () => {
    expect(parentWord(anna)).toBe('Mutter');
    expect(parentWord({ id: 'x', gender: 'male' })).toBe('Vater');
    expect(parentWord(kim)).toBe('Elternteil');
    expect(parentWord({ id: 'x', gender: 'diverse' })).toBe('Elternteil');
    expect(childWord(anna)).toBe('Tochter');
    expect(childWord(kim)).toBe('Kind');
  });

  it('prefixes adoptive, step and foster relations', () => {
    expect(parentWord(anna, 'adoptive')).toBe('Adoptivmutter');
    expect(parentWord({ id: 'x', gender: 'male' }, 'step')).toBe('Stiefvater');
    expect(childWord(kim, 'foster')).toBe('Pflegekind');
    expect(childWord(anna, 'biological')).toBe('Tochter');
    expect(kindLabel('adoptive')).toBe('Adoptivkind');
  });

  it('names partners and siblings', () => {
    expect(partnerWord(anna, couple({ kind: 'marriage' }))).toBe('Ehefrau');
    expect(partnerWord(kim, couple({ kind: 'marriage' }))).toBe('Ehepartner/in');
    expect(partnerWord({ id: 'x', gender: 'male' }, couple({}))).toBe('Partner');
    expect(siblingWord(anna, true)).toBe('Schwester');
    expect(siblingWord({ id: 'x', gender: 'male' }, false)).toBe('Halbbruder');
    expect(siblingWord(kim, false)).toBe('Halbgeschwister');
  });

  it('describes a partnership', () => {
    expect(
      partnershipDetail(
        couple({
          kind: 'marriage',
          start: { date: { y: 1947, m: 5, d: 17 }, place: 'Lübeck' },
          end: { date: { y: 1985 }, reason: 'divorce' },
        }),
      ),
    ).toBe('verheiratet 17.05.1947 in Lübeck, geschieden 1985');
    expect(partnershipDetail(couple({ start: { date: { y: 1990 } } }))).toBe('zusammen seit 1990');
    expect(partnershipDetail(couple({ end: { reason: 'separation' } }))).toBe('getrennt');
    expect(partnershipDetail(couple({}))).toBe('');
  });
});

describe('tooltip and panel facts (PERS-05)', () => {
  it('shows full dates, places and the birth name on hover', () => {
    expect(tooltipLines(anna)).toEqual({
      title: 'Anna Maria Müller',
      lines: ['geb. Schmidt', '* 12.03.1923 in Kiel', '† 2001'],
    });
    expect(tooltipLines({ id: 'x', givenNames: 'Otto', deceased: true }).lines).toEqual([
      '† Datum unbekannt',
    ]);
    expect(tooltipLines(unknown)).toEqual({ title: 'Unbekannter Elternteil', lines: [] });
  });

  it('lists only filled facts', () => {
    expect(
      personFacts({
        ...anna,
        occupation: 'Lehrerin',
        extraFields: [
          { label: 'Konfession', value: 'evangelisch' },
          { label: '', value: '' },
        ],
      }),
    ).toEqual([
      ['Geboren', '12.03.1923 in Kiel'],
      ['Gestorben', '2001'],
      ['Beruf', 'Lehrerin'],
      ['Konfession', 'evangelisch'],
    ]);
    expect(personFacts(kim)).toEqual([]);
  });
});

it('never uses dashes or middle dots as separators (ui-concept §5)', () => {
  const texts = familieBrandt.persons.flatMap((p) => [
    fullName(p),
    shortName(p),
    yearsLine(p),
    ...tooltipLines(p).lines,
    ...personFacts(p).map(([, v]) => v),
  ]);
  texts.push(...familieBrandt.partnerships.map(partnershipDetail));
  for (const text of texts) expect(text).not.toMatch(/[–—·]| - /);
});

describe('dateHint (ui-concept §2.5)', () => {
  it('reads back how the date was understood', () => {
    expect(dateHint(undefined)).toBe('');
    expect(dateHint({ y: 1923, m: 3, d: 12 })).toBe('→ 12. März 1923');
    expect(dateHint({ y: 1923, m: 12 })).toBe('→ Dezember 1923');
    expect(dateHint({ y: 1923 })).toBe('→ im Jahr 1923');
    expect(dateHint({ y: 1850, q: 'about' })).toBe('→ ungefähr 1850');
    expect(dateHint({ y: 1900, q: 'before' })).toBe('→ vor 1900');
    expect(dateHint({ y: 1900, q: 'after' })).toBe('→ nach 1900');
    expect(dateHint({ y: 1890, q: 'between', y2: 1895 })).toBe('→ zwischen 1890 und 1895');
    expect(dateHint({ text: 'Ostern 1920' })).toMatch(/^→ wird so übernommen/);
  });
});

describe('editing texts', () => {
  it('picks the possessive by gender', () => {
    expect(de.deleteDialog.text('female')).toMatch(/^Ihre Verbindungen/);
    expect(de.deleteDialog.text('male')).toMatch(/^Seine Verbindungen/);
    expect(de.deleteDialog.text(undefined)).toMatch(/^Die Verbindungen/);
  });

  it('explains rule violations in German', () => {
    expect(errorText('loop')).toMatch(/eigener Vorfahr/);
    expect(errorText('too-many-biological-parents')).toMatch(/zwei leibliche Eltern/);
    expect(errorText('invalid')).toBe('Das hat nicht geklappt.');
  });
});

describe('date roundtrip', () => {
  // The person dialog fills its date fields with fmtDate and reads them back with parseDate on every input.
  it('reads every displayed date back unchanged', () => {
    const dates: FlexDate[] = [
      { y: 1923, m: 3, d: 12 },
      { y: 1923, m: 3 },
      { y: 1923 },
      { y: 1850, q: 'about' },
      { y: 1900, q: 'before' },
      { y: 1900, q: 'after' },
      { y: 1890, q: 'between', y2: 1895 },
      { text: 'Ostern 1920' },
    ];
    for (const date of dates) expect(parseDate(fmtDate(date))).toEqual(date);
  });
});
