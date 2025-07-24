import type { ChallengeData } from 'challenge/interfaces';
import type { StatusId } from 'game/interfaces';

export interface BasePlayer {
  name: string;
  rating: number;
  provisional?: boolean;
  title?: string;
  patron?: boolean;
}

export interface ArenaPlayer extends BasePlayer {
  id: string;
  rank: number;
  score: number;
  sheet?: Sheet;
  withdraw?: boolean;
  kicked?: boolean;
  team?: string;
}

export interface ArrangementPlayer extends BasePlayer {
  id: string;
  order: number;
  score: number;
  kicked?: boolean;
  withdraw?: boolean;
}

export type TourPlayer = ArenaPlayer | ArrangementPlayer;

interface Sheet {
  scores: number[];
  total: number;
  fire?: boolean;
}

export interface Standing {
  failed?: boolean;
  page: number;
  players: ArenaPlayer[] | ArrangementPlayer[];
  arrangements: Arrangement[];
}

export interface TournamentOpts {
  data: TournamentDataFull;
  userId: string;
  chat: any;
  challenges?: ChallengeData;
  classes: string;
  $side: JQuery<HTMLElement>;
  $faq: JQuery<HTMLElement>;
  $desc: JQuery<HTMLElement>;
  playerManagmentButton?: HTMLElement;
  teamEditButton?: HTMLElement;
  socketSend: Socket.Send;
}

export interface TournamentDataBase {
  nbPlayers: number;
  duels: any[];
  standing: Standing;
  isStarted?: boolean;
  isFinished?: boolean;
  isRecentlyFinished?: boolean;
  isClosed?: boolean;
  candidatesOnly?: boolean;
  candidates?: LightUser[];
  denied?: LightUser[];
  isCandidate?: boolean;
  isDenied?: boolean;
  candidatesFull?: boolean;
  secondsToFinish?: number;
  secondsToStart?: number;
  me?: any;
  isBot?: boolean;
  featured?: Featured;
  podium?: Podium[];
  playerInfo?: PlayerInfo;
  pairingsClosed?: boolean;
  stats?: any;
  socketVersion?: number;
  teamStanding?: RankedTeam[];
  myTeam?: RankedTeam;
  duelTeams?: any;
}

export interface Podium extends ArenaPlayer {
  nb: SheetData;
  performance: string;
}

interface SheetData {
  game: number;
  berserk: number;
  win: number;
}

export interface Featured {
  id: string;
  sfen: string;
  color: Color;
  lastMove: string;
  variant: VariantKey;
  sente: FeaturedPlayer;
  gote: FeaturedPlayer;
}

export interface FeaturedPlayer extends BasePlayer {
  rank: number;
  berserk?: boolean;
}

export interface TournamentDataFull extends TournamentDataBase {
  id: string;
  createdBy: string;
  startsAt: string;
  system: 'arena' | 'robin' | 'organized';
  fullName: string;
  minutes: number;
  perf: {
    icon: string;
    name: string;
  };
  clock: TimeControl;
  variant: VariantKey;
  rated: boolean;
  spotlight: Spotlight;
  berserkable?: boolean;
  isFull?: boolean;
  maxGames?: number;
  position?: {
    name: string;
    sfen: string;
  };
  verdicts?: any;
  schedule?: {
    freq: string;
    speed: string;
  };
  private?: boolean;
  proverb?: Proverb;
  defender?: string; // shield
  animal: {
    name: string;
    url: string;
  };
  teamBattle?: TeamBattle;
}

interface TCRealTime {
  limit: number;
  byoymi: number;
  increment: number;
}

interface TCCorres {
  days: number;
}

type TimeControl = TCRealTime | TCCorres;

interface Spotlight {
  headline: string;
  description: string;
  iconImg?: string;
  iconFont?: string;
}

export interface TeamBattle {
  teams: {
    [id: string]: string;
  };
  joinWith: string[];
  hasMoreThanTenTeams?: boolean;
}

export interface RankedTeam {
  id: string;
  rank: number;
  score: number;
  players: TeamPlayer[];
}

interface TeamPlayer {
  user: {
    name: string;
  };
  name: string;
  rating: number;
  score: number;
  fire: boolean;
  title?: string;
}

type Page = ArenaPlayer[] | ArrangementPlayer[];

export interface Pages {
  [n: number]: Page;
}

export interface PageData {
  currentPage: number;
  maxPerPage: number;
  from: number;
  to: number;
  currentPageResults: Page;
  nbResults: number;
  nbPages: number;
}

export interface PlayerInfo {
  id?: string;
  player?: any;
  data?: any;
}
export interface TeamInfo {
  id: string;
  nbPlayers: number;
  rating: number;
  perf: number;
  score: number;
  topPlayers: TeamPlayer[];
}

export interface Duel {
  id: string;
  p: [DuelPlayer, DuelPlayer];
}

export interface DuelPlayer {
  n: string; // name
  r: number; // rating
  k: number; // rank
  t?: string; // title
}

export interface DuelTeams {
  [userId: string]: string;
}

export interface Arrangement {
  id: string;
  user1?: ArrangementUser;
  user2?: ArrangementUser;
  name?: string;
  color?: Color;
  points?: Points;
  gameId?: string;
  startedAt?: number;
  status?: StatusId;
  winner?: string;
  plies?: number;
  scheduledAt?: number;
  locked?: boolean;
}

export interface ArrangementUser {
  id: string;
  scheduledAt?: number;
}

export interface Points {
  w: number;
  d: number;
  l: number;
}

export type NewArrangement = Partial<Arrangement>;

export interface NewArrangementSettings {
  points?: Points;
  scheduledAt?: number;
}
