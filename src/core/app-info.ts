/**
 * Static facts about the app. Lives in core/ (pure TypeScript, no browser APIs)
 * so it can be unit-tested and reused by a future read-only website build.
 */
export const APP_NAME = 'Stammbaum';

/** Injected at build time from package.json (see vite.config.ts). */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

/** File extension of a family-tree project file (zip: data.json + bilder/). */
export const PROJECT_FILE_EXTENSION = '.stammbaum';

export function appTitle(version: string = APP_VERSION): string {
  return `${APP_NAME} ${version}`;
}
