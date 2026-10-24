/**
 * Wraps an async writer so that at most one write runs at a time and, of the values that arrive
 * meanwhile, only the newest is written next. Saving after every keystroke stays cheap and in order.
 */
export function latestOnly<T>(
  write: (value: T) => Promise<void>,
  onerror: (error: unknown) => void,
): (value: T) => void {
  let running = false;
  let pending: { value: T } | null = null;

  async function run() {
    running = true;
    while (pending) {
      const { value } = pending;
      pending = null;
      try {
        await write(value);
      } catch (error) {
        onerror(error);
      }
    }
    running = false;
  }

  return (value) => {
    pending = { value };
    if (!running) void run();
  };
}
