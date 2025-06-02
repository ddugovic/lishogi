import { type MaybeVNode, bind } from 'common/snabbdom';
import { ids } from 'game/status';
import { i18n, i18nFormat } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../ctrl';
import type { Arrangement, ArrangementPlayer } from '../interfaces';
import {
  arrangementHasUser,
  playerName,
  preloadUserTips,
  ratio2percent,
  player as renderPlayer,
} from './util';

function tableClick(ctrl: TournamentController): (e: Event) => void {
  return (e: Event) => {
    const target = e.target as HTMLElement;
    const players = target.dataset.p;
    if (players) {
      ctrl.showArrangement(ctrl.findOrCreateArrangement(players.split(';')));
    }
  };
}

function playerNameStanding(player: ArrangementPlayer) {
  const userId = player.name.toLowerCase();
  return h(
    'div',
    {
      key: userId,
    },
    [
      player.withdraw
        ? h('i', {
            attrs: {
              'data-icon': player.kicked ? 'L' : 'Z',
            },
          })
        : undefined,
      renderPlayer(player, false, true),
    ],
  );
}

export function standing(ctrl: TournamentController, klass?: string): VNode {
  const meId = ctrl.opts.userId;
  const players = ctrl.data.standing.players as ArrangementPlayer[];
  const maxScore = Math.max(...players.map(p => p.score || 0));
  const size = players.length;

  return h(`div.r-table-wrap${klass ? `.${klass}` : ''}${size === 0 ? '.none' : ''}`, [
    h(
      'div.r-table-wrap-players',
      h('table', [
        h('thead', h('tr', [h('th', '#'), h('th', i18n('player'))])),
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
          players.map((player, i) =>
            h(
              'tr',
              {
                class: {
                  me: ctrl.opts.userId === player.id,
                  long: player.name.length > 15,
                  kicked: !!player.kicked,
                },
              },
              [h('td', i + 1), h('td.player-name', playerNameStanding(player))],
            ),
          ),
        ),
      ]),
    ),
    h(
      'div.r-table-wrap-arrs',
      h('table', [
        h(
          'thead',
          h(
            'tr',
            players.map((player, i) =>
              h(
                'th',
                {
                  attrs: { title: player.name },
                  class: {
                    me: ctrl.opts.userId === player.id,
                  },
                },
                i + 1,
              ),
            ),
          ),
        ),
        h(
          'tbody',
          { hook: bind('click', tableClick(ctrl)) },
          players.map((player, i) =>
            h(
              'tr',
              {
                class: {
                  kicked: !!player.kicked,
                },
              },
              players.map((player2, j) => {
                const arr = ctrl.findArrangement([player.id, player2.id]);
                const key = `${player.id};${player2.id}`;
                const meAndOpponent =
                  meId === arr?.user1.id
                    ? [arr.user1, arr.user2]
                    : meId === arr?.user2.id
                      ? [arr.user2, arr.user1]
                      : undefined;

                return h(
                  'td',
                  {
                    attrs: {
                      title: i18nFormat('xVsY', player.name, player2.name),
                      'data-p': key,
                    },
                    class: {
                      same: i === j,
                      me: meId === player.id || meId === player2.id,
                    },
                  },
                  arr
                    ? h('div', {
                        class: {
                          p: arr.status == ids.started,
                          d: !!arr.status && arr.status >= ids.mate && !arr.winner,
                          w: arr.winner === player.id,
                          l: arr.winner === player2.id,
                          'pre-sched':
                            !ctrl.data.isFinished &&
                            (!!arr?.user1.scheduledAt || !!arr?.user2.scheduledAt),
                          sched: !ctrl.data.isFinished && !!arr?.scheduledAt,
                          ready: !!meAndOpponent && !!ctrl.arrangementUserReady(meAndOpponent[1]),
                        },
                      })
                    : null,
                );
              }),
            ),
          ),
        ),
      ]),
    ),
    h(
      'div.r-table-wrap-scores',
      h('table', [
        h('thead', h('tr', h('th', 'Σ'))),
        h(
          'tbody',
          players.map(player =>
            h(
              'tr',
              { class: { kicked: !!player.kicked } },
              h(
                'td',
                {
                  class: {
                    winner: !!maxScore && maxScore === player.score,
                    me: player.id === meId,
                  },
                },
                player.score || 0,
              ),
            ),
          ),
        ),
      ]),
    ),
  ]);
}

function podiumUsername(p: ArrangementPlayer) {
  return h(
    'a.text.ulpt.user-link',
    {
      attrs: { href: `/@/${p.name}` },
    },
    playerName(p),
  );
}

function podiumStats(p: ArrangementPlayer, games: Arrangement[]): VNode {
  const userId = p.id;
  const gamesOfPlayer = games.filter(a => arrangementHasUser(a, userId));
  return h('table.stats', [
    // p.performance ? h('tr', [h('th', i18n('performance')), h('td', p.performance)]) : null,
    h('tr', [h('th', i18n('gamesPlayed')), h('td', gamesOfPlayer.length)]),
    ...(gamesOfPlayer.length
      ? [
          h('tr', [
            h('th', i18n('winRate')),
            h(
              'td',
              ratio2percent(
                gamesOfPlayer.filter(g => g.winner === userId).length / gamesOfPlayer.length,
              ),
            ),
          ]),
        ]
      : []),
  ]);
}

function podiumPosition(p: ArrangementPlayer, pos: string, games: Arrangement[]): MaybeVNode {
  if (p) return h(`div.${pos}`, [h('div.trophy'), podiumUsername(p), podiumStats(p, games)]);
  else return;
}

export function podium(ctrl: TournamentController): VNode {
  const p = [...ctrl.data.standing.players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) as ArrangementPlayer[];
  const games = ctrl.data.standing.arrangements.filter(a => !!a.gameId);
  return h('div.tour__podium', [
    podiumPosition(p[1], 'second', games),
    podiumPosition(p[0], 'first', games),
    podiumPosition(p[2], 'third', games),
  ]);
}
