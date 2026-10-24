import { describe, expect, it } from 'vitest';
import { reminderDays } from '../../../src/ui/state/reminder';

const now = new Date('2026-10-24T12:00:00Z');

describe('reminderDays (UI-02)', () => {
  it('reminds after a week with unsaved changes', () => {
    expect(reminderDays('2026-10-17T12:00:00Z', now)).toBe(7);
    expect(reminderDays('2026-10-01T08:00:00Z', now)).toBe(23);
  });

  it('stays quiet before that, and when everything is saved', () => {
    expect(reminderDays('2026-10-17T12:00:01Z', now)).toBeNull();
    expect(reminderDays(undefined, now)).toBeNull();
  });
});
