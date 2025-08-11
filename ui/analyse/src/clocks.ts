import { defined } from 'common/common';
import type { MaybeVNode } from 'common/snabbdom';
import { h, type VNode } from 'snabbdom';
import type AnalyseCtrl from './ctrl';

export function renderClockOf(ctrl: AnalyseCtrl, color: Color): MaybeVNode {
  if (ctrl.imported) return;

  const isActive = ctrl.turnColor() === color;
  const centis = !isActive ? ctrl.node.clock : ctrl.tree.getParentClock(ctrl.node, ctrl.path);
  const centisNormalized =
    ctrl.data.clock?.initial === 0 && defined(centis)
      ? Math.max(centis, ctrl.data.clock.byoyomi * 100)
      : centis;

  return renderClock(centisNormalized, isActive);
}

function renderClock(centis: number | undefined, active: boolean): MaybeVNode {
  if (!defined(centis)) return;
  else
    return h(
      'div.analyse__clock',
      {
        class: { active },
      },
      h('div.time', clockContent(centis)),
    );
}

function clockContent(centis: number): Array<string | VNode> {
  const date = new Date(centis * 10);
  const millis = date.getUTCMilliseconds();
  const sep = ':';
  const baseStr = pad2(date.getUTCMinutes()) + sep + pad2(date.getUTCSeconds());
  if (centis >= 360000) return [Math.floor(centis / 360000) + sep + baseStr];
  return centis >= 3000
    ? [baseStr]
    : [baseStr, h('tenths', `.${Math.floor(millis / 100).toString()}`)];
}

export function renderTime(centis: number, forceHours: boolean): string {
  const hrs = Math.floor(centis / 360_000);
  const mins = Math.floor(centis / 6000) % 60;
  const secs = Math.floor(centis / 100) % 60;
  const sep = ':';
  return (hrs > 0 || forceHours ? pad2(hrs) + sep : '') + pad2(mins) + sep + pad2(secs);
}

function pad2(num: number): string {
  return (num < 10 ? '0' : '') + num;
}
