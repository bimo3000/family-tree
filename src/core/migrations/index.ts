/**
 * Data-format upgrades (DATA-08, architecture §5). Older project files always open in newer app
 * versions: each step upgrades a file by one schema version, and every step gets a unit test with a
 * stored sample file (tests/fixtures/schema-v<N>.json).
 *
 * To change the format: bump CURRENT_SCHEMA_VERSION, add `MIGRATIONS[old] = (data) => …`,
 * and store a sample of the old version. Also version the browser's working copy (architecture §5).
 */
import { ModelError } from '../model/validation';

export const CURRENT_SCHEMA_VERSION = 1;

/** The parsed `data.json` of a project file, before it is checked. */
export type FileData = Record<string, unknown> & { schemaVersion: number };

export type Migration = (data: FileData) => Record<string, unknown>;

/** `MIGRATIONS[n]` upgrades a file from schema version n to n + 1. None yet. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

/** Upgrades `data` step by step to the `target` schema version. */
export function migrate(
  data: FileData,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = CURRENT_SCHEMA_VERSION,
): FileData {
  let current = data;
  while (current.schemaVersion < target) {
    const step = migrations[current.schemaVersion];
    if (!step) throw new ModelError('invalid');
    current = { ...step(current), schemaVersion: current.schemaVersion + 1 };
  }
  return current;
}
