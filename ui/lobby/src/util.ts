import type { Hook, Seek } from './interfaces';

export function isHook(x: Seek | Hook): x is Hook {
  return 'clock' in x;
}

export function withinRatingRange(hs: Hook | Seek, rating: number): boolean {
  if (!hs.rr) return true;
  const [min, max] = hs.rr.split('-').map(Number);
  if (isNaN(min) || isNaN(max)) return true;
  return rating >= min && rating <= max;
}
