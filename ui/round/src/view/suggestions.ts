import type { MaybeVNode } from 'common/snabbdom';
import { isPlayerTurn } from 'game';
import { prepaused } from 'game/status';
import { i18n } from 'i18n';
import { impasseInfo } from 'shogi/impasse';
import { h } from 'snabbdom';
import type RoundController from '../ctrl';

export function impasse(ctrl: RoundController): MaybeVNode {
  if (!ctrl.impasseHelp) return null;

  const lastStep = ctrl.data.steps[ctrl.data.steps.length - 1];
  const rules = ctrl.data.game.variant.key;
  const initialSfen = ctrl.data.game.initialSfen;
  const i = impasseInfo(rules, lastStep.sfen, initialSfen);

  if (!i) return null;

  return h('div.suggestion', [
    h('h5', [
      i18n('impasse'),
      h('a.q-explanation', { attrs: { href: '/page/impasse', target: '_blank' } }, '?'),
    ]),
    h('div.impasse', [
      h(
        'div.color-icon.sente',
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
      ),
      h(
        'div.color-icon.gote',
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
      ),
    ]),
  ]);
}

export function sealedUsi(ctrl: RoundController): MaybeVNode {
  if (!prepaused(ctrl.data)) return null;

  const myTurn = isPlayerTurn(ctrl.data);
  return h(
    'div.suggestion',
    {
      class: {
        glowing: myTurn,
      },
    },
    h('strong.sealed-move', myTurn ? i18n('makeASealedMove') : i18n('waitingForASealedMove')),
  );
}
