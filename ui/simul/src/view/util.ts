import { i18nVdom } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type SimulCtrl from '../ctrl';
import type { Player } from '../interfaces';

export function player(p: Player, ctrl: SimulCtrl): VNode {
  return h(
    `a.text.ulpt.user-link.${ctrl.data.host.id != p.id ? 'online' : 'offline'}`,
    {
      attrs: { href: `/@/${p.id}` },
      hook: {
        destroy(vnode) {
          $.powerTip.destroy(vnode.elm as HTMLElement);
        },
      },
    },
    [
      h(`i.line${p.patron ? '.patron' : ''}`),
      h(
        'span.name',
        {
          class: {
            long: p.name.length > 8,
            vlong: p.name.length > 12,
          },
        },
        userName(p),
      ),
    ],
  );
}

const userName = (u: LightUser) => (u.title ? [h('span.utitle', u.title), ` ${u.name}`] : [u.name]);

export const title = (ctrl: SimulCtrl): VNode =>
  h('div', [
    h('h1', { attrs: { title: ctrl.data.name } }, ctrl.data.name),
    h('span.author', i18nVdom('by', player(ctrl.data.host as Player, ctrl))),
  ]);
