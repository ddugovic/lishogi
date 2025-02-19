import { spectrum } from 'common/assets';
import spinner from 'common/spinner';
import { debounce } from 'common/timings';
import { i18n } from 'i18n';
import { type VNode, h } from 'snabbdom';
import { type Open, header, validateUrl } from './util';

export interface CustomThemeData {
  boardColor: string;
  boardImg: string;
  gridColor: string;
  gridWidth: number;
  handsColor: string;
  handsImg: string;
}

type Key = keyof CustomThemeData;
type ColorKey = Key & ('gridColor' | 'boardColor' | 'handsColor');

export interface CustomThemeCtrl {
  set: <K extends Key>(key: K, value: CustomThemeData[K]) => void;
  data: CustomThemeData;
  redraw: Redraw;
  open: Open;
  loading?: 'loading' | 'done'; // load spectrum only once
}

const announceFail = () => window.lishogi.announce({ msg: 'Failed to save custom preferences' });

export function ctrl(data: CustomThemeData, redraw: Redraw, open: Open): CustomThemeCtrl {
  const saveTheme = debounce(function (this: HTMLElement) {
    // once anything changes we lock in the values
    const posInitials: ColorKey[] = ['gridColor', 'boardColor', 'handsColor'];
    posInitials.forEach(key => {
      if (data[key] === 'initial') {
        data[key] = defaultColor(key);
        applyCustomTheme(key, data[key]);
      }
    });
    window.lishogi.xhr.text('POST', '/pref/customTheme', { formData: data }).catch(announceFail);
  }, 500);

  return {
    set: <K extends Key>(key: K, value: CustomThemeData[K]) => {
      data[key] = value;
      applyCustomTheme(key, value);
      saveTheme();
    },
    data,
    redraw,
    open,
  };
}

export function view(ctrl: CustomThemeCtrl): VNode {
  if (ctrl.loading === 'done') {
    return h(
      'div.sub.custom-theme',
      {
        hook: {
          init: () => applyEverything(ctrl),
        },
      },
      [
        header(i18n('customTheme'), () => ctrl.open('theme')),
        h('div.board', [
          h('div.title', i18n('board')),
          makeColorInput(ctrl, i18n('backgroundColor'), 'boardColor'),
          makeTextInput(ctrl, i18n('backgroundImageUrl'), 'boardImg'),
        ]),
        h('div.grid', [
          h('div.title', i18n('grid')),
          makeSelection(ctrl, i18n('gridWidth'), [
            i18n('none'),
            i18n('gridSlim'),
            i18n('gridThick'),
            i18n('gridVeryThick'),
          ]),
          makeColorInput(ctrl, i18n('gridColor'), 'gridColor'),
        ]),
        h('div.hands', [
          h('div.title', i18n('hands')),
          makeColorInput(ctrl, i18n('backgroundColor'), 'handsColor'),
          makeTextInput(ctrl, i18n('backgroundImageUrl'), 'handsImg'),
        ]),
      ],
    );
  } else {
    if (!ctrl.loading) {
      ctrl.loading = 'loading';
      spectrum().then(() => {
        ctrl.loading = 'done';
        ctrl.redraw();
      });
    }
    return h('div.sub.custom-theme.loading', [
      header(i18n('customTheme'), () => ctrl.open('theme')),
      spinner(),
    ]);
  }
}

function makeColorInput(ctrl: CustomThemeCtrl, title: string, key: Key): VNode {
  return h('div.color-wrap', [
    h('p', title),
    h('input', { hook: { insert: vn => makeColorPicker(ctrl, vn, key) } }),
  ]);
}

function makeTextInput(ctrl: CustomThemeCtrl, title: string, key: Key): VNode {
  return h('div.url-wrap', [
    h('p', title),
    h('input', {
      attrs: {
        type: 'text',
        placeholder: 'https://',
        value: ctrl.data[key],
      },
      hook: {
        insert: vm =>
          $(vm.elm as HTMLInputElement).on('change keyup paste', function (this: HTMLInputElement) {
            const url = $(this).val()?.trim()!;
            if (validateUrl(url)) ctrl.set(key, url);
          }),
      },
    }),
  ]);
}

function makeSelection(ctrl: CustomThemeCtrl, name: string, options: string[]): VNode {
  return h('div.select-wrap', [
    h('p', name),
    h(
      'select',
      {
        hook: {
          insert: vm =>
            $(vm.elm as HTMLElement).on('change', function (this: HTMLElement) {
              ctrl.set('gridWidth', $(this).val() as number);
            }),
        },
      },
      options.map((o, i) =>
        h(
          'option',
          {
            attrs: {
              value: i,
              selected: ctrl.data.gridWidth == i,
            },
          },
          o,
        ),
      ),
    ),
  ]);
}

function makeColorPicker(ctrl: CustomThemeCtrl, vnode: VNode, key: Key) {
  const move = (color: any) => {
    const hexColor = color.toHex8String();
    const prevColor = ctrl.data[key] as string;
    if (hexColor === prevColor) return;
    if (hexColor.slice(-2) === '00' && prevColor.slice(1, -2) !== hexColor.slice(1, -2))
      $('.sp-container:not(.sp-hidden) .sp-alpha-handle').addClass('highlight');
    else if (prevColor.slice(-2) === '00')
      $('.sp-container:not(.sp-hidden) .sp-alpha-handle').removeClass('highlight');
    ctrl.set(key, hexColor);
  };

  $(vnode.elm as HTMLElement).spectrum({
    type: 'component',
    color: ctrl.data[key] === 'initial' ? defaultColor(key as ColorKey) : ctrl.data[key],
    preferredFormat: 'hex8',
    showPalette: false,
    showButtons: false,
    allowEmpty: false,
    top: '37px',
    move: debounce(move, 20),
  });
}

function defaultColor(key: ColorKey): string {
  const isDark = document.body.classList.contains('dark');
  const isTransp = document.body.classList.contains('transp');
  if (key === 'gridColor') return isTransp ? '#cccccc' : isDark ? '#bababa' : '#4d4d4d';
  else return isTransp ? '#00000099' : isDark ? '#262421' : '#ffffff';
}

function cssVariableName(key: keyof Omit<CustomThemeData, 'gridWidth'>): string {
  switch (key) {
    case 'boardColor':
      return 'board-color';
    case 'boardImg':
      return 'board-url';
    case 'gridColor':
      return 'grid-color';
    case 'handsColor':
      return 'hands-color';
    case 'handsImg':
      return 'hands-url';
  }
}

function applyCustomTheme(key: Key, value: string | number) {
  if (key === 'gridWidth') {
    const kls = ['grid-width-0', 'grid-width-1', 'grid-width-2', 'grid-width-3'];
    document.body.classList.remove(...kls);
    document.body.classList.add(kls[value as number]);
  } else {
    const prefix = '--c-';
    if (key === 'boardImg' || key === 'handsImg') value = value ? `url(${value})` : 'none';
    document.body.style.setProperty(prefix + cssVariableName(key), value as string);
  }
}

function applyEverything(ctrl: CustomThemeCtrl): void {
  let k: Key;
  for (k in ctrl.data) {
    applyCustomTheme(k, ctrl.data[k]);
  }
}
