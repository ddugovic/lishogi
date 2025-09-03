import notify from 'common/notification';
import { once } from 'common/storage';
import type { TournamentDataFull } from './interfaces';

let countDownTimeout: number | undefined;
const li = window.lishogi;

function doCountDown(targetTime: number) {
  let started = false;

  return function curCounter() {
    const secondsToStart = (targetTime - performance.now()) / 1000;

    const bestTick = Math.max(0, Math.round(secondsToStart));
    if (bestTick <= 10 && bestTick > 0) {
      li.sound.countdown(bestTick);
    }

    if (bestTick > 1) {
      const nextTick = Math.min(10, bestTick - 1);
      countDownTimeout = setTimeout(
        curCounter,
        1000 * Math.min(1.1, Math.max(0.8, secondsToStart - nextTick)),
      );
    }

    if (!started && bestTick <= 10) {
      started = true;
      notify('The tournament is starting!');
    }
  };
}

export function end(data: TournamentDataFull): void {
  if (!data.me) return;
  if (!data.isRecentlyFinished) return;
  if (!once(`tournament.end.sound.${data.id}`)) return;

  let soundKey = 'other';
  if (data.me.rank < 4) soundKey = '1';
  else if (data.me.rank < 11) soundKey = '2';
  else if (data.me.rank < 21) soundKey = '3';

  const soundName = `tournament-${soundKey}`;
  li.sound.play(soundName);
}

const debug = false;
export function countDown(data: TournamentDataFull): void {
  const secondsToStart = debug ? 11 : data.secondsToStart;

  if (!data.me || !secondsToStart || data.system !== 'arena') {
    if (countDownTimeout) clearTimeout(countDownTimeout);
    countDownTimeout = undefined;
    if (!debug) return;
  }
  if (countDownTimeout) return;
  if (!secondsToStart || secondsToStart > 60 * 60 * 24) return;

  countDownTimeout = setTimeout(doCountDown(performance.now() + 1000 * secondsToStart - 100), 900); // wait 900ms before starting countdown.

  // preloads countdown sounds and we will use game sounds anyway
  li.sound.loadGameSounds(true);
}
