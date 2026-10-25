import { describe, expect, it } from 'vitest';
import { History } from '../../../src/ui/state/history';

describe('History (UI-01)', () => {
  it('undoes and redoes changes in order', () => {
    const h = new History('a');
    expect(h.canUndo).toBe(false);
    h.commit('b');
    h.commit('c');
    expect(h.undo()).toBe(true);
    expect(h.present).toBe('b');
    expect(h.undo()).toBe(true);
    expect(h.present).toBe('a');
    expect(h.undo()).toBe(false);
    expect(h.redo()).toBe(true);
    expect(h.redo()).toBe(true);
    expect(h.present).toBe('c');
    expect(h.redo()).toBe(false);
  });

  it('forgets the undone versions after a new change', () => {
    const h = new History('a');
    h.commit('b');
    h.undo();
    h.commit('x');
    expect(h.canRedo).toBe(false);
    h.undo();
    expect(h.present).toBe('a');
  });

  it('merges changes with the same key into one undo step', () => {
    const h = new History('');
    h.commit('A', 'name');
    h.commit('An', 'name');
    h.commit('Anna', 'name');
    h.commit('Anna 1923', 'birth');
    h.undo();
    expect(h.present).toBe('Anna');
    h.undo();
    expect(h.present).toBe('');
  });

  it('starts a new step after seal, undo or a change without key', () => {
    const h = new History('');
    h.commit('A', 'name');
    h.seal();
    h.commit('An', 'name');
    h.undo();
    expect(h.present).toBe('A');
    h.commit('Ab', 'name');
    h.undo();
    expect(h.present).toBe('A');
    h.commit('x');
    h.commit('y');
    h.undo();
    expect(h.present).toBe('x');
  });

  it('rewinds to an earlier version as if the steps after it never happened', () => {
    const h = new History('a');
    h.commit('b');
    h.commit('c', 'name');
    expect(h.rewind('a')).toBe(true);
    expect(h.present).toBe('a');
    expect(h.canUndo).toBe(false);
    expect(h.canRedo).toBe(false);
    expect(h.rewind('x')).toBe(false);
    expect(h.present).toBe('a');
  });

  it('keeps at most the given number of steps', () => {
    const h = new History(0, 3);
    for (let i = 1; i <= 5; i++) h.commit(i);
    while (h.undo());
    expect(h.present).toBe(2);
  });
});
