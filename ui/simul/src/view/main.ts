import { chatMembers, makeChat } from 'chat';
import { initAll } from 'common/mini-board';
import { richHTML } from 'common/rich-text';
import { onInsert } from 'common/snabbdom';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type SimulCtrl from '../ctrl';
import created from './created';
import pairings from './pairings';
import results from './results';
import * as util from './util';

export default function (ctrl: SimulCtrl): VNode {
  const handler = ctrl.data.isRunning ? started : ctrl.data.isFinished ? finished : created;

  return h('main.simul', [
    h('aside.simul__side', {
      hook: onInsert(el => {
        $(el).replaceWith(ctrl.opts.$side);
        if (ctrl.opts.chat) {
          ctrl.opts.chat.data.hostId = ctrl.data.host.id;
          makeChat(ctrl.opts.chat);
        }
      }),
    }),
    h(
      'div.simul__main.box',
      {
        hook: {
          postpatch() {
            initAll();
          },
        },
      },
      [...handler(ctrl), showText(ctrl)],
    ),
    chatMembers(),
  ]);
}

const showText = (ctrl: SimulCtrl) =>
  ctrl.data.text.length > 0
    ? h('div.simul-desc', [
        h('h2', i18n('description')),
        h('p', {
          hook: richHTML(ctrl.data.text),
        }),
      ])
    : undefined;

const started = (ctrl: SimulCtrl) => [
  h('div.box__top', [
    util.title(ctrl),
    h('div.box__top__actions', h('div.finished', i18n('eventInProgress'))),
  ]),
  results(ctrl),
  pairings(ctrl),
];

const finished = (ctrl: SimulCtrl) => [
  h('div.box__top', [
    util.title(ctrl),
    h('div.box__top__actions', h('div.finished', i18n('finished'))),
  ]),
  results(ctrl),
  pairings(ctrl),
];
