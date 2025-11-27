import { defined } from 'common/common';
import * as game from 'game';
import { colorName } from 'shogi/color-name';
import { engineFromName, engineNameFromCode } from 'shogi/engine-name';
import { extractRank, type Rank, rankFromRating } from 'shogi/rank';
import { usernameVNodes } from 'shogi/username';
import { COLORS } from 'shogiops/constants';
import { h, type VNode } from 'snabbdom';
import { ops as treeOps } from 'tree';
import { renderClockOf } from './clocks';
import type AnalyseCtrl from './ctrl';
import { findTag } from './study/study-chapters';

interface PlayerBarConfig {
  color: Color;
  name: string;
  rank?: Rank;
  engineLvl?: number;
  bot?: boolean;
}

export function renderPlayerBars(ctrl: AnalyseCtrl): VNode[] | undefined {
  if (ctrl.embed || ctrl.forecast) return;

  const sente = findPlayer(ctrl, 'sente');
  const gote = findPlayer(ctrl, 'gote');

  const noNames = ['', '?'];
  if (
    noNames.includes(sente.name) &&
    noNames.includes(gote.name) &&
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
        usernameVNodes({
          username: player.name,
          bot: player.bot,
          rank: player.rank,
          engineLvl: player.engineLvl,
        }),
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
    const engine = name ? engineFromName(name) : undefined;

    if (engine) {
      return {
        color,
        name: engineNameFromCode(engine.code),
        engineLvl: engine.level,
      };
    } else {
      const isBot = name?.toLowerCase().startsWith('bot ');
      const rank = !isBot ? extractRank(name) : undefined;
      const nameWithoutPrefix =
        (rank || isBot) && name ? name.slice(name.indexOf(' ') + 1 || 0) : name;
      if (nameWithoutPrefix)
        return {
          color,
          name: nameWithoutPrefix,
          rank: rank,
          bot: isBot,
        };
      else
        return {
          color,
          name: '?',
        };
    }
  } else {
    const player = game.getPlayer(ctrl.data, color);
    const rank = !player.provisional && player.rating ? rankFromRating(player.rating) : undefined;
    if (player.user)
      return {
        color,
        name: player.user.username,
        rank: rank,
        bot: player.user.title === 'BOT',
      };
    else if (player.ai)
      return {
        color,
        name: engineNameFromCode(player.aiCode),
        engineLvl: player.ai,
      };
    else if (player.name || !ctrl.synthetic)
      return {
        color,
        name: player.name,
      };
    else
      return {
        color,
        name: '?',
      };
  }
}
