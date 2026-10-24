import { readFileSync } from 'node:fs';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { Project } from '../../../src/core/model/types';
import { packProject, unpackProject } from '../../../src/storage/projectFile';
import { createProjectFile } from '../../../scripts/lib/zip.mjs';
import { familieBrandt } from '../../fixtures/familie-brandt';
import { expectCode } from '../helpers';

const picture = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3, 0xff, 0xd9]);
const ref = { id: 'img_1', file: 'bilder/img_1.jpg', width: 800, height: 1000 };

/** Familie Brandt with a photo on the first person. */
const withPhoto: Project = {
  ...familieBrandt,
  persons: familieBrandt.persons.map((p, i) => (i === 0 ? { ...p, photoId: ref.id } : p)),
  images: [ref],
};

describe('packProject / unpackProject (DATA-04)', () => {
  it('round-trips the project and its pictures', () => {
    const file = packProject(withPhoto, new Map([[ref.id, picture]]), '0.1.0');
    const { project, images } = unpackProject(file);
    expect(project).toEqual(withPhoto);
    expect(images.get(ref.id)).toEqual(picture);
  });

  it('is a zip with a readable data.json and the pictures in bilder/', () => {
    const entries = unzipSync(packProject(withPhoto, new Map([[ref.id, picture]]), '0.1.0'));
    expect(Object.keys(entries).sort()).toEqual(['bilder/img_1.jpg', 'data.json']);
    expect(JSON.parse(strFromU8(entries['data.json']!))).toMatchObject({
      format: 'stammbaum',
      savedWithAppVersion: '0.1.0',
    });
  });

  it('opens a file whose picture is missing, without that picture', () => {
    const { project, images } = unpackProject(packProject(withPhoto, new Map(), '0.1.0'));
    expect(project.images).toEqual([ref]);
    expect(images.size).toBe(0);
  });

  it('refuses a file that is not a zip, or a zip without data.json', () => {
    expectCode(() => unpackProject(strToU8('hello')), 'not-a-project');
    expectCode(() => unpackProject(zipSync({ 'other.txt': strToU8('x') })), 'not-a-project');
  });

  it('refuses a damaged data.json', () => {
    expectCode(() => unpackProject(zipSync({ 'data.json': strToU8('{') })), 'invalid');
  });
});

describe('Beispiel.stammbaum in the release zip (DATA-06)', () => {
  it('opens as the example family', () => {
    const json = readFileSync(new URL('../../../examples/familie-brandt.json', import.meta.url));
    const { project, images } = unpackProject(new Uint8Array(createProjectFile(json)));
    expect(project).toEqual(familieBrandt);
    expect(images.size).toBe(0);
  });
});
