export const prefs = {
  notation: {
    WESTERN: 0,
    KAWASAKI: 1,
    JAPANESE: 2,
    WESTERNENGINE: 3,
    KIF: 4,
    USI: 5,
    YOROZUYA: 6,
  },
  submitMove: {
    NEVER: 0,
    CORRESPONDENCE_ONLY: 4,
    CORRESPONDENCE_UNLIMITED: 1,
    ALWAYS: 2,
  },
  moveEvent: {
    CLICK: 0,
    DRAG: 1,
    BOTH: 2,
  },
  coords: {
    NONE: 0,
    INSIDE: 1,
    OUTSIDE: 2,
    EDGE: 3,
  },
  replay: {
    NEVER: 0,
    SLOW: 1,
    ALWAYS: 2,
  },
  colorName: {
    LANG: 0,
    SENTEJP: 1,
    SENTE: 2,
    BLACK: 3,
  },
  clockAudible: {
    MINE: 0,
    MYGAME: 1,
    ALL: 2,
  },
  clockTenths: {
    NEVER: 0,
    LOWTIME: 1,
    ALWAYS: 2,
  },
  resizeHandle: {
    NEVER: 0,
    INITIAL: 1,
    ALWAYS: 2,
  },
} as const;

export type PrefTypes = {
  [K in keyof typeof prefs]: (typeof prefs)[K][keyof (typeof prefs)[K]];
};
