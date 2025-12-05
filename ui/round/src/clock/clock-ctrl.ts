import { defined } from 'common/common';
import { type PrefTypes, prefs } from 'common/prefs';
import * as game from 'game';
import type { RoundData } from '../interfaces';
import { updateElements } from './clock-view';

export type Seconds = number;
export type Centis = number;
export type Millis = number;

interface ClockOpts {
  onFlag(): void;
  redraw: Redraw;
  soundColor?: Color;
  nvui: boolean;
}

export interface ClockData {
  running: boolean;
  initial: Seconds;
  increment: Seconds;
  byoyomi: Seconds;
  periods: number;
  sente: Seconds;
  gote: Seconds;
  emerg: Seconds;
  showTenths: PrefTypes['clockTenths'];
  clockAudible: PrefTypes['clockAudible'];
  moretime: number;
  sPeriods: number;
  gPeriods: number;
}

interface Times {
  sente: Millis;
  gote: Millis;
  activeColor?: Color;
  lastUpdate: Millis;
}

type ColorMap<T> = { [C in Color]: T };

export interface ClockElements {
  time?: HTMLElement;
  clock?: HTMLElement;
}

interface EmergSound {
  lowtime(): void;
  nextPeriod(): void;
  lastByoTick?: number;
  next?: number;
  delay: Millis;
  playable: {
    sente: boolean;
    gote: boolean;
  };
}

export class ClockController {
  emergSound: EmergSound = {
    lowtime: () => window.lishogi.sound.play('low-time', 'clock'),
    nextPeriod: () => window.lishogi.sound.play('byoyomi', 'clock'),
    delay: 20000,
    playable: {
      sente: true,
      gote: true,
    },
  };

  showTenths: (millis: Millis, color: Color) => boolean;
  times: Times;

  emergMs: Millis;
  audible: number;

  elements = {
    sente: {},
    gote: {},
  } as ColorMap<ClockElements>;

  byoyomi: number;
  initial: number;

  totalPeriods: number;
  curPeriods = {} as ColorMap<number>;
  goneBerserk = {} as ColorMap<boolean>;

  private tickCallback?: number;

  constructor(
    d: RoundData,
    readonly opts: ClockOpts,
  ) {
    const cdata = d.clock!;

    if (cdata.showTenths === prefs.clockTenths.NEVER) this.showTenths = () => false;
    else {
      const cutoff = cdata.showTenths === prefs.clockTenths.LOWTIME ? 10000 : 3600000;
      this.showTenths = (time, color) =>
        time < cutoff &&
        (this.byoyomi === 0 ||
          time <= 1000 ||
          this.isUsingByo(color) ||
          cdata.showTenths === prefs.clockTenths.ALWAYS);
    }

    this.byoyomi = cdata.byoyomi;
    this.initial = cdata.initial;

    this.totalPeriods = cdata.periods;
    this.curPeriods.sente = cdata.sPeriods ?? 0;
    this.curPeriods.gote = cdata.gPeriods ?? 0;

    this.goneBerserk[d.player.color] = !!d.player.berserk;
    this.goneBerserk[d.opponent.color] = !!d.opponent.berserk;

    this.emergMs = 1000 * Math.min(60, Math.max(10, cdata.initial * 0.125));
    this.audible = cdata.clockAudible;

    this.setClock(d, cdata.sente, cdata.gote, cdata.sPeriods, cdata.gPeriods);
  }

  isUsingByo = (color: Color): boolean =>
    this.byoyomi > 0 && (this.curPeriods[color] > 0 || this.initial === 0);

  setClock = (
    d: RoundData,
    sente: Seconds,
    gote: Seconds,
    sPer: number,
    gPer: number,
    delay: Centis = 0,
  ): void => {
    const isClockRunning = game.playable(d) && (game.playedPlies(d) > 1 || d.clock!.running);
    const delayMs = delay * 10;

    this.times = {
      sente: sente * 1000,
      gote: gote * 1000,
      activeColor: isClockRunning ? d.game.player : undefined,
      lastUpdate: performance.now() + delayMs,
    };
    this.curPeriods.sente = sPer;
    this.curPeriods.gote = gPer;

    if (isClockRunning) this.scheduleTick(this.times[d.game.player], d.game.player, delayMs);
  };

