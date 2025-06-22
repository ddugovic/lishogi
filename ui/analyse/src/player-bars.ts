import { defined } from 'common/common';
import * as game from 'game';
import { i18n, i18nFormat } from 'i18n';
import { colorName } from 'shogi/color-name';
import { engineNameFromCode } from 'shogi/engine-name';
import { COLORS } from 'shogiops/constants';
import { type VNode, h } from 'snabbdom';
import { ops as treeOps } from 'tree';
import { renderClockOf } from './clocks';
import type AnalyseCtrl from './ctrl';
import { findTag } from './study/study-chapters';

interface PlayerBarConfig {
  color: Color;
  name: string;
  title?: string;
  anon?: boolean;
}

export function renderPlayerBars(ctrl: AnalyseCtrl): VNode[] | undefined {
  if (ctrl.embed) return;

  const sente = findPlayer(ctrl, 'sente');
  const gote = findPlayer(ctrl, 'gote');

  if (
    ((sente.name === '?' && gote.name === '?') || (sente.anon && gote.anon)) &&
    !treeOps.findInMainline(ctrl.tree.root, n => {
      return defined(n.clock) && !!n.id;
    })
  )
    return;

  return COLORS.map(color =>
    renderPlayer(ctrl, color === 'sente' ? sente : gote, ctrl.bottomColor() !== color),
  );
}

function renderPlayer(ctrl: AnalyseCtrl, player: PlayerBarConfig, top: boolean): VNode {
  return h(`div.player-bar.player-bar-${top ? 'top' : 'bot'}`, [
    h(
      'div.name-wrap',
      h(
        `span.name.color-icon.${player.color}.is.text.user-link`,
        {
          attrs: {
            title: colorName(player.color, ctrl.isHandicap()),
          },
        },
        [
          player.title ? h('span.title', `${player.title} `) : undefined,
          h(`span${player.anon ? '.anon' : ''}`, player.name),
        ],
      ),
    ),
    h(
      'div.clock-wrap',
      ctrl.onMainline || ctrl.node.clock ? renderClockOf(ctrl, player.color) : undefined,
    ),
  ]);
}

function findPlayer(ctrl: AnalyseCtrl, color: Color): PlayerBarConfig {
  const study = ctrl.study;
  if (study) {
    const tags = study.data.chapter.tags;

    const name = findTag(tags, color);
    if (name)
      return {
        color,
        name,
        title: findTag(tags, `${color}title`),
      };
    else
      return {
        color,
        name: '?',
      };
  } else {
    const player = game.getPlayer(ctrl.data, color);
    if (player.user)
      return {
        color,
        name: player.user.username,
        title: player.user.title,
      };
    else if (player.ai)
      return {
        color,
        name: engineNameFromCode(player.aiCode),
        title: i18nFormat('levelX', player.ai),
      };
    else if (player.name || !ctrl.synthetic)
      return {
        color,
        name: player.name || i18n('anonymousUser'),
        anon: !player.name,
      };
    else
      return {
        color,
        name: '?',
      };
  }
}
