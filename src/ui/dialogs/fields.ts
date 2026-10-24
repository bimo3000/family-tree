/** Turning dialog fields into model values. Empty values are dropped later by the core operations. */
import { parseDate } from '../../core/dates';
import type { LifeEvent } from '../../core/model/types';

export function lifeEvent(dateText: string, place: string): LifeEvent {
  const date = parseDate(dateText);
  return { ...(date ? { date } : {}), place: place.trim() };
}
