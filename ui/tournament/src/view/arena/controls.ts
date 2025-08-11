import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../ctrl';
import type { PageData } from '../../interfaces';
import * as pagination from '../../pagination';
import { joinWithdraw } from '../button';

export function arenaControls(ctrl: TournamentController, pag: PageData): VNode {
  return h('div.tour__controls', [
    h('div.pager', pagination.renderPager(ctrl, pag)),
    h('div.right', joinWithdraw(ctrl)),
  ]);
}
