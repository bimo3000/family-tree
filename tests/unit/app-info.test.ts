import { describe, expect, it } from 'vitest';
import { APP_NAME, PROJECT_FILE_EXTENSION, appTitle } from '../../src/core/app-info';

describe('app-info', () => {
  it('names the app in German', () => {
    expect(APP_NAME).toBe('Stammbaum');
  });

  it('builds a title with version', () => {
    expect(appTitle('1.2.3')).toBe('Stammbaum 1.2.3');
  });

  it('uses the agreed project file extension', () => {
    expect(PROJECT_FILE_EXTENSION).toBe('.stammbaum');
  });
});
