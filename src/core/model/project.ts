import type { Project } from './types';

/** A new random ID such as `p_3f2c…` (persons) or `u_9a1b…` (partnerships). IDs are never reused. */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/** An empty project. */
export function createProject(name: string, now: Date): Project {
  const timestamp = now.toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: timestamp,
    modifiedAt: timestamp,
    persons: [],
    partnerships: [],
    parentChild: [],
    images: [],
  };
}
