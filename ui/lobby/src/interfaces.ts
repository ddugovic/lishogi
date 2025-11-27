import type { StoredProp } from 'common/storage';
import type { EngineCode } from 'shogi/engine-name';

export type Sort = 'rating' | 'time' | 'rating-reverse' | 'time-reverse';
export type Mode = 'list' | 'chart';
export type Tab = 'presets' | 'real_time' | 'seeks' | 'now_playing';
type Action = 'cancel' | 'join' | 'unjoinable';

interface Untyped {
  [key: string]: any;
}

export interface Hook {
  id: string;
  sri: string;
  clock: string;
  t: number; // time
  i: number; // increment
  b: number; // byoyomi
  p: number; // periods
  perf: Perf;
  prov?: boolean;
  u?: string; // username
  rating?: number;
  ra?: number; // rated
  rr?: string; // rating range
  c?: Color;
  cc?: string; // coutnry code
  variant: VariantKey; // default set in hook-repo
  disabled?: boolean;
  action: Action; // set in hook-repo
}

export interface Seek {
  id: string;
  username: string;
  rating: number;
  mode: number; // rated (1)
  perf: Perf;
  rr?: string;
  color?: Color;
  cc?: string; // coutnry code
  days?: number;
  provisional?: boolean;
  variant: VariantKey; // default set in seek-repo
  action: Action; // set in seek-repo
}

export type RatingsRecord = Record<Perf, { rating: number; clueless?: boolean } | undefined>;

export interface LobbyOpts extends Untyped {
  socketSend: Socket.Send;
  blindMode: boolean;
  friendUser?: string;
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
  perf: string;
  rated: boolean;
  hasMoved: boolean;
  opponent: {
    id?: string;
    username?: string;
    countryCode?: string;
    rating?: number;
    prov?: boolean;
    ai?: number;
    aiCode?: EngineCode;
    isBot?: boolean;
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
  ratingDiff: StoredProp<number>;
}
