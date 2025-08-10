import { bind } from 'common/snabbdom';
import { ids } from 'game/status';
import { i18n, i18nFormat } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../../../ctrl';
import type { ArrangementPlayer } from '../../../interfaces';
import { preloadUserTips, player as renderPlayer } from '../../util';

function tableClick(ctrl: TournamentController): (e: Event) => void {
  return (e: Event) => {
    const target = e.target as HTMLElement;
    const key = target.dataset.key;

    if (key) ctrl.showArrangement(ctrl.findOrCreateArrangement(key));
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
      renderPlayer(player, {
        asLink: false,
        withRating: true,
      }),
    ],
  );
}

function tablesHover(vnode: VNode) {
  const wrapEl = vnode.elm as HTMLElement;
  const allTables = wrapEl.querySelectorAll<HTMLTableElement>('table');
  const arrTable = wrapEl.querySelector<HTMLTableElement>('.r-table-wrap-arrs table');

  allTables.forEach(table => {
    table.addEventListener('mouseover', (e: MouseEvent) => {
      if (!e.target) return;

      const targetEl = e.target as HTMLElement;
      const td = targetEl.closest('td') || targetEl.closest('th');
      const tr = targetEl.closest('tr');
      if (!td || !tr || !table.contains(tr)) return;

      const rowIndex = Array.from(table.querySelectorAll('tr')).indexOf(tr);
      const cellIndex = Array.from(tr.children).indexOf(td);

      requestAnimationFrame(() => {
        wrapEl
          .querySelectorAll('td.hovered, th.hovered')
          .forEach(td => td.classList.remove('hovered'));

        allTables.forEach(table => {
          const row = table.querySelectorAll('tr')[rowIndex];
          if (row) row.querySelectorAll('td').forEach(td => td.classList.add('hovered'));
        });

        // Only do column highlight for arrangement table
        if (arrTable && table === arrTable) {
          arrTable.querySelectorAll('tr').forEach(row => {
            const cell = row.querySelectorAll('td, th')[cellIndex];
            if (cell) cell.classList.add('hovered');
          });
        }
      });
    });

    table.addEventListener('mouseleave', () => {
      requestAnimationFrame(() => {
        wrapEl
          .querySelectorAll('td.hovered, th.hovered')
          .forEach(td => td.classList.remove('hovered'));
      });
    });
  });
}

export function robinTable(ctrl: TournamentController, klass?: string): VNode {
  const meId = ctrl.opts.userId;
  const players = ctrl.data.standing.players as ArrangementPlayer[];
  const maxScore = Math.max(...players.map(p => p.score || 0));
  const size = players.length;

  return h(
    `div.r-table-wrap${klass ? `.${klass}` : ''}${size === 0 ? '.empty' : ''}`,
    {
      hook: {
        insert: tablesHover,
      },
    },
    [
      size === 0
        ? h('div.no-players.text', { attrs: { 'data-icon': '' } }, i18n('noPlayersJoinedYet'))
        : null,
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
                    long: player.name.length > 15,
                    kicked: !!player.kicked,
                  },
                },
                [
                  h(
                    'td',
                    {
                      class: {
                        me: ctrl.opts.userId === player.id,
                      },
                    },
                    i + 1,
                  ),
                  h(
                    'td.player-name',
                    {
                      class: {
                        me: ctrl.opts.userId === player.id,
                      },
                    },
                    playerNameStanding(player),
                  ),
                ],
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
                  const id = ctrl.makeRobinId([player.id, player2.id]);
                  const arr = id ? ctrl.findArrangement(id) : undefined;

                  return h(
                    'td',
                    {
                      attrs: {
                        title: id ? i18nFormat('xVsY', player.name, player2.name) : false,
                        'data-key': id || false,
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
    ],
  );
}
