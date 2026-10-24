/**
 * The open project as the UI sees it (architecture §2, "state"): the current version, the selected
 * person and undo/redo. Every change is a core operation passed to `apply`, so the rules always hold.
 */
import type { Added } from '../../core/model/operations';
import { findPerson } from '../../core/model/queries';
import type { PersonId, Project } from '../../core/model/types';
import { History } from './history';

export class Editor {
  project: Project;
  selectedId: PersonId | null = $state(null);
  canUndo = $state(false);
  canRedo = $state(false);
  /** Counts undo and redo steps: open forms rebuild their fields from the restored version. */
  revision = $state(0);
  #history: History<Project>;

  constructor(project: Project) {
    this.#history = new History(project);
    this.project = $state.raw(project);
  }

  /**
   * Runs a change. A `key` merges consecutive changes into one undo step (typing in one field).
   * Rule violations (`ModelError`) are thrown before anything changes.
   */
  apply(change: (project: Project) => Project, key?: string): void {
    this.#history.commit(change(this.project), key);
    this.#sync();
  }

  /** Runs a change that creates or links a person and returns that person's ID. */
  add(change: (project: Project) => Added): PersonId {
    const added = change(this.project);
    this.apply(() => added.project);
    return added.id;
  }

  /** The next change starts a new undo step. */
  seal(): void {
    this.#history.seal();
  }

  undo(): void {
    if (this.#history.undo()) this.#restored();
  }

  redo(): void {
    if (this.#history.redo()) this.#restored();
  }

  #restored(): void {
    this.revision++;
    this.#sync();
  }

  #sync(): void {
    this.project = this.#history.present;
    this.canUndo = this.#history.canUndo;
    this.canRedo = this.#history.canRedo;
    // The selected person may be gone after a delete or an undo.
    if (this.selectedId && !findPerson(this.project, this.selectedId)) this.selectedId = null;
  }
}
