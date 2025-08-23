import { assetUrl } from 'common/assets';
import { icons } from 'common/icons';
import { dataIcon, type MaybeVNode } from 'common/snabbdom';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../ctrl';
import type { TournamentDataFull } from '../interfaces';

function startClock(time: number) {
  return {
    insert: (vnode: VNode) => $(vnode.elm as HTMLElement).clock({ time: time }),
  };
}

const oneDayInSeconds = 60 * 60 * 24;

function hasFreq(freq: string, d: TournamentDataFull) {
  return d.schedule && d.schedule.freq === freq;
}

function clock(ctrl: TournamentController): MaybeVNode {
  const d = ctrl.data;
  if (d.isFinished) return;
  if (d.secondsToFinish && !d.secondsToStart) {
    if (d.secondsToFinish > oneDayInSeconds && ctrl.dateToFinish)
      return h('div.clock.clock-title', [
        h('span.shy', `${i18n('ending')} `),
        h('span', ctrl.dateToFinish.toLocaleString()),
      ]);
    else
      return h(
        'div.clock.clock-title',
        {
          hook: startClock(d.secondsToFinish),
        },
        [h('span.shy', i18n('ending')), h('div.time')],
      );
  }
  if (d.secondsToStart) {
    if (d.secondsToStart > oneDayInSeconds)
      return h('div.clock.clock-title', [
        h('span.shy', `${i18n('starting')} `),
        h('time.timeago', {
          attrs: {
            title: new Date(d.startsAt).toLocaleString(),
            datetime: Date.now() + d.secondsToStart * 1000,
          },
          hook: {
            insert(vnode) {
              (vnode.elm as HTMLElement).setAttribute(
                'datetime',
                `${Date.now() + d.secondsToStart! * 1000}`,
              );
            },
          },
        }),
      ]);
    else
      return h(
        'div.clock.clock-title',
        {
          hook: startClock(d.secondsToStart),
        },
        [h('span.shy', i18n('starting')), h('span.time.text')],
      );
  } else return;
}

function image(d: TournamentDataFull): VNode | undefined {
  if (d.isFinished) return;
  if (hasFreq('shield', d) || hasFreq('marathon', d)) return;
  const s = d.spotlight;
  if (s?.iconImg)
    return h('img.img', {
      attrs: { src: assetUrl(`images/${s.iconImg}`) },
    });
  return h('i.img', {
    attrs: dataIcon(s?.iconFont || icons.trophy),
  });
}

function title(ctrl: TournamentController) {
  const d = ctrl.data;
  if (hasFreq('marathon', d))
    return h('h1', { attrs: { title: d.fullName } }, [h('i.fire-trophy', '\\'), d.fullName]);
  if (hasFreq('shield', d))
    return h('h1', [
      h(
        'a.shield-trophy',
        {
          attrs: { href: '/tournament/shields', title: d.fullName },
        },
        d.perf.icon,
      ),
      d.fullName,
    ]);
  return h(
    'h1',
    { attrs: { title: d.fullName } },
    (d.animal
      ? [
          h(
            'a',
            {
              attrs: {
                href: d.animal.url,
                target: '_blank',
              },
            },
            d.animal.name,
          ),
        ]
      : [d.fullName]
    ).concat(
      d.private
        ? [' ', h('span', { attrs: { 'data-icon': icons.lock, title: i18n('isPrivate') } })]
        : [],
    ),
  );
}

export default function (ctrl: TournamentController): VNode {
  return h('div.tour__main__header', [image(ctrl.data), title(ctrl), clock(ctrl)]);
}
