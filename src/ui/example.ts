/**
 * The fictional example family (DATA-06), embedded in Stammbaum.html so "Beispiel ansehen" needs no file.
 * The data lives in examples/, never in the app logic (DATA-01).
 */
import exampleJson from '../../examples/familie-brandt.json?raw';
import { projectFromJson } from '../core/serialization';
import type { Project } from '../core/model/types';

export function loadExample(): Project {
  return projectFromJson(exampleJson);
}
