import { expect, it } from 'vitest';
import { familyGroups } from '../../../src/ui/panel/family';
import { familieBrandt } from '../../fixtures/familie-brandt';

const groups = (id: string) =>
  familyGroups(familieBrandt, id).map((g) => ({
    title: g.title,
    entries: g.entries.map((e) => [e.name, ...e.info, e.detail].filter(Boolean).join(' | ')),
  }));

it('lists parents, partners, children and siblings with German role words', () => {
  expect(groups('p_peter')).toEqual([
    {
      title: 'Eltern',
      entries: ['Karl Brandt | Vater | * 1921 † 1999', 'Erna Brandt | Mutter | * 1923 † 1958'],
    },
    {
      title: 'Partner/in',
      entries: ['Sabine Wolf | Ehefrau | * 1950 | verheiratet 1973, geschieden 1985'],
    },
    {
      title: 'Kinder',
      entries: ['Lena Brandt | Tochter | * 1975', 'Felix Brandt | Sohn | * 1978'],
    },
    {
      title: 'Geschwister',
      entries: ['Ingrid Seidel | Schwester | * 1951', 'Thomas Brandt | Halbbruder | * 1962'],
    },
  ]);
});

it('orders several partners by date and uses the plural title', () => {
  const [, partners] = groups('p_karl');
  expect(partners).toEqual({
    title: 'Partner/innen',
    entries: [
      'Erna Brandt | Ehefrau | * 1923 † 1958 | verheiratet 17.05.1947 in Lübeck',
      'Hildegard Brandt | Ehefrau | * 1930 † 2015 | verheiratet 1960 in Hamburg',
    ],
  });
});

it('names adoptive relations and uses neutral words without a gender (PERS-07)', () => {
  expect(groups('p_jonas')[0]).toEqual({
    title: 'Eltern',
    entries: ['Ingrid Seidel | Adoptivmutter | * 1951', 'Michael Seidel | Adoptivvater | * 1949'],
  });
  expect(groups('p_mia').find((g) => g.title === 'Geschwister')?.entries).toEqual([
    'Kim Brandt | Geschwister | * 2008',
  ]);
});

it('shows an unknown parent as "unbekannt" and leaves out empty groups', () => {
  expect(groups('p_michael').map((g) => g.title)).toEqual([
    'Eltern',
    'Partner/in',
    'Kinder',
    'Geschwister',
  ]);
  expect(familyGroups(familieBrandt, 'p_michael')[0]?.entries[0]).toMatchObject({
    name: 'unbekannt',
    unknown: true,
    info: [],
  });
  expect(groups('p_unbekannt')).toEqual([
    {
      title: 'Kinder',
      entries: ['Michael Seidel | Sohn | * 1949', 'Stefan Seidel | Sohn | * ca. 1953'],
    },
  ]);
});
