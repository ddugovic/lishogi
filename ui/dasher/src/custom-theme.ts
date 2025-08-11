import { spectrum } from 'common/assets';
import spinner from 'common/spinner';
import { camelToKebab } from 'common/string';
import { debounce } from 'common/timings';
import { i18n } from 'i18n';
import { h, type VNode } from 'snabbdom';
import { header, type Open, urlInput, validateUrl } from './util';

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

const announceFail = (validUrl: boolean) =>
  window.lishogi.announce({
    msg: `Failed to save custom preferences${validUrl ? '' : ': URL should start with https'}`,
  });

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
    window.lishogi.xhr
      .text('POST', '/pref/customTheme', { formData: data })
      .catch(() => announceFail(validateUrl(data.boardImg) && validateUrl(data.handsImg)));
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
          colorInput('boardColor', ctrl, i18n('backgroundColor')),
          urlInput<Key>('boardImg', ctrl.data.boardImg, ctrl.set, i18n('backgroundImageUrl')),
        ]),
        h('div.grid', [
          h('div.title', i18n('grid')),
          gridWidthSelection(ctrl, i18n('gridWidth'), [
            i18n('none'),
            i18n('gridSlim'),
            i18n('gridThick'),
            i18n('gridVeryThick'),
          ]),
          colorInput('gridColor', ctrl, i18n('gridColor')),
        ]),
        h('div.hands', [
          h('div.title', i18n('hands')),
          colorInput('handsColor', ctrl, i18n('backgroundColor')),
          urlInput('handsImg', ctrl.data.handsImg, ctrl.set, i18n('backgroundImageUrl')),
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

function colorInput(key: Key, ctrl: CustomThemeCtrl, title: string): VNode {
  return h('div.color-wrap', [
    h('p', title),
    h('input', { hook: { insert: vn => makeColorPicker(key, ctrl, vn) } }),
  ]);
}

function gridWidthSelection(ctrl: CustomThemeCtrl, name: string, options: string[]): VNode {
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

function makeColorPicker(key: Key, ctrl: CustomThemeCtrl, vnode: VNode) {
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
  const kls = document.documentElement.classList;
  const isDark = kls.contains('dark') || kls.contains('custom-dark');
  const isTransp = kls.contains('transp');
  if (key === 'gridColor') return isTransp ? '#cccccc' : isDark ? '#bababa' : '#4d4d4d';
  else return isTransp ? '#00000099' : isDark ? '#262421' : '#ffffff';
}

function cssVariableName(key: keyof Omit<CustomThemeData, 'gridWidth'>): string {
  return `--custom-${camelToKebab(key)}`;
}

function applyCustomTheme(key: Key, value: string | number) {
  if (key === 'gridWidth') {
    const kls = ['grid-width-0', 'grid-width-1', 'grid-width-2', 'grid-width-3'];
    document.body.classList.remove(...kls);
    document.body.classList.add(kls[value as number]);
  } else {
    if (key === 'boardImg' || key === 'handsImg') value = value ? `url(${value})` : 'none';
    document.documentElement.style.setProperty(cssVariableName(key), value as string);
  }
}

function applyEverything(ctrl: CustomThemeCtrl): void {
  let k: Key;
  for (k in ctrl.data) {
    applyCustomTheme(k, ctrl.data[k]);
  }
}
