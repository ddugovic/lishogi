import { loadCssPath } from 'common/assets';
import { debounce } from 'common/timings';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import { type CustomBackgroundData, colors, cssVariableName } from './custom-background';
import { bind, type Close, header, type Open, validateUrl } from './util';

type Key = 'system' | 'dark' | 'light' | 'transp' | 'custom';

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
    { key: 'system', name: i18n('systemBackground') },
    { key: 'dark', name: i18n('dark') },
    { key: 'light', name: i18n('light') },
    { key: 'transp', name: i18n('transparent') },
  ];
  if (document.body.dataset.user) list.push({ key: 'custom', name: i18n('custom') });

  const announceFail = (validUrl: boolean) =>
    window.lishogi.announce({
      msg: `Failed to save background preference${validUrl ? '' : ': URL should start with https'}`,
    });

  return {
    list,
    get: () => data.current,
    set(c: Key) {
      data.current = c;
      window.lishogi.xhr
        .text('POST', '/pref/bg', { formData: { bg: c } })
        .catch(() => announceFail(false));
      if (c === 'transp') data.image = this.getImage();
      applyBackground(data, list);
      if (c === 'custom') {
        loadCssPath('common.custom');
        open('customBackground');
      } else redraw();
      window.lishogi.pubsub.emit('background-change');
    },
    getImage: () => data.image || '//lishogi1.org/assets/images/background/nature.jpg',
    setImage(i: string) {
      data.image = i;
      window.lishogi.xhr
        .text('POST', '/pref/bgImg', { formData: { bgImg: i } })
        .catch(() => announceFail(validateUrl(data.image)));
      applyBackground(data, list);
      redraw();
    },
    close,
  };
}

export function view(ctrl: BackgroundCtrl): VNode {
  const cur = ctrl.get();
  const supportsCustom =
    CSS.supports('color', 'oklch(0.5 0.2 240)') &&
    CSS.supports('color', 'color-mix(in srgb, red, blue)');

  return h('div.sub.background', [
    header(i18n('background'), ctrl.close),
    h('div.selector.large', [
      ...ctrl.list.map(bg => {
        return h(
          'a.text',
          {
            class: { active: cur === bg.key },
            hook: bind('click', () => ctrl.set(bg.key)),
            disabled: bg.key === 'custom' && !supportsCustom,
            title:
              bg.key === 'custom' && !supportsCustom
                ? 'Your browser does not support this'
                : undefined,
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
    colors
      .map(c => cssVariableName(c))
      .forEach(cssVar => {
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
    document.documentElement.style.setProperty('--custom-bg-img', `url(${data.image})`);
    document.body.classList.add('custom-background-img');
  } else if (key !== 'custom' || !data.customBackground?.bgImg) {
    document.body.classList.remove('custom-background-img');
  }

  updateMetaThemeColor(
    key,
    key === 'light' || (key === 'custom' && !!data.customBackground?.light),
  );
}

function updateMetaThemeColor(background: Key, isLight: boolean): void {
  const existingMeta = document.querySelectorAll('meta[name="theme-color"]');
  existingMeta.forEach(meta => {
    meta.remove();
  });

  if (background === 'system') {
    const lightMeta = document.createElement('meta');
    lightMeta.name = 'theme-color';
    lightMeta.content = '#dbd7d1';
    lightMeta.media = '(prefers-color-scheme: light)';
    document.head.appendChild(lightMeta);

    const darkMeta = document.createElement('meta');
    darkMeta.name = 'theme-color';
    darkMeta.content = '#2e2a24';
    darkMeta.media = '(prefers-color-scheme: dark)';
    document.head.appendChild(darkMeta);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = isLight ? '#dbd7d1' : '#2e2a24';
    document.head.appendChild(meta);
  }
}

// function reloadAllTheThings() {
//   if (window.Chart && confirm('Page will be reloaded')) window.lishogi.reload();
// }