  addTime = (color: Color, time: Centis): void => {
    this.times[color] += time * 10;
    this.resetByoTicks();
  };

  setBerserk = (color: Color): void => {
    this.goneBerserk[color] = true;
  };

  nextPeriod = (color: Color): void => {
    this.curPeriods[color] += 1;
    this.times[color] += this.byoyomi * 1000;
    if (this.opts.soundColor === color || this.audible >= prefs.clockAudible.MYGAME)
      this.emergSound.nextPeriod();
    this.resetByoTicks();
  };

  stopClock = (): Millis | undefined => {
    const color = this.times.activeColor;
    if (color) {
      const curElapse = this.elapsed();
      this.times[color] = Math.max(0, this.times[color] - curElapse);
      this.times.activeColor = undefined;
      this.resetByoTicks();
      return curElapse;
    }
    return;
  };

  hardStopClock = (): void => {
    this.times.activeColor = undefined;
  };

  resetByoTicks = (): void => {
    this.emergSound.lastByoTick = undefined;
  };

  private scheduleTick = (time: Millis, color: Color, extraDelay: Millis) => {
    if (this.tickCallback !== undefined) clearTimeout(this.tickCallback);
    this.tickCallback = setTimeout(
      this.tick,
      // changing the value of active node confuses the chromevox screen reader
      // so update the clock less often
      this.opts.nvui
        ? 1000
        : (time %
            (this.showTenths(time, color) || (this.isUsingByo(color) && time < 11 * 1000)
              ? 100
              : 500)) +
            1 +
            extraDelay,
    );
  };

  // Should only be invoked by scheduleTick.
  private tick = (): void => {
    this.tickCallback = undefined;

    const color = this.times.activeColor;
    if (color === undefined) return;

    const now = performance.now();
    const millis = Math.max(0, this.times[color] - this.elapsed(now));
    const curPeriod = this.curPeriods[color];

    this.scheduleTick(millis, color, 0);
    if (
      millis === 0 &&
      !this.goneBerserk[color] &&
      this.byoyomi > 0 &&
      curPeriod < this.totalPeriods
    ) {
      this.nextPeriod(color);
      this.opts.redraw();
    } else if (millis === 0) this.opts.onFlag();
    else updateElements(this, this.elements[color], millis, color);

    if (this.opts.soundColor === color || this.audible === 1) {
      if (this.emergSound.playable[color]) {
        if (millis < this.emergMs && !(now < this.emergSound.next!) && !this.isUsingByo(color)) {
          this.emergSound.lowtime();
          this.emergSound.next = now + this.emergSound.delay;
          this.emergSound.playable[color] = false;
        }
      } else if (millis > 1.5 * this.emergMs) {
        this.emergSound.playable[color] = true;
      }

      // To give more space for 'juubyou...' and such
      const adjustedMillis = millis > 10 * 1000 ? millis - 200 : millis;

      if (
        millis > 0 &&
        this.isUsingByo(color) &&
        (!defined(this.emergSound.lastByoTick) ||
          Math.floor(adjustedMillis / 1000) < this.emergSound.lastByoTick)
      ) {
        this.emergSound.lastByoTick = Math.floor(adjustedMillis / 1000);

        // in seconds
        const remainingByo = Math.floor(adjustedMillis / 1000) + 1;
        const spentByo = this.byoyomi - remainingByo;

        if (this.byoyomi === remainingByo) return;

        if (window.lishogi.sound.clockSoundJapanese()) {
          // count up from 0 to 9
          if (remainingByo < 10) window.lishogi.sound.countdown(10 - remainingByo);
          // after 10, 20, 30, 40, 50 seconds elapsed
          else if (spentByo > 0 && spentByo % 10 === 0 && spentByo <= 50)
            window.lishogi.sound.play(`${spentByo}s`, 'clock');
        } else {
          if (remainingByo < 10 || (remainingByo < 60 && remainingByo % 10 === 0))
            window.lishogi.sound.countdown(remainingByo);
        }
      }
    }
  };

  elapsed = (now: number = performance.now()): number => Math.max(0, now - this.times.lastUpdate);

  millisOf = (color: Color): Millis =>
    this.times.activeColor === color
      ? Math.max(0, this.times[color] - this.elapsed())
      : this.times[color];

  isRunning = (): boolean => this.times.activeColor !== undefined;
}
