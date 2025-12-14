import type { RoundData, Step } from './interfaces';

export function firstPly(d: RoundData): number {
  return d.steps[0].ply;
}

export function lastPly(d: RoundData): number {
  return lastStep(d).ply;
}

export function lastStep(d: RoundData): Step {
  return d.steps[d.steps.length - 1];
}

export function plyStep(d: RoundData, ply: number): Step {
  return d.steps[ply - firstPly(d)];
}

export function massage(d: RoundData): void {
  if (d.clock) {
    d.clock.pref = d.clock.pref || {};
    d.clock.pref.showTenths = d.pref.clockTenths;
    d.clock.pref.clockAudible = d.pref.clockAudible;
    d.clock.pref.lowClockSound = !d.simul && !!d.pref.clockSound;
  }

  if (d.expiration) d.expiration.movedAt = Date.now() - d.expiration.idleMillis;
}
