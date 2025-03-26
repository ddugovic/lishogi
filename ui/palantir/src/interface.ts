import type * as snabbdom from 'snabbdom';

export type State =
  | 'off'
  | 'opening'
  | 'getting-media'
  | 'ready'
  | 'calling'
  | 'answering'
  | 'getting-stream'
  | 'on'
  | 'stopping';

export interface PalantirOpts {
  uid: string;
  redraw(): void;
}

export interface Palantir {
  render(h: typeof snabbdom.h): any;
}
