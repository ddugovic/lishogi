import type { MaybeVNodes } from 'common/snabbdom';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../ctrl';
import { isIn } from '../../tournament';
import { joinWithdraw } from '../button';
import { arrangements } from './arrangements';
import { challenges } from './challenges';
import { players } from './players';

const allTabs = ['games', 'players', 'challenges'] as const;
export type Tab = (typeof allTabs)[number];

function tab(
  ctrl: TournamentController,
  tab: Tab,
  content: MaybeVNodes,
  kls: Record<string, boolean> = {},
): VNode {
  return h(
    'span',
    {
      class: {
        active: tab === ctrl.activeTab?.(),
        ...kls,
      },
      on: {
        mousedown: () => {
          ctrl.activeTab?.(tab);
          ctrl.redraw();
        },
      },
    },
    content,
  );
}

function tabs(ctrl: TournamentController, usedTabs: Tab[], asControls = false): VNode {
  const challengesLength = ctrl.challengeData.in.length + ctrl.challengeData.out.length;
  return h(
    'div.tabs-horiz',
    {
      class: {
        tour__controls: asControls,
      },
    },
    [
      ...usedTabs.map(t => {
        switch (t) {
          case 'players':
            return tab(ctrl, 'players', [i18n('players')]);
          case 'games':
            return tab(ctrl, 'games', [i18n('games')]);
          case 'challenges':
            return tab(
              ctrl,
              'challenges',
              [i18n('challenges'), challengesLength > 0 ? ` (${challengesLength})` : undefined],
              {
                hidden: !isIn(ctrl) && !ctrl.data.isFinished && asControls,
                disabled: !isIn(ctrl) || !!ctrl.data.isFinished,
              },
            );
        }
      }),
      !isIn(ctrl) && asControls ? h('div.right', joinWithdraw(ctrl)) : undefined,
    ],
  );
}

export function tabulatedView(
  ctrl: TournamentController,
  usedTabs: Tab[],
  asControls = false,
): VNode {
  return h('div.tabs-wrap', [
    tabs(ctrl, usedTabs, asControls),
    ctrl.activeTab?.() === 'players'
      ? players(ctrl)
      : ctrl.activeTab?.() === 'challenges'
        ? challenges(ctrl)
        : arrangements(ctrl),
  ]);
}
