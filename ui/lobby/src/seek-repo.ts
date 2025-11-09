import type LobbyController from './ctrl';
import type { Seek } from './interfaces';
import { withinRatingRange } from './util';

const ratingOrder =
  (reverse: boolean) =>
  (a: Seek, b: Seek): number => {
    const ra = a.rating ?? 0;
    const rb = b.rating ?? 0;
    if (ra === rb) return 0;
    return (ra > rb ? -1 : 1) * (reverse ? -1 : 1);
  };

const timeOrder =
  (reverse: boolean) =>
  (a: Seek, b: Seek): number => {
    const da = a.days ?? 365;
    const db = b.days ?? 365;
    if (da === db) return 0;
    return (da > db ? -1 : 1) * (reverse ? -1 : 1);
  };

export function sort(ctrl: LobbyController, seeks: Seek[]): void {
  const s = ctrl.sort;
  seeks.sort(s.startsWith('time') ? timeOrder(s !== 'time') : ratingOrder(s !== 'rating'));
}

export function init(ctrl: LobbyController, seek: Seek): void {
  if (!seek.variant) seek.variant = 'standard';

  if (ctrl.data.me && seek.username.toLowerCase() === ctrl.data.me.username.toLowerCase())
    seek.action = 'cancel';
  else {
    const perfRating = seek.perf ? ctrl.ratings?.[seek.perf] : undefined;
    const withinRange = !perfRating || withinRatingRange(seek, perfRating.rating);
    if (!ctrl.isAnon && withinRange) seek.action = 'join';
    else seek.action = 'unjoinable';
  }
}

export function setSeeks(ctrl: LobbyController, seeks: Seek[]): void {
  seeks.forEach(s => {
    init(ctrl, s);
  });

  ctrl.reloadSeeks = false;
  ctrl.data.seeks = seeks;
  ctrl.redraw();
}

export function find(ctrl: LobbyController, id: string): Seek | undefined {
  return ctrl.data.seeks.find(s => s.id === id);
}
