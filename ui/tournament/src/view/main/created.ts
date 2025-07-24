import type { MaybeVNodes } from 'common/snabbdom';
import type { VNode } from 'snabbdom';
import type TournamentController from '../../ctrl';
import * as pagination from '../../pagination';
import { teamStanding } from '../arena/battle';
import { arenaControls } from '../arena/controls';
import { arenaStanding } from '../arena/standing';
import { organizedList } from '../arrangement/organized/list';
import { robinControls } from '../arrangement/robin/controls';
import { robinList } from '../arrangement/robin/list';
import { robinTable } from '../arrangement/robin/table';
import header from '../header';
import type { ViewHandler } from '../main';
import { proverbWrap } from '../util';

const name = 'created';

function main(ctrl: TournamentController): MaybeVNodes {
  const pag = pagination.players(ctrl);
  if (ctrl.isArena())
    return [
      header(ctrl),
      teamStanding(ctrl, 'created'),
      arenaControls(ctrl, pag),
      arenaStanding(ctrl, pag, 'created'),
      proverbWrap(ctrl),
    ];
  else if (ctrl.isRobin())
    return [
      header(ctrl),
      robinControls(ctrl),
      robinTable(ctrl, 'created'),
      robinList(ctrl),
      proverbWrap(ctrl),
    ];
  else return [header(ctrl), organizedList(ctrl), proverbWrap(ctrl)];
}

function table(_ctrl: TournamentController): VNode | undefined {
  return undefined;
}

export const created: ViewHandler = {
  name,
  main,
  table,
};
