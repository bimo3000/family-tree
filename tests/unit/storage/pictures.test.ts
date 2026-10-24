import { describe, expect, it } from 'vitest';
import { scaledSize } from '../../../src/storage/pictures';

describe('scaledSize (DATA-07)', () => {
  it('scales the long side down to 2000 px, keeping the proportions', () => {
    expect(scaledSize(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(scaledSize(3000, 4500)).toEqual({ width: 1333, height: 2000 });
  });

  it('leaves smaller pictures as they are', () => {
    expect(scaledSize(800, 1000)).toEqual({ width: 800, height: 1000 });
    expect(scaledSize(2000, 10)).toEqual({ width: 2000, height: 10 });
  });

  it('never produces an empty picture', () => {
    expect(scaledSize(10000, 1)).toEqual({ width: 2000, height: 1 });
  });
});
