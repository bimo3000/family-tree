/**
 * The project as readable JSON (`data.json` inside a `.stammbaum` file, DATA-05, data-model §5).
 * Reading upgrades older files (DATA-08) and refuses files that are damaged or break the rules.
 */
import { CURRENT_SCHEMA_VERSION, migrate } from './migrations';
import type { Project } from './model/types';
import { ModelError, validateProject } from './model/validation';

export const FILE_FORMAT = 'stammbaum';

export function projectToJson(project: Project, appVersion: string): string {
  const file = {
    format: FILE_FORMAT,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    savedWithAppVersion: appVersion,
    ...project,
  };
  return JSON.stringify(file, null, 2);
}

/** Throws a ModelError: `not-a-project`, `newer-version` or `invalid`. */
export function projectFromJson(text: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ModelError('invalid');
  }
  if (!isRecord(data) || data.format !== FILE_FORMAT) throw new ModelError('not-a-project');
  const version = data.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1)
    throw new ModelError('invalid');
  if (version > CURRENT_SCHEMA_VERSION) throw new ModelError('newer-version');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- file-level fields are not part of the project
  const { format, schemaVersion, savedWithAppVersion, ...rest } = migrate({
    ...data,
    schemaVersion: version,
  });
  if (!hasProjectShape(rest)) throw new ModelError('invalid');
  try {
    validateProject(rest);
  } catch {
    throw new ModelError('invalid');
  }
  return rest;
}

/** A shallow structure check: the lists exist and every entry has its IDs. Fields are optional. */
function hasProjectShape(data: Record<string, unknown>): data is Record<string, unknown> & Project {
  const { id, name, createdAt, modifiedAt, persons, partnerships, parentChild, images } = data;
  return (
    [id, name, createdAt, modifiedAt].every((v) => typeof v === 'string') &&
    isListOf(persons, (p) => typeof p.id === 'string') &&
    isListOf(
      partnerships,
      (r) =>
        typeof r.id === 'string' &&
        Array.isArray(r.partners) &&
        r.partners.length === 2 &&
        r.partners.every((id) => typeof id === 'string'),
    ) &&
    isListOf(parentChild, (l) => typeof l.parentId === 'string' && typeof l.childId === 'string') &&
    isListOf(images, (i) => typeof i.id === 'string' && typeof i.file === 'string')
  );
}

function isListOf(value: unknown, ok: (entry: Record<string, unknown>) => boolean): boolean {
  return Array.isArray(value) && value.every((entry) => isRecord(entry) && ok(entry));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
