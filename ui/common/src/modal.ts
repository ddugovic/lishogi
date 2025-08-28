import { h, type VNode } from 'snabbdom';
import { icons } from './icons';
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
            attrs: { 'data-icon': icons.cancel },
            hook: bind('click', d.onClose),
          }),
          h('div', d.content),
        ],
      ),
    ],
  );
}

interface ModalJs {
  class?: string;
  content: string | HTMLElement;
  onInsert?: (el: HTMLElement) => void;
  onClose?(): void;
}

export function modalJs(d: ModalJs): void {
  // one instance at most for each class
  if (d.class && document.body.querySelector(`#modal-wrap.${d.class}`)) return;

  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';

  const wrap = document.createElement('div');
  wrap.id = 'modal-wrap';
  if (d.class) wrap.className = d.class;
  wrap.addEventListener('mousedown', e => e.stopPropagation());

  const closeBtn = document.createElement('span');
  closeBtn.className = 'close';
  closeBtn.setAttribute('data-icon', icons.cancel);
  closeBtn.addEventListener('click', close);

  const contentEl = document.createElement('div');
  if (typeof d.content === 'string') contentEl.innerHTML = d.content;
  else contentEl.appendChild(d.content);

  wrap.appendChild(closeBtn);
  wrap.appendChild(contentEl);
  overlay.appendChild(wrap);
  document.body.appendChild(overlay);

  d.onInsert?.(wrap);
  overlay.addEventListener('mousedown', close);

  function close() {
    overlay.removeEventListener('mousedown', close);
    wrap.removeEventListener('mousedown', e => e.stopPropagation());
    closeBtn.removeEventListener('click', close);
    document.body.removeChild(overlay);
    d.onClose?.();
  }
}
