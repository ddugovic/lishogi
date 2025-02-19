import { defined } from 'common/common';
import { type VNode, h } from 'snabbdom';
import { ops as treeOps } from 'tree';
import renderClocks from '../clocks';
import type AnalyseCtrl from '../ctrl';
import type { TagArray } from './interfaces';
import { findTag, isFinished } from './study-chapters';

interface PlayerNames {
  sente: string;
  gote: string;
}

export default function (ctrl: AnalyseCtrl): VNode[] | undefined {
  const study = ctrl.study;
  if (!study || ctrl.embed) return;
  const tags = study.data.chapter.tags;
  const playerNames = {
    sente: findTag(tags, 'sente')!,
    gote: findTag(tags, 'gote')!,
  };
  if (
    !playerNames.sente &&
    !playerNames.gote &&
    !treeOps.findInMainline(ctrl.tree.root, n => defined(n.clock))
  )
    return;
  const clocks = renderClocks(ctrl, false);
  const ticking = !isFinished(study.data.chapter) && ctrl.turnColor();
  return (['sente', 'gote'] as Color[]).map(color =>
    renderPlayer(tags, clocks, playerNames, color, ticking === color, ctrl.bottomColor() !== color),
  );
}

function renderPlayer(
  tags: TagArray[],
  clocks: [VNode, VNode] | undefined,
  playerNames: PlayerNames,
  color: Color,
  ticking: boolean,
  top: boolean,
): VNode {
  const title = findTag(tags, `${color}title`);
  const elo = findTag(tags, `${color}elo`);
  return h(
    `div.study__player.study__player-${top ? 'top' : 'bot'}`,
    {
      class: { ticking },
    },
    [
      h('div.left', [
        h('span.info', [
          h(`i.color-icon.${color}`),
          title && h('span.title', `${title} `),
          h('span.name', playerNames[color]),
          elo && h('span.elo', elo),
        ]),
      ]),
      clocks?.[color === 'sente' ? 0 : 1],
    ],
  );
}
