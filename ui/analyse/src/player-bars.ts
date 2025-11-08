import { defined } from 'common/common';
import * as game from 'game';
import { i18n, i18nFormat } from 'i18n';
import { colorName } from 'shogi/color-name';
import { engineFromName, engineNameFromCode } from 'shogi/engine-name';
import { extractRank, type Rank, rankFromRating, rankTag } from 'shogi/rank';
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
  engine?: string;
  bot?: boolean;
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
          player.rank ? rankTag(player.rank) : undefined,
          player.engine ? h('span.engine-lvl', `${player.engine} `) : undefined,
          player.bot ? h('span.bot-tag', 'BOT ') : undefined,
          h(`span.name${player.anon ? '.anon' : ''}`, player.name),
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
    const engine = name ? engineFromName(name) : undefined;

    if (engine) {
      return {
        color,
        name: engineNameFromCode(engine.code),
        engine: engine.level ? i18nFormat('levelX', engine.level) : undefined,
      };
    } else {
      const rank = extractRank(name);
      const isBot = name?.toLowerCase().startsWith('bot ');
      const nameWithoutRank =
        (rank || isBot) && name ? name.slice(name.indexOf(' ') + 1 || 0) : name;
      if (nameWithoutRank)
        return {
          color,
          name: nameWithoutRank,
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
    console.log('findPlayer', player);
    const perf = ctrl.data.game.perf;
    const rating = !player.user?.perfs[perf].prov ? player.rating : undefined;
    if (player.user)
      return {
        color,
        name: player.user.username,
        rank: rating ? rankFromRating(rating) : undefined,
        bot: player.user.title === 'BOT',
      };
    else if (player.ai)
      return {
        color,
        name: engineNameFromCode(player.aiCode),
        engine: i18nFormat('levelX', player.ai),
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
