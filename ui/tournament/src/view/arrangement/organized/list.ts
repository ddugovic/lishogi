import type { VNode } from 'snabbdom';
import type TournamentController from '../../../ctrl';
import { tabulatedView } from '../tabs';

export function organizedList(ctrl: TournamentController): VNode {
  return tabulatedView(ctrl, ['players', 'games', 'challenges'], true);
}
