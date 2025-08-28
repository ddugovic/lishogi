import { icons } from 'common/icons';
import { dataIcon, onInsert } from 'common/snabbdom';
import { h, type VNode } from 'snabbdom';

export function members(): VNode {
  return h(
    'div.chat__members.none',
    {
      hook: onInsert(el => $(el).watchers()),
      attrs: {
        'aria-live': 'off',
      },
    },
    h('div.chat__members__inner', [
      h('span.number', { attrs: dataIcon(icons.person) }, '0'),
      ' ',
      h('span.list'),
    ]),
  );
}
