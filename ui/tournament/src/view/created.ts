import type { MaybeVNodes } from 'common/snabbdom';
import type { VNode } from 'snabbdom';
import type TournamentController from '../ctrl';
import * as pagination from '../pagination';
import { standing } from './arena';
import { allUpcomingAndOngoing, yourUpcoming } from './arrangement';
import { teamStanding } from './battle';
import { arenaControls, organizedControls, robinControls } from './controls';
import header from './header';
import type { ViewHandler } from './main';
import { standing as oStanding } from './organized';
import { standing as rStanding } from './robin';
import teamInfo from './team-info';
import { proverbWrap } from './util';

const name = 'created';

function main(ctrl: TournamentController): MaybeVNodes {
  const pag = pagination.players(ctrl);
  if (ctrl.isArena())
    return [
      header(ctrl),
      teamStanding(ctrl, 'created'),
      arenaControls(ctrl, pag),
      standing(ctrl, pag, 'created'),
      proverbWrap(ctrl),
    ];
  else if (ctrl.isRobin())
    return [
      header(ctrl),
      robinControls(ctrl),
      rStanding(ctrl, 'created'),
      yourUpcoming(ctrl),
      proverbWrap(ctrl),
    ];
  else
    return [
      header(ctrl),
      organizedControls(ctrl, pag),
      oStanding(ctrl, pag, 'created'),
      yourUpcoming(ctrl),
      allUpcomingAndOngoing(ctrl),
      proverbWrap(ctrl),
    ];
}

function table(ctrl: TournamentController): VNode | undefined {
  return ctrl.teamInfo.requested ? teamInfo(ctrl) : undefined;
}

export const created: ViewHandler = {
  name,
  main,
  table,
};
