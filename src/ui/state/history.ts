/**
 * Undo/redo (UI-01): the previous and the undone versions of the project. Every change is a new
 * version (architecture §2), so undo just steps back. Changes with the same key in a row, like the
 * letters typed into one field, merge into one undo step until `seal()` (e.g. the next field gets focus).
 */
export class History<T> {
  #past: T[] = [];
  #future: T[] = [];
  #key: string | undefined;
  #present: T;
  readonly #limit: number;

  constructor(present: T, limit = 100) {
    this.#present = present;
    this.#limit = limit;
  }

  get present(): T {
    return this.#present;
  }

  get canUndo(): boolean {
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
  }

  commit(next: T, key?: string): void {
    if (key === undefined || key !== this.#key) {
      this.#past.push(this.#present);
      if (this.#past.length > this.#limit) this.#past.shift();
    }
    this.#present = next;
    this.#future = [];
    this.#key = key;
  }

  /** The next commit starts a new undo step, whatever its key. */
  seal(): void {
    this.#key = undefined;
  }

  /** Back to an earlier version, forgetting every step after it. False if it is no longer kept. */
  rewind(version: T): boolean {
    const i = this.#past.lastIndexOf(version);
    if (i < 0) return false;
    this.#past.length = i;
    this.#present = version;
    this.#future = [];
    this.#key = undefined;
    return true;
  }

  undo(): boolean {
    return this.#step(this.#past, this.#future);
  }

  redo(): boolean {
    return this.#step(this.#future, this.#past);
  }

  #step(from: T[], to: T[]): boolean {
    const version = from.pop();
    if (version === undefined) return false;
    to.push(this.#present);
    this.#present = version;
    this.#key = undefined;
    return true;
  }
}
