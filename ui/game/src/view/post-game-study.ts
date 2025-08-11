import { modal } from 'common/modal';
import { onInsert } from 'common/snabbdom';
import { debounce } from 'common/timings';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';

export function studyModal(gameId: string, orientation: Color, onClose: () => void): VNode {
  return modal({
    class: 'study__invite',
    onClose() {
      onClose();
    },
    content: [
      h('div', [
        h('div.study-option', [
          h('div.study-title', i18n('postGameStudy')),
          h('div.desc', i18n('postGameStudyExplanation')),
          postGameStudyForm(gameId, orientation),
          h(
            'a.text',
            { attrs: { 'data-icon': '', href: `/study/post-game-study/${gameId}/hot` } },
            i18n('postGameStudiesOfGame'),
          ),
        ]),
        h('div.study-option', [
          h('div.study-title', i18n('standardStudy')),
          standardStudyForm(gameId, orientation),
        ]),
      ]),
    ],
  });
}

function standardStudyForm(gameId: string, orientation: Color): VNode {
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
        attrs: { type: 'hidden', name: 'gameId', value: gameId },
      }),
      h('input', {
        attrs: { type: 'hidden', name: 'orientation', value: orientation },
      }),
      h(
        'button.button',
        {
          attrs: {
            type: 'submit',
          },
        },
        i18n('study:createStudy'),
      ),
    ],
  );
}

function postGameStudyForm(gameId: string, orientation: Color): VNode {
  return h(
    'form',
    {
      attrs: { method: 'post', action: '/study/post-game-study' },
      hook: onInsert((el: HTMLFormElement) => {
        el.addEventListener('submit', (e: any) => {
          e.preventDefault();
          debounce(
            () => {
              window.lishogi.xhr
                .formToXhr(el)
                .then(res => res.json())
                .then(res => {
                  if (res.redirect) {
                    window.lishogi.properReload = true;
                    window.location.href = res.redirect;
                  }
                })
                .catch(error => {
                  try {
                    const res = error as Response;
                    alert(`${res.statusText} - ${res.status}`);
                  } catch {
                    console.error(error);
                  }
                });
            },
            1000,
            true,
          )();
        });
      }),
    },
    [
      h('input', {
        attrs: { type: 'hidden', name: 'gameId', value: gameId },
      }),
      h('div', [
        h('label', i18n('studyWith')),
        h('input.user-invite', {
          hook: onInsert<HTMLInputElement>(el => {
            window.lishogi.userAutocomplete($(el), {
              tag: 'span',
              focus: true,
            });
          }),
          attrs: {
            name: 'invited',
            placeholder: `${i18n('study:searchByUsername')} (${i18n('optional').toLowerCase()})`,
          },
        }),
      ]),
      h('input', {
        attrs: { type: 'hidden', name: 'orientation', value: orientation },
      }),
      h(
        'button.button',
        {
          attrs: {
            type: 'submit',
          },
        },
        i18n('study:createStudy'),
      ),
    ],
  );
}
