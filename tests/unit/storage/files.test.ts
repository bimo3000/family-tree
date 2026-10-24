import { describe, expect, it } from 'vitest';
import { fileNameFor } from '../../../src/storage/files';

describe('fileNameFor', () => {
  it('names the file after the project', () => {
    expect(fileNameFor('Familie Müller')).toBe('Familie Müller.stammbaum');
  });

  it('leaves out characters that file systems refuse', () => {
    expect(fileNameFor('Müller/Schmidt: "Stamm"')).toBe('Müller Schmidt Stamm.stammbaum');
    expect(fileNameFor(' ?? ')).toBe('Stammbaum.stammbaum');
  });
});
