/** After this many days with changes that are not in a file, a gentle reminder shows (UI-02, ui-concept §4). */
export const REMINDER_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since the first change not in a file, if that is a week or more; otherwise null. */
export function reminderDays(unsavedSince: string | undefined, now: Date): number | null {
  if (!unsavedSince) return null;
  const days = Math.floor((now.getTime() - Date.parse(unsavedSince)) / DAY_MS);
  return days >= REMINDER_DAYS ? days : null;
}
