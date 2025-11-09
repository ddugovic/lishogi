import { icons } from 'common/icons';
import { getPerfIcon } from 'common/perf-icons';
import { bind } from 'common/snabbdom';
import { i18n, i18nPluralSame } from 'i18n';
import { i18nPerf } from 'i18n/perf';
import { rankFromRating, rankTag } from 'shogi/rank';
import { h, type VNode } from 'snabbdom';
import type LobbyController from '../../ctrl';
import * as hookRepo from '../../hook-repo';
import type { Hook, Seek } from '../../interfaces';
import * as seekRepo from '../../seek-repo';
import { isHook } from '../../util';
import { tds } from '../util';

function renderHookOrSeek(hs: Hook | Seek, isAnon: boolean) {
  const disabled = isHook(hs) && !!hs.disabled;
  const username = isHook(hs) ? hs.u : hs.username;
  const isRated = isHook(hs) ? hs.ra : hs.mode === 1;
  const provisionalRating = isHook(hs) ? hs.prov : hs.provisional;
  const rank = hs.rating && !provisionalRating ? rankFromRating(hs.rating) : undefined;
  const title = disabled
    ? ''
    : hs.action === 'join'
      ? `${i18n('joinTheGame')} | ${i18nPerf(hs.perf)}`
      : hs.action === 'unjoinable'
        ? isAnon
          ? i18n('registeredJoinTheGame')
          : i18n('outsideYourRating')
        : i18n('cancel');
  return h(
    `tr.hook.${hs.action}`,
    {
      key: hs.id,
      class: { disabled },
      attrs: {
        title,
        'data-id': hs.id,
      },
    },
    tds([
      h(`span.is.is2.color-icon.${(isHook(hs) ? hs.c : hs.color) || 'random'}`),
      hs.rating && username
        ? h(
            'span.ulink.ulpt',
            {
              attrs: { 'data-href': `/@/${username}` },
              class: {
                long: username.length > 15,
                veryLong: username.length > 18,
              },
            },
            [rank ? rankTag(rank) : undefined, username],
          )
        : h('span.anon', i18n('anonymousUser')),
      (hs.rating ? hs.rating : '-') + (provisionalRating ? '?' : ''),
      isHook(hs) ? hs.clock : hs.days ? i18nPluralSame('nbDays', hs.days) : '∞',
      h(
        'span',
        {
          attrs: { 'data-icon': getPerfIcon(hs.perf) },
        },
        isRated ? i18n('rated') : i18n('casual'),
      ),
    ]),
  );
}

function isStandard(value: boolean) {
  return (hs: Hook | Seek) => (hs.variant === 'standard') === value;
}

function isMine(hs: Hook | Seek) {
  return hs.action === 'cancel';
}

function isJoinable(hs: Hook | Seek) {
  return hs.action === 'join';
}

function isNotJoinable(hs: Hook | Seek) {
  return !isJoinable(hs);
}

function isNotMine(hs: Hook | Seek) {
  return !isMine(hs);
}

export function toggle(ctrl: LobbyController): VNode {
  return h('i.toggle', {
    key: 'set-mode-chart',
    attrs: { title: i18n('graph'), 'data-icon': icons.chartLine },
    hook: bind('mousedown', _ => ctrl.setMode('chart'), ctrl.redraw),
  });
}

export function render(
  tab: 'seeks' | 'real_time',
  ctrl: LobbyController,
  allHS: Seek[] | Hook[],
): VNode {
  const sort = (hss: Seek[] | Hook[]) => {
    if (tab === 'seeks') seekRepo.sort(ctrl, hss as Seek[]);
    else hookRepo.sort(ctrl, hss as Hook[]);
  };

  const mine = allHS.filter(isMine);
  const notMine = allHS.filter(isNotMine);

  const standards = notMine.filter(isStandard(true));
  const standardsJoinable = standards.filter(isJoinable);
  const standardsNotJoinable = standards.filter(isNotJoinable);

  const variants = notMine.filter(isStandard(false));
  const variantsJoinable = variants.filter(isJoinable);
  const variantsNotJoinable = variants.filter(isNotJoinable);

  sort(mine as Seek[]);
  sort(standardsJoinable as Seek[]);
  sort(standardsNotJoinable as Seek[]);
  sort(variantsJoinable as Seek[]);
  sort(variantsNotJoinable as Seek[]);

  const render = (hs: Hook | Seek) => renderHookOrSeek(hs, ctrl.isAnon);

  const renderedHss = [
    ...standardsJoinable.map(render),
    ...standardsNotJoinable.map(render),
    variants.length
      ? h(
          'tr.variants',
          {
            key: 'variants',
          },
          [
            h(
              'td',
              {
                attrs: { colspan: 5 },
              },
              `— ${i18n('variant')} —`,
            ),
          ],
        )
      : null,
    ...variantsJoinable.map(render),
    ...variantsNotJoinable.map(render),
  ];
  if (mine) renderedHss.unshift(...mine.map(render));
  return h('table.hooks__list', [
    h(
      'thead',
      h('tr', [
        h('th'), // color icon
        h('th'), // player name
        h(
          'th',
          {
            class: {
              sortable: true,
              sort: ctrl.sort.startsWith('rating'),
              reverse: ctrl.sort === 'rating-reverse',
            },
            hook: bind('click', _ => ctrl.setSort('rating'), ctrl.redraw),
          },
          [h('i.is'), i18n('rating')],
        ),
        h(
          'th',
          {
            class: {
              sortable: true,
              sort: ctrl.sort.startsWith('time'),
              reverse: ctrl.sort === 'time-reverse',
            },
            hook: bind('click', _ => ctrl.setSort('time'), ctrl.redraw),
          },
          [h('i.is'), i18n('time')],
        ),
        h('th', i18n('mode')),
      ]),
    ),
    h(
      'tbody',
      {
        class: { stepping: ctrl.tab === 'real_time' && ctrl.stepping },
        hook: bind(
          'click',
          e => {
            let el = e.target as HTMLElement;
            do {
              el = el.parentNode as HTMLElement;
              if (el.nodeName === 'TR') {
                const elId = el.getAttribute('data-id')!;
                if (ctrl.tab === 'seeks') return ctrl.clickSeek(elId);
                return ctrl.clickHook(elId);
              }
            } while (el.nodeName !== 'TABLE');
          },
          ctrl.redraw,
        ),
      },
      renderedHss,
    ),
  ]);
}
