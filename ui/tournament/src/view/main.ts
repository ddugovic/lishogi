import { makeChat } from 'chat';
import { type MaybeVNodes, onInsert } from 'common/snabbdom';
import { i18n } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../ctrl';
import { arrangementModal } from './arrangement-modal';
import { joinWithTeamSelector } from './battle';
import { created } from './created';
import { finished } from './finished';
import { organizedArrangementView } from './organized-arrangement';
import { playerManagementView } from './player-manage';
import { started } from './started';

export interface ViewHandler {
  name: string;
  main(ctrl: TournamentController): MaybeVNodes;
  table(ctrl: TournamentController): VNode | undefined;
}

export default function (ctrl: TournamentController): VNode {
  let handler: ViewHandler;
  if (ctrl.data.isFinished) handler = finished;
  else if (ctrl.data.isStarted) handler = started;
  else handler = created;

  const desc = ctrl.opts.$desc
    ? h('div', {
        hook: onInsert(el => $(el).replaceWith(ctrl.opts.$desc)),
      })
    : null;

  const faq = ctrl.opts.$faq
    ? h('div', {
        hook: onInsert(el => $(el).replaceWith(ctrl.opts.$faq)),
      })
    : null;

  return h(`main.${ctrl.data.system}${!ctrl.isArena() ? '.arr-table' : ''}.${ctrl.opts.classes}`, [
    h('aside.tour__side', {
      hook: onInsert(el => {
        $(el).replaceWith(ctrl.opts.$side);
        ctrl.opts.chat && makeChat(ctrl.opts.chat);
      }),
    }),
    h('div.tour__underchat', {
      hook: onInsert(el => {
        $(el).replaceWith($('.tour__underchat.none').removeClass('none'));
      }),
    }),
    handler.table(ctrl),
    h('div.tour__main', [
      ctrl.arrangement ? arrangementModal(ctrl, ctrl.arrangement) : null,
      h(
        `div.box.${handler.name}`,
        {
          class: { 'tour__main-finished': !!ctrl.data.isFinished },
        },
        ctrl.playerManagement
          ? playerManagementView(ctrl)
          : ctrl.newArrangement
            ? organizedArrangementView(ctrl)
            : [...handler.main(ctrl), h('div.tour__bottom', [desc, faq])],
      ),
    ]),
    ctrl.opts.chat
      ? h('div.chat__members.none', [
          h('span.number', '\xa0'),
          ' ',
          i18n('spectators'),
          ' ',
          h('span.list'),
        ])
      : null,
    ctrl.joinWithTeamSelector ? joinWithTeamSelector(ctrl) : null,
  ]);
}
