/** One short message at the bottom of the window, shown for a few seconds (App.svelte draws it). */
export const toast = $state({ text: '' });

let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(text: string): void {
  toast.text = text;
  clearTimeout(timer);
  timer = setTimeout(() => (toast.text = ''), 4500);
}
