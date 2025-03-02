import { loadCssPath } from 'common/assets';
import { debounce } from 'common/timings';
import { i18n } from 'i18n';
import { type VNode, h } from 'snabbdom';
import { type CustomBackgroundData, colors, cssVariableName } from './custom-background';
import { type Close, type Open, bind, header, validateUrl } from './util';

type Key = 'light' | 'dark' | 'transp' | 'custom';

export interface BackgroundCtrl {
  list: Background[];
  set(k: Key): void;
  get(): Key;
  getImage(): string;
  setImage(i: string): void;
  close: Close;
}

export interface BackgroundData {
  current: Key;
  image?: string;
  customBackground?: CustomBackgroundData;
}

interface Background {
  key: Key;
  name: string;
}

export function ctrl(
  data: BackgroundData,
  redraw: Redraw,
  open: Open,
  close: Close,
): BackgroundCtrl {
  const list: Background[] = [
    { key: 'light', name: i18n('light') },
    { key: 'dark', name: i18n('dark') },
    { key: 'transp', name: i18n('transparent') },
    { key: 'custom', name: i18n('custom') },
  ];

  const announceFail = () =>
    window.lishogi.announce({ msg: 'Failed to save background preference' });

  return {
    list,
    get: () => data.current,
    set(c: Key) {
      data.current = c;
      window.lishogi.xhr.text('POST', '/pref/bg', { formData: { bg: c } }).catch(announceFail);
      applyBackground(data, list);
      if (c === 'custom') {
        loadCssPath('common.custom');
        open('customBackground');
      } else redraw();
    },
    getImage: () => data.image || '//lishogi1.org/assets/images/background/nature.jpg',
    setImage(i: string) {
      data.image = i;
      window.lishogi.xhr
        .text('POST', '/pref/bgImg', { formData: { bgImg: i } })
        .catch(announceFail);
      applyBackground(data, list);
      redraw();
    },
    close,
  };
}

export function view(ctrl: BackgroundCtrl): VNode {
  const cur = ctrl.get();

  return h('div.sub.background', [
    header(i18n('background'), ctrl.close),
    h('div.selector.large', [
      ...ctrl.list.map(bg => {
        return h(
          'a.text',
          {
            class: { active: cur === bg.key },
            attrs: { 'data-icon': 'E' },
            hook: bind('click', () => ctrl.set(bg.key)),
          },
          bg.name,
        );
      }),
    ]),
    cur === 'transp' ? imageInput(ctrl) : null,
  ]);
}

function imageInput(ctrl: BackgroundCtrl) {
  return h('div.image', [
    h('p', i18n('backgroundImageUrl')),
    h('input', {
      attrs: {
        type: 'text',
        placeholder: 'https://',
        value: ctrl.getImage(),
      },
      hook: {
        insert: vnode => {
          $(vnode.elm as HTMLElement).on(
            'change keyup paste',
            debounce(function (this: HTMLElement) {
              const url = ($(this).val() as string).trim();
              if (validateUrl(url)) ctrl.setImage(url);
            }, 300),
          );
        },
      },
    }),
  ]);
}

function applyBackground(data: BackgroundData, list: Background[]) {
  const key = data.current;

  if (key !== 'custom')
    colors.map(cssVariableName).forEach(cssVar => {
      document.documentElement.style.removeProperty(cssVar);
    });

  document.documentElement.classList.remove(
    ...list.map(b => b.key).filter(b => b !== 'custom'),
    'custom-dark',
    'custom-light',
  );
  const kls: string =
    key === 'custom' && data.customBackground?.light
      ? 'custom-light'
      : key === 'custom'
        ? 'custom-dark'
        : key;
  document.documentElement.classList.add(...(kls === 'transp' ? ['transp', 'dark'] : [kls]));

  if (key === 'transp') {
    document.documentElement.style.setProperty('--tr-bg-url', `url(${data.image})`);
  }
}

// function reloadAllTheThings() {
//   if (window.Chart && confirm('Page will be reloaded')) window.lishogi.reload();
// }
