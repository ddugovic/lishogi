import { h, type VNode } from 'snabbdom';
import { bind, type MaybeVNodes, onInsert } from './snabbdom';

interface Modal {
  class?: string;
  content: MaybeVNodes;
  onInsert?: (el: HTMLElement) => void;
  onClose(): void;
}

export function modal(d: Modal): VNode {
  return h(
    'div#modal-overlay',
    {
      hook: bind('mousedown', d.onClose),
    },
    [
      h(
        `div#modal-wrap.${d.class}`,
        {
          hook: onInsert(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            d.onInsert?.(el);
          }),
        },
        [
          h('span.close', {
            attrs: { 'data-icon': 'L' },
            hook: bind('click', d.onClose),
          }),
          h('div', d.content),
        ],
      ),
    ],
  );
}
