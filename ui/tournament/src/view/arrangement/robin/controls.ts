import { icons } from 'common/icons';
import type { MaybeVNode } from 'common/snabbdom';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../../ctrl';
import * as buttons from '../../button';

export function robinControls(ctrl: TournamentController): VNode {
  return h(
    'div.tour__controls',
    {
      hook: {
        insert: () => {
          robinArrowControls(ctrl);
        },
        destroy: () => {
          cleanupRobinArrowControls();
        },
      },
    },
    [
      h('div.pager', [
        controlButton(i18n('study:first'), icons.first, 'first'),
        controlButton(i18n('study:previous'), icons.prev, 'prev'),
        controlButton(i18n('study:next'), icons.next, 'next'),
        controlButton(i18n('study:last'), icons.last, 'last'),
      ]),
      h('div.right', buttons.joinWithdraw(ctrl)),
    ],
  );
}

let listeners: (() => void)[] = [];
function robinArrowControls(ctrl: TournamentController) {
  const container = document.querySelector('.r-table-wrap-arrs') as HTMLElement;
  const table = container.querySelector('table') as HTMLElement;
  const controls = document.querySelector('.tour__controls') as HTMLElement;
  const firstArrow = controls.querySelector('button.first') as HTMLElement;
  const prevArrow = controls.querySelector('button.prev') as HTMLElement;
  const nextArrow = controls.querySelector('button.next') as HTMLElement;
  const lastArrow = controls.querySelector('button.last') as HTMLElement;

  function updateArrowState() {
    const canScrollLeft = container.scrollLeft > 0;
    const canScrollRight =
      Math.round(container.scrollLeft) < container.scrollWidth - container.clientWidth - 1;

    firstArrow.classList.toggle('disabled', !canScrollLeft);
    prevArrow.classList.toggle('disabled', !canScrollLeft);

    nextArrow.classList.toggle('disabled', !canScrollRight);
    lastArrow.classList.toggle('disabled', !canScrollRight);
  }

  function calculateColumnWidth() {
    const tableWidth = table.offsetWidth;
    return tableWidth / ctrl.data.standing.players.length;
  }

  function scrollLeft(max = false) {
    const columnWidth = calculateColumnWidth();
    const scrollDistance = max
      ? -container.scrollLeft
      : -((Math.floor(container.clientWidth / columnWidth) - 1) * columnWidth);

    container.scrollBy({
      left: scrollDistance,
      behavior: 'smooth',
    });
  }

  function scrollRight(max = false) {
    const columnWidth = calculateColumnWidth();
    const maxScrollRight = container.scrollWidth - container.clientWidth;
    const scrollDistance = max
      ? maxScrollRight - container.scrollLeft
      : (Math.floor(container.clientWidth / columnWidth) - 1) * columnWidth;

    container.scrollBy({
      left: scrollDistance,
      behavior: 'smooth',
    });
  }

  listeners = [
    attachListener(firstArrow, 'click', () => scrollLeft(true)),
    attachListener(prevArrow, 'click', () => scrollLeft(false)),
    attachListener(nextArrow, 'click', () => scrollRight(false)),
    attachListener(lastArrow, 'click', () => scrollRight(true)),
    attachListener(container, 'scroll', updateArrowState),
    attachListener(window, 'resize', updateArrowState),
  ];

  updateArrowState();
}

function cleanupRobinArrowControls() {
  listeners.forEach(unbind => {
    unbind();
  });
  listeners = [];
}

function attachListener(el: HTMLElement | Window, event: string, handler: EventListener) {
  el.addEventListener(event, handler);
  return () => el.removeEventListener(event, handler);
}

function controlButton(text: string, icon: string, cls: string, el: MaybeVNode = undefined): VNode {
  return h(
    `button.fbt.is.${cls}`,
    {
      attrs: {
        'data-icon': icon,
        title: text,
      },
    },
    el,
  );
}
