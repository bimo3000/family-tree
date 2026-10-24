import { expect } from 'vitest';
import { ModelError, type ModelErrorCode } from '../../src/core/model/validation';

/** Expects `fn` to throw a ModelError with this code. */
export function expectCode(fn: () => unknown, code: ModelErrorCode): void {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ModelError);
    expect((e as ModelError).code).toBe(code);
    return;
  }
  expect.fail(`expected ModelError "${code}"`);
}
