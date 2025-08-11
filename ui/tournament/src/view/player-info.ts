import { defined } from 'common/common';
import { modal } from 'common/modal';
import { bind, type MaybeVNode } from 'common/snabbdom';
import spinner from 'common/spinner';
import { ids } from 'game/status';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../ctrl';
import type { TourPlayer } from '../interfaces';
import { teamName } from './arena/battle';
import { numberRow, playerName, player as renderPlayer } from './util';

export function playerInfoModal(ctrl: TournamentController): MaybeVNode {
  return ctrl.playerInfo.id
    ? modal({
        class: 'actor-info-modal',
        content: [playerInfo(ctrl)],
        onClose: () => ctrl.unshowPlayerInfo(),
      })
    : undefined;
}

function playerTitle(player: TourPlayer) {
  return h('h2', [
    h('span.rank', 'rank' in player ? `${player.rank}. ` : ''),
    renderPlayer(player, {
      asLink: true,
      withRating: false,
    }),
  ]);
}

function getScore(ctrl: TournamentController, p: any): number | undefined {
  if (ctrl.isOrganized() || ctrl.isRobin()) {
    const points =
      ctrl.data.standing.arrangements.find(a => a.id === p.id)?.points ||
      ctrl.defaultArrangementPoints;
    return p.status === ids.draw
      ? points.d
      : p.win
        ? points.w
        : p.win === false
          ? points.l
          : undefined;
  } else return defined(p.score) ? (Array.isArray(p.score) ? p.score[0] : p.score) : undefined;
}

function playerInfo(ctrl: TournamentController): VNode {
  const data = ctrl.playerInfo.data;
  const tag = 'div.tour__player-info.tour__actor-info';

  if (!data || data.player.id !== ctrl.playerInfo.id)
    return h(tag, [h('div.stats', [playerTitle(ctrl.playerInfo.player), spinner()])]);
  const nb = data.player.nb;
  const poa = data.pairings || data.arrangements;
  const poaLen = poa.length;
  const avgOp = poaLen
    ? Math.round(poa.reduce((a: any, b: any) => a + b.op.rating, 0) / poaLen)
    : undefined;
  return h(tag, [
    h('div.stats', [
      playerTitle(data.player),
      data.player.team
        ? h(
            'team',
            {
              on: {
                click: () => {
                  ctrl.showTeamInfo(data.player.team);
                  ctrl.redraw();
                },
              },
            },
            [teamName(ctrl.data.teamBattle!, data.player.team)],
          )
        : null,
      h('table', [
        data.player.performance
          ? numberRow(
              i18n('performance'),
              data.player.performance + (nb.game < 3 ? '?' : ''),
              'raw',
            )
          : null,
        numberRow(i18n('gamesPlayed'), nb.game),
        ...(nb.game
          ? [
              numberRow(i18n('winRate'), [nb.win, nb.game], 'percent'),
              nb.berserk
                ? numberRow(i18n('berserkRate'), [nb.berserk, nb.game], 'percent')
                : undefined,
              numberRow(i18n('averageOpponent'), avgOp, 'raw'),
            ]
          : []),
      ]),
    ]),
    h('div', [
      h(
        'table.sublist',
        {
          hook: bind('click', e => {
            const href = ((e.target as HTMLElement).parentNode as HTMLElement).getAttribute(
              'data-href',
            );
            if (href) window.open(href, '_blank');
          }),
        },
        poa.map((p: any, i: number) => {
          const arr = ctrl.isArena()
            ? undefined
            : ctrl.data.standing.arrangements.find(a => a.gameId === p.id);
          const score = getScore(ctrl, p);

          return h(
            `tr.glpt${p.win ? '.win' : p.win === false ? '.loss' : ''}`,
            {
              key: p.id,
              attrs: { 'data-href': `/${p.id}/${p.color}` },
              hook: {
                destroy: vnode => $.powerTip.destroy(vnode.elm as HTMLElement),
              },
            },
            [
              h('th', `${Math.max(nb.game, poaLen) - i}`),
              arr?.name ? h('td.name.bold', arr.name) : undefined,
              h('td.name', playerName(p.op)),
              h(`td.is.color-icon.${p.color}`),
              h('td.score', defined(score) ? score : '*'),
            ],
          );
        }),
      ),
    ]),
  ]);
}
