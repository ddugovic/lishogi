import { type PrefTypes, prefs } from 'common/prefs';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import { bind, type Close, header } from './util';

type Notation = PrefTypes['notation'];

export interface NotationData {
  current: Notation;
  list: Notation[];
}

export interface NotationCtrl {
  set(n: Notation): void;
  data: NotationData;
  redraw: Redraw;
  close: Close;
}

export function ctrl(data: NotationData, redraw: Redraw, close: Close): NotationCtrl {
  return {
    set(n: Notation) {
      data.current = n;
      window.lishogi.xhr.text('POST', '/pref/notation', { formData: { notation: n } }).then(
        () => {
          if (confirm(i18n('pageReload'))) {
            window.lishogi.reload();
          }
        },
        () => window.lishogi.announce({ msg: 'Failed to save notation preference' }),
      );
      redraw();
    },
    data,
    redraw,
    close,
  };
}

export function view(ctrl: NotationCtrl): VNode {
  return h('div.sub.notation.', [
    header(i18n('notationSystem'), ctrl.close),
    h('div.content', [
      h('div.selector', ctrl.data.list.map(notationView(ctrl, ctrl.data.current))),
    ]),
  ]);
}

function notationView(ctrl: NotationCtrl, current: Notation) {
  return (n: Notation) =>
    h(
      'a.text',
      {
        hook: bind('click', () => ctrl.set(n)),
        class: { active: current === n },
        attrs: {
          title: notationExample(n),
        },
      },
      notationDisplay(n),
    );
}

function notationExample(notation: Notation): string {
  switch (notation) {
    case prefs.notation.WESTERN:
      return 'P-76';
    case prefs.notation.WESTERNENGINE:
      return 'P-7f';
    case prefs.notation.JAPANESE:
      return '７六歩';
    case prefs.notation.KAWASAKI:
      return '歩-76';
    case prefs.notation.KIF:
      return '７六歩(77)';
    case prefs.notation.USI:
      return '7g7f';
    case prefs.notation.YOROZUYA:
      return '午六歩';
  }
}

function notationDisplay(notation: Notation): string {
  switch (notation) {
    case prefs.notation.WESTERN:
      return `${i18n('preferences:westernNotation')} (76)`;
    case prefs.notation.WESTERNENGINE:
      return `${i18n('preferences:westernNotation')} (7f)`;
    case prefs.notation.JAPANESE:
      return i18n('preferences:japaneseNotation');
    case prefs.notation.KAWASAKI:
      return i18n('preferences:kitaoKawasakiNotation');
    case prefs.notation.KIF:
      return i18n('preferences:kifNotation');
    case prefs.notation.USI:
      return 'USI';
    case prefs.notation.YOROZUYA:
      return i18n('preferences:yorozuyaNotation');
  }
}
