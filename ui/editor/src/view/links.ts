import { setup } from 'common/links';
import { modal } from 'common/modal';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import type EditorCtrl from '../ctrl';
import type { EditorState } from '../interfaces';

export function links(ctrl: EditorCtrl, state: EditorState): VNode {
  return h('div.links', [analysis(ctrl, state), continueWith(ctrl, state), study(ctrl, state)]);
}

function analysis(ctrl: EditorCtrl, state: EditorState): VNode {
  return h(
    'a.button.text',
    {
      attrs: {
        'data-icon': 'A',
        rel: 'nofollow',
        href: ctrl.makeAnalysisUrl(state.sfen, ctrl.bottomColor()),
      },
    },
    i18n('analysis'),
  );
}

let openModal = false;
function continueWith(ctrl: EditorCtrl, state: EditorState): VNode {
  return h(
    'span.button.text',
    {
      attrs: { 'data-icon': 'U' },
      class: {
        disabled: !state.playableSfen,
      },
      on: {
        click: () => {
          if (state.playableSfen) {
            openModal = true;
            ctrl.redraw();
          }
        },
      },
    },
    [
      i18n('continueFromHere'),
      openModal
        ? modal({
            class: 'continue-with',
            onClose() {
              openModal = false;
              ctrl.redraw();
            },
            content: [
              h(
                'a.button.text',
                {
                  class: {
                    disabled: ['chushogi', 'annanshogi'].includes(ctrl.rules),
                  },
                  attrs: {
                    href: setup('/', ctrl.rules, state.playableSfen || '', 'ai'),
                    rel: 'nofollow',
                  },
                },
                i18n('playWithTheMachine'),
              ),
              h(
                'a.button.text',
                {
                  attrs: {
                    href: setup('/', ctrl.rules, state.playableSfen || '', 'friend'),
                    rel: 'nofollow',
                  },
                },
                i18n('playWithAFriend'),
              ),
            ],
          })
        : undefined,
    ],
  );
}

function study(ctrl: EditorCtrl, state: EditorState): VNode {
  return h(
    'form',
    {
      attrs: {
        method: 'post',
        action: '/study/as',
      },
    },
    [
      h('input', {
        attrs: {
          type: 'hidden',
          name: 'orientation',
          value: ctrl.bottomColor(),
        },
      }),
      h('input', {
        attrs: { type: 'hidden', name: 'variant', value: ctrl.rules },
      }),
      h('input', {
        attrs: { type: 'hidden', name: 'sfen', value: state.sfen || '' },
      }),
      h(
        'button.button.text',
        {
          attrs: {
            type: 'submit',
            'data-icon': '4',
          },
        },
        i18n('toStudy'),
      ),
    ],
  );
}
