import { dataIcon, type MaybeVNodes } from 'common/snabbdom';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../ctrl';
import type { ArenaPlayer, PageData } from '../../interfaces';
import { preloadUserTips, player as renderPlayer } from '../util';
import { teamName } from './battle';

const scoreTagNames = ['score', 'streak', 'double'];

function scoreTag(s: any) {
  return h(scoreTagNames[(s[1] || 1) - 1], [Array.isArray(s) ? s[0] : s]);
}

function playerTr(ctrl: TournamentController, player: ArenaPlayer) {
  if (!player.sheet) return;
  const userId = player.name.toLowerCase();
  const nbScores = player.sheet.scores.length;
  const battle = ctrl.data.teamBattle;
  return h(
    'tr',
    {
      key: userId,
      class: {
        me: ctrl.opts.userId === userId,
        long: nbScores > 35,
        xlong: nbScores > 80,
        disabled: !ctrl.data.isStarted || !ctrl.data.isFinished,
      },
      on: {
        click: () => {
          ctrl.showPlayerInfo(player);
          ctrl.redraw();
        },
      },
    },
    [
      h(
        'td.rank',
        player.withdraw
          ? h('i', {
              attrs: {
                'data-icon': 'Z',
                title: i18n('pause'),
              },
            })
          : player.rank,
      ),
      h('td.player', [
        renderPlayer(player, {
          asLink: false,
          withRating: true,
          defender: userId === ctrl.data.defender,
        }),
        ...(battle && player.team ? [' ', teamName(battle, player.team)] : []),
      ]),
      h('td.sheet', player.sheet.scores.map(scoreTag)),
      h('td.total', [
        player.sheet.fire && !ctrl.data.isFinished
          ? h('strong.is-gold', { attrs: dataIcon('Q') }, player.sheet.total)
          : h('strong', player.sheet.total),
      ]),
    ],
  );
}

let lastBody: MaybeVNodes | undefined;

export function arenaStanding(ctrl: TournamentController, pag: PageData, klass?: string): VNode {
  const tableBody = pag.currentPageResults
    ? pag.currentPageResults.map(res => playerTr(ctrl, res as ArenaPlayer))
    : lastBody;
  if (pag.currentPageResults) lastBody = tableBody;
  return h(
    `table.slist.tour__standing${klass ? `.${klass}` : ''}`,
    {
      class: { loading: !pag.currentPageResults },
    },
    [
      h(
        'tbody',
        {
          hook: {
            insert: vnode => preloadUserTips(vnode.elm as HTMLElement),
            update(_, vnode) {
              preloadUserTips(vnode.elm as HTMLElement);
            },
          },
        },
        tableBody,
      ),
    ],
  );
}
