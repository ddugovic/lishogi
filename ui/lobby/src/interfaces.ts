import type { EngineCode } from 'shogi/engine-name';

export type Sort = 'rating' | 'time' | 'rating-reverse' | 'time-reverse';
export type Mode = 'list' | 'chart';
export type Tab = 'presets' | 'real_time' | 'seeks' | 'now_playing';

interface Untyped {
  [key: string]: any;
}

export interface Hook {
  id: string;
  sri: string;
  clock: string;
  t: number; // time
  s: number; // speed
  i: number; // increment
  b: number; // byoyomi
  p: number; // periods
  prov?: boolean;
  u?: string; // username
  rating?: number;
  ra?: number; // rated
  rr?: string; // rating range
  c?: Color;
  perf?: Perf;
  variant?: VariantKey;
  disabled?: boolean;
}

export interface Seek {
  id: string;
  username: string;
  rating: number;
  mode: number; // rated (1)
  rr?: string;
  color?: Color;
  days?: number;
  perf?: Perf;
  provisional?: boolean;
  variant?: VariantKey;
}

export type RatingsRecord = Record<Perf, { rating: number; clueless?: boolean } | undefined>;

export interface LobbyOpts extends Untyped {
  socketSend: Socket.Send;
  blindMode: boolean;
  variant?: VariantKey;
  friendUser?: string;
  sfen?: string;
  hookLike?: string;
}

export interface LobbyData extends Untyped {
  hooks: Hook[];
  seeks: Seek[];
  nowPlaying: Game[];
}

export interface Game {
  fullId: string;
  gameId: string;
  sfen: string;
  color: Color;
  lastMove?: string;
  variant: Variant;
  speed: string;
  perf: string;
  rated: boolean;
  hasMoved: boolean;
  opponent: {
    id?: string;
    username?: string;
    rating?: number;
    ai?: number;
    aiCode?: EngineCode;
  };
  isMyTurn: boolean;
  secondsLeft?: number;
  tournamentId?: string;
  winner?: string;
}

export interface Preset {
  id: string;
  lim: number;
  byo: number;
  inc: number;
  per: number;
  days: number;
  timeMode: number;
  ai?: number;
}

export interface PresetOpts {
  isAnon: boolean;
  isNewPlayer: boolean;
  aiLevel?: number;
  ratings?: RatingsRecord;
  ratingDiff: number;
}
