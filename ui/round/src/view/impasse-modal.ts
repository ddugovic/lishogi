import { modal } from 'common/modal';
import type { MaybeVNode } from 'common/snabbdom';
import type { Player } from 'game';
import { i18n } from 'i18n';
import { engineNameFromCode } from 'shogi/engine-name';
import { impasseInfo } from 'shogi/impasse';
import { h } from 'snabbdom';
import type RoundController from '../ctrl';

export function impasseModal(ctrl: RoundController): MaybeVNode {
  const lastStep = ctrl.data.steps[ctrl.data.steps.length - 1];
  const rules = ctrl.data.game.variant.key;
  const initialSfen = ctrl.data.game.initialSfen;
  const i = impasseInfo(rules, lastStep.sfen, initialSfen);

  const sentePlayer = ctrl.data.player.color === 'sente' ? ctrl.data.player : ctrl.data.opponent;
  const gotePlayer = ctrl.data.player.color === 'gote' ? ctrl.data.player : ctrl.data.opponent;

  if (!i) return null;

  return modal({
    class: 'round__modal.impasse-help',
    onClose() {
      ctrl.impasseHelp = false;
      ctrl.redraw();
    },
    content: [
      h('div.impasse-wrap', [
        h(
          'h4',
          h(
            'a.text',
            { attrs: { 'data-icon': '', href: '/page/impasse', target: '_blank' } },
            i18n('impasse'),
          ),
        ),
        h('div.impasse', [
          h('div.color-icon.sente', [
            h('span', username(sentePlayer)),
            h('ul.impasse-list', [
              h('li', [
                `${i18n('enteringKing')}: `,
                h(`span${i.sente.king ? '.good' : ''}`, {
                  attrs: { 'data-icon': i.sente.king ? 'K' : 'L' },
                }),
              ]),
              h('li', [
                `${i18n('invadingPieces')}: `,
                h(`span${i.sente.nbOfPieces >= 10 ? '.good' : ''}`, `${i.sente.nbOfPieces}/10`),
              ]),
              h('li', [
                `${i18n('totalImpasseValue')}: `,
                h(`span${i.sente.pieceValue >= 28 ? '.good' : ''}`, `${i.sente.pieceValue}/28`),
              ]),
            ]),
          ]),
          h('div.color-icon.gote', [
            h('span', username(gotePlayer)),
            h('ul.impasse-list', [
              h('li', [
                `${i18n('enteringKing')}: `,
                h(`span${i.gote.king ? '.good' : ''}`, {
                  attrs: { 'data-icon': i.gote.king ? 'K' : 'L' },
                }),
              ]),
              h('li', [
                `${i18n('invadingPieces')}: `,
                h(`span${i.gote.nbOfPieces >= 10 ? '.good' : ''}`, `${i.gote.nbOfPieces}/10`),
              ]),
              h('li', [
                `${i18n('totalImpasseValue')}: `,
                h(`span${i.gote.pieceValue >= 27 ? '.good' : ''}`, `${i.gote.pieceValue}/27`),
              ]),
            ]),
          ]),
        ]),
      ]),
    ],
  });
}

function username(player: Player): string {
  return player.user
    ? player.user.username
    : player.name || (player.ai ? engineNameFromCode(player.aiCode) : i18n('anonymous'));
}
