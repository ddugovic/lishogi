export interface SimulOpts {
  data: SimulData;
  userId?: string;
  $side: JQuery;
  socketVersion: number;
  chat: any;
  socketSend: Socket.Send;
}

export interface SimulData {
  id: string;
  name: string;
  isCreated: boolean;
  isRunning: boolean;
  isFinished: boolean;
  text: string;
  host: Host;
  variants: VariantKey[];
  applicants: Applicant[];
  pairings: Pairing[];
  proverb?: Proverb;
  team?: Team;
}

interface Team {
  id: string;
  name: string;
  isIn: boolean;
}

export interface Player extends LightUser {
  variant: VariantKey;
  rating: number;
  provisional?: boolean;
  countryCode: string;
}

interface Host extends LightUser {
  rating: number;
  gameId?: string;
}

export interface Applicant {
  player: Player;
  accepted: boolean;
}

export interface Pairing {
  player: Player;
  variant: VariantKey;
  hostColor: Color;
  game: Game;
}

interface Game {
  id: string;
  status: number;
  variant: VariantKey;
  sfen: string;
  lastMove: string;
  orient: Color;
  winner?: Color;
  played?: boolean;
}
