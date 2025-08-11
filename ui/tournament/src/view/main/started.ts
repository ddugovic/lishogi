import type { MaybeVNodes } from 'common/snabbdom';
import { i18n, i18nFormat } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../ctrl';
import * as pagination from '../../pagination';
import * as tour from '../../tournament';
import { teamStanding } from '../arena/battle';
import { arenaControls } from '../arena/controls';
import { arenaStanding } from '../arena/standing';
import { organizedList } from '../arrangement/organized/list';
import { robinControls } from '../arrangement/robin/controls';
import { robinList } from '../arrangement/robin/list';
import { robinTable } from '../arrangement/robin/table';
import header from '../header';
import type { ViewHandler } from '../main';
import tourTable from '../table';
import { proverbWrap } from '../util';

function joinTheGame(gameId: string) {
  return h(
    'a.tour__ur-playing.button.is.is-after',
    {
      attrs: { href: `/${gameId}` },
    },
    [i18n('youArePlaying'), h('br'), i18n('joinTheGame')],
  );
}

function notice(ctrl: TournamentController): VNode {
  return tour.willBePaired(ctrl)
    ? h('div.tour__notice', i18nFormat('standByX', ctrl.data.me.username))
    : h('div.tour__notice.closed', i18n('tournamentPairingsAreNowClosed'));
}

const name = 'started';

function main(ctrl: TournamentController): MaybeVNodes {
  const gameId = ctrl.myGameId();
  const pag = pagination.players(ctrl);

  if (ctrl.isArena())
    return [
      header(ctrl),
      gameId ? joinTheGame(gameId) : tour.isIn(ctrl) ? notice(ctrl) : null,
      teamStanding(ctrl, 'started'),
      arenaControls(ctrl, pag),
      arenaStanding(ctrl, pag, 'started'),
      !ctrl.data.nbPlayers ? proverbWrap(ctrl) : null,
    ];
  else if (ctrl.isRobin())
    return [
      header(ctrl),
      gameId ? joinTheGame(gameId) : null,
      robinControls(ctrl),
      robinTable(ctrl, 'started'),
      robinList(ctrl),
      !ctrl.data.nbPlayers ? proverbWrap(ctrl) : null,
    ];
  else
    return [
      header(ctrl),
      gameId ? joinTheGame(gameId) : null,
      organizedList(ctrl),
      !ctrl.data.nbPlayers ? proverbWrap(ctrl) : null,
    ];
}

function table(ctrl: TournamentController): VNode | undefined {
  if (ctrl.isRobin() || ctrl.isOrganized()) return undefined;
  else return tourTable(ctrl);
}

export const started: ViewHandler = {
  name,
  main,
  table,
};
