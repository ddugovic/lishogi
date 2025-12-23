import { rankFromRating } from 'shogi/rank';
import { usernameVNodes } from 'shogi/username';
import { h, type VNode } from 'snabbdom';
import type SimulCtrl from '../ctrl';
import type { Player } from '../interfaces';

export function player(p: Player, ctrl: SimulCtrl): VNode {
  const isHost = ctrl.data.host.id === p.id;
  return h(
    'a.ulpt.user-link.online',
    {
      attrs: {
        href: `/@/${p.id}`,
        'data-user-title': p.title || '',
      },
      hook: {
        destroy(vnode) {
          $.powerTip.destroy(vnode.elm as HTMLElement);
        },
      },
    },
    [
      !isHost ? h(`i.line${p.patron ? '.patron' : ''}`) : undefined,
      ...usernameVNodes({
        username: p.name,
        title: p.title,
        rank: p.rating && !p.provisional ? rankFromRating(p.rating) : undefined,
        countryCode: p.countryCode,
      }),
    ],
  );
}

export const title = (ctrl: SimulCtrl): VNode => {
  return h('div', [
    h('h1', { attrs: { title: ctrl.data.name } }, ctrl.data.name),
    h('span.author', player(ctrl.data.host as Player, ctrl)),
  ]);
};
