import type { MaybeVNode } from 'common/snabbdom';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../ctrl';
import type { Arrangement, ArrangementPlayer } from '../../interfaces';
import { arrangementHasUser, playerName, ratio2percent } from '../util';

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
    h('tr', [h('th', i18n('points')), h('td', p.score || 0)]),
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

export function arrangementPodium(ctrl: TournamentController): VNode {
  const p = ([...ctrl.data.standing.players] as ArrangementPlayer[])
    .sort((a, b) => (b.magicScore || 0) - (a.magicScore || 0))
    .slice(0, 3);
  const games = ctrl.data.standing.arrangements.filter(a => !!a.gameId);
  return h('div.tour__podium', [
    podiumPosition(p[1], 'second', games),
    podiumPosition(p[0], 'first', games),
    podiumPosition(p[2], 'third', games),
  ]);
}
