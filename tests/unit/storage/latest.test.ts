import { describe, expect, it } from 'vitest';
import { latestOnly } from '../../../src/storage/latest';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('latestOnly', () => {
  it('writes one value at a time and skips values overtaken while waiting', async () => {
    const written: number[] = [];
    let release = () => {};
    const write = latestOnly(
      (n: number) =>
        new Promise<void>((resolve) => {
          written.push(n);
          release = resolve;
        }),
      () => {},
    );
    write(1);
    write(2);
    write(3);
    expect(written).toEqual([1]);
    release();
    await tick();
    expect(written).toEqual([1, 3]);
    release();
    await tick();
    write(4);
    expect(written).toEqual([1, 3, 4]);
  });

  it('reports a failed write and goes on with the next one', async () => {
    const errors: unknown[] = [];
    const written: number[] = [];
    const write = latestOnly(
      async (n: number) => {
        if (n === 1) throw new Error('full');
        written.push(n);
      },
      (e) => errors.push(e),
    );
    write(1);
    await tick();
    write(2);
    await tick();
    expect(errors).toHaveLength(1);
    expect(written).toEqual([2]);
  });
});
