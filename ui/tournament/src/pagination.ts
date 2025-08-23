import { icons } from 'common/icons';
import { bind, type MaybeVNodes } from 'common/snabbdom';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from './ctrl';
import type { PageData } from './interfaces';
import { searchOr } from './search';

const maxPerPage = 10;

function button(
  text: string,
  icon: string,
  click: () => void,
  enable: boolean,
  ctrl: TournamentController,
): VNode {
  return h('button.fbt.is', {
    attrs: {
      'data-icon': icon,
      disabled: !enable,
      title: text,
    },
    hook: bind('mousedown', click, ctrl.redraw),
  });
}

export function renderPager(ctrl: TournamentController, pag: PageData): MaybeVNodes {
  const enabled = !!pag.currentPageResults;
  const page = ctrl.page;
  return pag.nbPages > -1
    ? searchOr(ctrl, [
        button(
          i18n('study:first'),
          icons.first,
          () => ctrl.userSetPage(1),
          enabled && page > 1,
          ctrl,
        ),
        button(i18n('study:previous'), icons.prev, ctrl.userPrevPage, enabled && page > 1, ctrl),
        h('span.page', `${pag.nbResults ? pag.from + 1 : 0}-${pag.to} / ${pag.nbResults}`),
        button(
          i18n('study:next'),
          icons.next,
          ctrl.userNextPage,
          enabled && page < pag.nbPages,
          ctrl,
        ),
        button(
          i18n('study:last'),
          icons.last,
          ctrl.userLastPage,
          enabled && page < pag.nbPages,
          ctrl,
        ),
      ])
    : [];
}

export function players(ctrl: TournamentController): PageData {
  const page = ctrl.page;
  const nbResults = ctrl.data.nbPlayers;
  const from = (page - 1) * maxPerPage;
  const to = Math.min(nbResults, page * maxPerPage);
  return {
    currentPage: page,
    maxPerPage,
    from,
    to,
    currentPageResults: ctrl.pages[page],
    nbResults,
    nbPages: Math.ceil(nbResults / maxPerPage),
  };
}

export function myPage(ctrl: TournamentController): number | undefined {
  if (ctrl.data.me) return Math.floor((ctrl.data.me.rank - 1) / maxPerPage) + 1;
  else return;
}
