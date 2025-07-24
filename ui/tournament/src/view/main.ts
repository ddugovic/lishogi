import { makeChat } from 'chat';
import { type MaybeVNodes, onInsert } from 'common/snabbdom';
import { i18n } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../ctrl';
import { joinWithTeamSelector } from './arena/battle';
import { teamInfoModal } from './arena/team-info';
import { arrangementModal } from './arrangement/arrangement-modal';
import { arrangementFormView } from './arrangement/organized/arrangement-form';
import { created } from './main/created';
import { finished } from './main/finished';
import { started } from './main/started';
import { playerInfoModal } from './player-info';
import { playerManagementView } from './player-manage';

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

  return h(`main.${ctrl.opts.classes}`, [
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
      arrangementModal(ctrl),
      playerInfoModal(ctrl),
      teamInfoModal(ctrl),
      h(
        `div.box.${handler.name}`,
        {
          class: { 'tour__main-finished': !!ctrl.data.isFinished },
        },
        ctrl.playerManagement
          ? playerManagementView(ctrl)
          : ctrl.newArrangement
            ? arrangementFormView(ctrl)
            : [...handler.main(ctrl), h('div.tour__bottom', [desc, faq])],
      ),
    ]),
    ctrl.opts.chat
      ? h('div.chat__members', [
          h('span.number', '0'),
          ' ',
          i18n('spectators'),
          ' ',
          h('span.list'),
        ])
      : null,
    ctrl.joinWithTeamSelector ? joinWithTeamSelector(ctrl) : null,
  ]);
}
