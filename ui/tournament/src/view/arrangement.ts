import { type MaybeVNode, bind } from 'common/snabbdom';
import { ids } from 'game/status';
import { i18n } from 'i18n';
import { h } from 'snabbdom';
import type TournamentController from '../ctrl';
import type { Arrangement } from '../interfaces';
import { arrangementHasUser, playerName } from './util';

export function yourUpcoming(ctrl: TournamentController): MaybeVNode {
  const arrs = (ctrl.data.standing.arrangements as Arrangement[])
    .filter(a => arrangementHasUser(a, ctrl.opts.userId) && !a.gameId)
    .sort((a, b) => (!a.scheduledAt || !b.scheduledAt ? 0 : a.scheduledAt - b.scheduledAt))
    .map(a => arrangementLine(ctrl, a));
  return ctrl.data.me
    ? h('div.arrs-list-wrap', [
        h('h2.arrs-title', i18n('tourArrangements:yourUpcomingGames')),
        arrs.some(a => !!a) ? h('div.arrs-list', arrs) : h('div.notours', i18n('study:noneYet')),
      ])
    : null;
}

export function allUpcomingAndOngoing(ctrl: TournamentController): MaybeVNode {
  const arrs = (ctrl.data.standing.arrangements as Arrangement[])
    .filter(a => !a.gameId || !a.status || a.status < ids.mate)
    .map(a => arrangementLine(ctrl, a));
  return arrs.some(a => !!a)
    ? h('div.arrs-list-wrap', [
        h('h2.arrs-title', i18n('tourArrangements:allUpcomingAndOngoingGames')),
        h('div.arrs-list', arrs),
      ])
    : null;
}

export function arrangementLine(ctrl: TournamentController, a: Arrangement): MaybeVNode {
  const isFlipped = a.user1.id === ctrl.opts.userId;
  const users = isFlipped ? [a.user2, a.user1] : [a.user1, a.user2];

  const players = users.map(u => ctrl.data.standing.players.find(p => p.id === u.id)!);

  const date = a.scheduledAt ? new Date(a.scheduledAt) : undefined;

  return h(
    'div.arr-line',
    {
      hook: bind('click', () => {
        ctrl.showArrangement(a);
      }),
      attrs: { href: `#${a.id}` },
    },
    [
      h('div.arr-line-name.', [
        a.name ? h('span.arr-name', a.name) : null,
        ...playerName(players[0]),
        ' - ',
        ...playerName(players[1]),
      ]),
      h(
        'div.arr-line-time',
        date
          ? h(
              'time.timeago',
              { attrs: { datetime: date.getTime() } },
              window.lishogi.timeago.format(date),
            )
          : null,
      ),
    ],
  );
}
