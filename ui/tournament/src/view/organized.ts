import { type MaybeVNode, type MaybeVNodes, bind } from 'common/snabbdom';
import { ids } from 'game/status';
import { i18n } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../ctrl';
import type { Arrangement, ArrangementPlayer, PageData } from '../interfaces';
import { arrangementHasUser, preloadUserTips, player as renderPlayer } from './util';

function tableClick(ctrl: TournamentController): (e: Event) => void {
  return (e: Event) => {
    const target = e.target as HTMLElement;
    const id = target.dataset.id;
    if (id) {
      ctrl.showArrangement(ctrl.data.standing.arrangements.find(a => a.id === id));
    }
  };
}

function pointsTag(ctrl: TournamentController, arr: Arrangement, player: ArrangementPlayer) {
  const player2 = ctrl.data.standing.players.find(
    p => p.id === (arr.user1.id === player.id ? arr.user2.id : arr.user1.id),
  );
  const points = arr.points || { w: 3, d: 2, l: 1 };
  const w = arr.winner === player.id;
  const l = !!arr.winner && !w;
  return h(
    'span',
    {
      attrs: {
        title: arr.name || `${player.name} vs ${player2?.name || '???'}`,
        'data-id': arr.id!,
      },
      class: {
        d: !arr.winner,
        w,
        l,
      },
    },
    points[w ? 'w' : l ? 'l' : 'd'],
  );
}

function playerTr(ctrl: TournamentController, player: ArrangementPlayer, rank: number) {
  const arrs = ctrl.data.standing.arrangements.filter(
    a => a.status && a.status >= ids.mate && arrangementHasUser(a, player.id),
  );
  return h(
    'tr',
    {
      key: player.id,
      class: {
        me: ctrl.opts.userId === player.id,
        long: arrs.length > 35,
        xlong: arrs.length > 80,
        active: ctrl.playerInfo.id === player.id,
        kicked: !!player.kicked,
      },
    },
    [
      h(
        'td.rank',
        player.withdraw
          ? h('i', {
              attrs: {
                'data-icon': player.kicked ? 'L' : 'Z',
                title: player.kicked ? i18n('denied') : i18n('pause'),
              },
            })
          : rank,
      ),
      h('td.player', [renderPlayer(player, false, true)]),
      h(
        'td.sheet',
        arrs.map(a => pointsTag(ctrl, a, player)),
      ),
      h('td.total', h('strong', player.kicked ? '-' : player.score)),
    ],
  );
}

let lastBody: MaybeVNodes | undefined;
export function standing(ctrl: TournamentController, pag: PageData, klass?: string): VNode {
  const tableBody = pag.currentPageResults
    ? pag.currentPageResults.map((res, i) => playerTr(ctrl, res as ArrangementPlayer, i + 1))
    : lastBody;
  if (pag.currentPageResults) lastBody = tableBody;
  return h(
    `table.slist.tour__standing${klass ? `.${klass}` : ''}`,
    { hook: bind('click', tableClick(ctrl)) },
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
  );
}

export function organizeArrangementButton(ctrl: TournamentController): MaybeVNode {
  if (!ctrl.isCreator() || ctrl.data.isFinished) return;
  return h(
    'button.fbt.text',
    {
      hook: bind('click', () => {
        ctrl.showOrganizerArrangement(ctrl.newArrangementSettings());
      }),
    },
    i18n('createAGame'),
  );
}
