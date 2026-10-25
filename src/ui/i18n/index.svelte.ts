/**
 * The current UI language (GEN-05, ADR-0008). Components read texts as `t.panel.edit`; a switch re-renders
 * them without a reload, because every read goes through the language state.
 */
import { loadLanguage, saveLanguage } from '../../storage/workingCopy';
import { de, type Texts } from './de';
import { en } from './en';
import { fr } from './fr';

const DICTIONARIES = { de, en, fr } satisfies Record<string, Texts>;

export type Language = keyof typeof DICTIONARIES;

/** In the order of the language choice. */
export const LANGUAGES = Object.keys(DICTIONARIES) as Language[];

const current = $state({ language: 'de' as Language });

export const t: Texts = new Proxy(de, {
  get: (_, key) => DICTIONARIES[current.language][key as keyof Texts],
});

export function language(): Language {
  return current.language;
}

const isLanguage = (code: string): code is Language => code in DICTIONARIES;

/** The first of the browser's languages the app knows ("de-AT" counts as "de"), else English. */
export function pickLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const code = tag.toLowerCase().split('-')[0] ?? '';
    if (isLanguage(code)) return code;
  }
  return 'en';
}

export function setLanguage(code: Language): void {
  current.language = code;
  if (typeof document !== 'undefined') document.documentElement.lang = code;
}

/** On start: the remembered choice, else the browser's language. */
export async function startLanguage(): Promise<void> {
  const saved = await loadLanguage().catch(() => null);
  setLanguage(saved && isLanguage(saved) ? saved : pickLanguage(navigator.languages));
}

/** The user chose a language: it stays for this browser. */
export function chooseLanguage(code: Language): void {
  setLanguage(code);
  void saveLanguage(code).catch(() => {});
}
