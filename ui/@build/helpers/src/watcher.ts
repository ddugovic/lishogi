import { existsSync, type FSWatcher, watch as fswatch, type WatchEventType } from 'node:fs';
import path from 'node:path';

export function watchers(
  paths: string[],
  f: (event: WatchEventType, filename: string | null) => Promise<void>,
): FSWatcher[] {
  const fswatchers: FSWatcher[] = [];
  for (const p of paths) {
    if (existsSync(p)) {
      const cb = debounce(async (event: WatchEventType, filename: string | null) => {
        await f(event, filename ? path.join(p, filename) : null);
      }, 100);

      const w = fswatch(p, { recursive: true }, (event, filename) => cb(event, filename));
      fswatchers.push(w);
    }
  }
  return fswatchers;
}

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
