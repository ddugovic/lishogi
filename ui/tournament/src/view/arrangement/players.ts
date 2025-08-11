import { i18n, i18nPluralSame } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../ctrl';
import type { ArrangementPlayer } from '../../interfaces';
import { preloadUserTips, player as renderPlayer } from '../util';

const maxlength = 15;

let expanded = false;
export function players(ctrl: TournamentController, klass?: string): VNode {
  const players = ctrl.data.standing.players;
  const trimPlayers = players.length > maxlength && !expanded;
  const trimmedPlayers = (
    trimPlayers ? players.slice(0, maxlength) : players
  ) as ArrangementPlayer[];

  return h('div.slist-wrap', [
    trimmedPlayers.length
      ? renderPlayers(ctrl, trimmedPlayers, klass)
      : h(
          'div.text.empty-tab',
          {
            attrs: {
              'data-icon': '',
            },
          },
          i18n('noPlayersJoinedYet'),
        ),
    trimPlayers
      ? h(
          'div.button.button-empty.view-more',
          {
            on: {
              click: () => {
                expanded = true;
                ctrl.redraw();
              },
            },
          },
          i18n('more'),
        )
      : null,
  ]);
}

function renderPlayers(
  ctrl: TournamentController,
  players: ArrangementPlayer[],
  klass?: string,
): VNode {
  return h(
    `table.slist.slist-clean.tour__standing${klass ? `.${klass}` : ''}`,
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
      players.map((p, i) => playerTr(ctrl, p as ArrangementPlayer, i + 1)),
    ),
  );
}

function playerTr(ctrl: TournamentController, player: ArrangementPlayer, rank: number) {
  return h(
    'tr',
    {
      key: player.id,
      class: {
        me: ctrl.opts.userId === player.id,
        kicked: !!player.kicked,
        first: rank === 1,
        disabled: !ctrl.data.isStarted && !ctrl.data.isFinished,
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
                'data-icon': player.kicked ? 'L' : 'Z',
                title: player.kicked ? i18n('denied') : i18n('pause'),
              },
            })
          : rank,
      ),
      h('td.player', [
        renderPlayer(player, {
          asLink: false,
          withRating: true,
        }),
      ]),
      h(
        'td.total',
        { attrs: { title: i18nPluralSame('nbTournamentPoints', player.score) } },
        h('strong', player.kicked ? '-' : player.score),
      ),
    ],
  );
}
