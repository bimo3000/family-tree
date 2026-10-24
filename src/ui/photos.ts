/**
 * Photos are shown through `blob:` URLs (the CSP allows them). ProjectScreen provides the lookup,
 * cards, panel and dialog use it.
 */
import { getContext, setContext } from 'svelte';

export type PhotoUrl = (photoId: string | undefined) => string | undefined;

const KEY = Symbol('photos');

export function providePhotos(url: PhotoUrl): void {
  setContext(KEY, url);
}

export function usePhotos(): PhotoUrl {
  return getContext<PhotoUrl | undefined>(KEY) ?? (() => undefined);
}
