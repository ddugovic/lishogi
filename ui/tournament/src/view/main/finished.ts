import { loadLishogiScript } from 'common/assets';
import type { MaybeVNode, MaybeVNodes } from 'common/snabbdom';
import { once } from 'common/storage';
import { i18n, i18nFormatCapitalized } from 'i18n';
import { colorName } from 'shogi/color-name';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../../ctrl';
import type { TournamentDataFull } from '../../interfaces';
import * as pagination from '../../pagination';
import { teamStanding } from '../arena/battle';
import { arenaControls } from '../arena/controls';
import { arenaPodium } from '../arena/podium';
import { arenaStanding } from '../arena/standing';
import { organizedList } from '../arrangement/organized/list';
import { arrangementPodium } from '../arrangement/podium';
import { robinControls } from '../arrangement/robin/controls';
import { robinList } from '../arrangement/robin/list';
import { robinTable } from '../arrangement/robin/table';
import header from '../header';
import type { ViewHandler } from '../main';
import { numberRow } from '../util';

function confetti(data: TournamentDataFull): MaybeVNode {
  if (data.me && data.isRecentlyFinished && once(`tournament.end.canvas.${data.id}`))
    return h('canvas#confetti', {
      hook: {
        insert: vnode =>
          loadLishogiScript('misc.confetti').then(() => {
            window.lishogi.modules.miscConfetti(vnode.elm as HTMLCanvasElement);
          }),
      },
    });
  else return null;
}

function stats(data: TournamentDataFull): VNode {
  const tableData = [
    numberRow(i18n('averageElo'), data.stats.averageRating, 'raw'),
    numberRow(i18n('gamesPlayed'), data.stats.games),
    numberRow(i18n('movesPlayed'), data.stats.moves),
    numberRow(
      i18nFormatCapitalized('xWins', colorName('sente', false)),
      [data.stats.senteWins, data.stats.games],
      'percent',
    ),
    numberRow(
      i18nFormatCapitalized('xWins', colorName('gote', false)),
      [data.stats.goteWins, data.stats.games],
      'percent',
    ),
    numberRow(i18n('draws'), [data.stats.draws, data.stats.games], 'percent'),
  ];

  if (data.berserkable) {
    const berserkRate = [data.stats.berserks / 2, data.stats.games];
    tableData.push(numberRow(i18n('berserkRate'), berserkRate, 'percent'));
  }

  return h('div.tour__stats', [h('h2', i18n('tournamentComplete')), h('table', tableData)]);
}

const name = 'finished';

function main(ctrl: TournamentController): MaybeVNodes {
  const pag = pagination.players(ctrl);
  const teamS = teamStanding(ctrl, 'finished');
  if (ctrl.isArena())
    return [
      ...(teamS
        ? [header(ctrl), teamS]
        : [h('div.big_top', [confetti(ctrl.data), header(ctrl), arenaPodium(ctrl)])]),
      arenaControls(ctrl, pag),
      arenaStanding(ctrl, pag),
    ];
  else if (ctrl.isRobin())
    return [
      ...(teamS
        ? [header(ctrl), teamS]
        : [h('div.big_top', [confetti(ctrl.data), header(ctrl), arrangementPodium(ctrl)])]),
      robinControls(ctrl),
      robinTable(ctrl, 'finished'),
      robinList(ctrl),
    ];
  else
    return [
      ...(teamS
        ? [header(ctrl), teamS]
        : [h('div.big_top', [confetti(ctrl.data), header(ctrl), arrangementPodium(ctrl)])]),
      organizedList(ctrl),
    ];
}

function table(ctrl: TournamentController): VNode | undefined {
  return ctrl.data.stats ? stats(ctrl.data) : undefined;
}

export const finished: ViewHandler = {
  name,
  main,
  table,
};
