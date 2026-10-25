import { describe, expect, it } from 'vitest';
import { assignRows } from '../../../src/core/layout/generations';
import { buildGraph } from '../../../src/core/layout/graph';
import { lineGroups } from '../../../src/core/layout/lines';
import { addPassages, isStandIn } from '../../../src/core/layout/passages';
import type { Project } from '../../../src/core/model/types';
import { family, simple, uncleNiece } from '../../fixtures/layout-families';

function passages(project: Project) {
  const graph = buildGraph(project);
  return addPassages(graph, assignRows(graph), lineGroups(project));
}

describe('passages of long lines', () => {
  it('adds nothing when every child sits right below their parents', () => {
    const result = passages(simple);
    expect(result.passages.size).toBe(0);
    expect(result.graph.ids).toEqual(simple.persons.map((p) => p.id));
  });

  it('puts a stand-in into the row a long line passes, between the parents and the child', () => {
    // The uncle married his niece and moved down a row, so the line from his parents skips the row between.
    const { graph, rowOf, passages: found } = passages(uncleNiece);
    const [standIn, ...more] = found.get('|gma gpa>uncle')!;
    expect(more).toEqual([]);
    expect(isStandIn(standIn!)).toBe(true);
    expect(rowOf.get(standIn!)).toBe(rowOf.get('sister'));
    expect(graph.parents.get(standIn!)).toEqual(['gpa', 'gma']);
    expect(graph.parents.get('uncle')).toEqual([standIn]);
    expect(graph.children.get('gpa')).toEqual(['sister', standIn]);
    expect(graph.children.get(standIn!)).toEqual(['uncle']);
  });

  it('chains one stand-in per row passed', () => {
    const project = family('two-rows', (f) => {
      f.persons('gpa:1900 gma:1902 a:1925 ap:1925 b:1950 bp:1950 c:1975 young:1930');
      f.couple('gpa', 'gma');
      f.children(['gpa', 'gma'], 'a young');
      f.couple('a', 'ap');
      f.children(['a', 'ap'], 'b');
      f.couple('b', 'bp');
      f.children(['b', 'bp'], 'c');
      f.couple('young', 'c'); // three rows below gpa and gma
    });
    const { graph, rowOf, passages: found } = passages(project);
    const chain = found.get('|gma gpa>young')!;
    expect(chain.map((id) => rowOf.get(id))).toEqual([1, 2]);
    expect(graph.parents.get(chain[1]!)).toEqual([chain[0]]);
    expect(graph.parents.get('young')).toEqual([chain[1]]);
  });

  it('leaves the real graph untouched', () => {
    const graph = buildGraph(uncleNiece);
    addPassages(graph, assignRows(graph), lineGroups(uncleNiece));
    expect(graph.parents.get('uncle')).toEqual(['gpa', 'gma']);
    expect(graph.ids).not.toContainEqual(expect.stringMatching(/^~/));
  });
});
