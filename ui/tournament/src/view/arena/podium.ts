import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../ctrl';
import type { Podium } from '../../interfaces';
import { playerName, ratio2percent } from '../util';

function podiumUsername(p: Podium) {
  return h(
    'a.text.ulpt.user-link',
    {
      attrs: { href: `/@/${p.name}` },
    },
    playerName(p),
  );
}

function podiumStats(p: Podium): VNode {
  const nb = p.nb;
  return h('table.stats', [
    p.performance ? h('tr', [h('th', i18n('performance')), h('td', p.performance)]) : null,
    h('tr', [h('th', i18n('gamesPlayed')), h('td', nb.game)]),
    ...(nb.game
      ? [
          h('tr', [h('th', i18n('winRate')), h('td', ratio2percent(nb.win / nb.game))]),
          h('tr', [h('th', i18n('berserkRate')), h('td', ratio2percent(nb.berserk / nb.game))]),
        ]
      : []),
  ]);
}

function podiumPosition(p: Podium, pos: string): VNode | undefined {
  if (p) return h(`div.${pos}`, [h('div.trophy'), podiumUsername(p), podiumStats(p)]);
  else return;
}

export function arenaPodium(ctrl: TournamentController): VNode {
  const p = ctrl.data.podium || [];
  return h('div.tour__podium', [
    podiumPosition(p[1], 'second'),
    podiumPosition(p[0], 'first'),
    podiumPosition(p[2], 'third'),
  ]);
}
