import type { VNode } from 'snabbdom';
import type TournamentController from '../../../ctrl';
import { tabulatedView } from '../tabs';

export function robinList(ctrl: TournamentController): VNode {
  return tabulatedView(ctrl, ['games', 'challenges']);
}
