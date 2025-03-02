import { spectrum } from 'common/assets';
import { onInsert } from 'common/snabbdom';
import spinner from 'common/spinner';
import { camelToKebab } from 'common/string';
import { debounce } from 'common/timings';
import { i18n } from 'i18n';
import { type VNode, h } from 'snabbdom';
import { type Open, header } from './util';

export interface CustomBackgroundData {
  light: boolean;
  bgPage: string;
  font: string;
  accent: string;
  primary: string;
  secondary: string;
  brag: string;
  green: string;
  red: string;
}

type Key = keyof CustomBackgroundData;
type ColorKey = {
  [K in keyof CustomBackgroundData]: CustomBackgroundData[K] extends string ? K : never;
}[keyof CustomBackgroundData];

export const colors: ColorKey[] = [
  'bgPage',
  'font',
  'accent',
  'primary',
  'secondary',
  'brag',
  'green',
  'red',
];

export interface CustomBackgroundCtrl {
  set: (cbd: CustomBackgroundData) => void;
  setColor: <K extends ColorKey>(key: K, value: CustomBackgroundData[K]) => void;
  setShading: (isLight: boolean) => void;
  data: CustomBackgroundData;
  redraw: Redraw;
  open: Open;
  loading?: 'loading' | 'done'; // load spectrum only once
}

const announceFail = () => window.lishogi.announce({ msg: 'Failed to save custom background' });

export function ctrl(
  dataInit: CustomBackgroundData | undefined,
  redraw: Redraw,
  open: Open,
): CustomBackgroundCtrl {
  const data = {} as CustomBackgroundData;
  data.light = dataInit?.light || false;
  colors.forEach(c => {
    data[c] = dataInit?.[c] || presets[0].preset[c];
  });
  const saveTheme = debounce(function (this: HTMLElement) {
    window.lishogi.xhr
      .text('POST', '/pref/customBackground', { formData: data })
      .catch(announceFail);
  }, 750);

  return {
    set: (cbd: CustomBackgroundData) => {
      Object.assign(data, cbd);
      applyEverything(data);
      redraw();
      saveTheme();
    },
    setColor: <K extends ColorKey>(key: K, value: CustomBackgroundData[K]) => {
      data[key] = value;
      applyCustomColor(key, value);
      redraw();
      saveTheme();
    },
    setShading: (isLight: boolean) => {
      data.light = isLight;
      applyShading(isLight);
      redraw();
      saveTheme();
    },
    data,
    redraw,
    open,
  };
}

export function view(ctrl: CustomBackgroundCtrl): VNode {
  if (ctrl.loading === 'done') {
    return h(
      'div.sub.custom-background',
      {
        hook: {
          init: () => applyEverything(ctrl.data),
        },
      },
      [
        header(i18n('background'), () => ctrl.open('background')),
        h('div.list', [
          presetSelection(ctrl),
          radioGroup(ctrl),
          makeColorInput(ctrl, i18n('backgroundColor'), 'bgPage'),
          makeColorInput(ctrl, 'Font:', 'font'),
          makeColorInput(ctrl, 'color#1:', 'accent'),
          makeColorInput(ctrl, 'color#2:', 'primary'),
          makeColorInput(ctrl, 'color#3:', 'secondary'),
          makeColorInput(ctrl, `${i18n('patron:lishogiPatron')}:`, 'brag'),
          makeColorInput(ctrl, `${i18n('success')}:`, 'green'),
          makeColorInput(ctrl, `${i18n('error.unknown')}:`, 'red'),
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
    return h('div.sub.custom-background.loading', [
      header(i18n('back'), () => ctrl.open('background')),
      spinner(),
    ]);
  }
}

function makeColorInput(ctrl: CustomBackgroundCtrl, title: string, key: ColorKey): VNode {
  return h('div.color-wrap', [
    h('p', title),
    h(`input.kls-${key}`, { hook: { insert: vn => makeColorPicker(ctrl, vn, key) } }),
  ]);
}

function presetSelection(ctrl: CustomBackgroundCtrl): VNode {
  const selected = presets.find(p =>
    Object.keys(ctrl.data).every(key => p.preset[key as Key] === ctrl.data[key as Key]),
  );
  const empty = [h('option', { attrs: { selected: !selected, hidden: true, value: '' } }, '')];
  return h('div.select-wrap', [
    h('p', i18n('presets')),
    h(
      'select',
      {
        hook: onInsert(el => {
          el.addEventListener('change', e => {
            const preset = presets[Number.parseInt((e.target as HTMLSelectElement).value)];
            ctrl.set(preset.preset);
            colors.forEach(c => {
              $(`input.kls-${c}`).spectrum('set', preset.preset[c]);
            });
          });
        }),
      },
      empty.concat(
        presets.map((p, i) =>
          h(
            'option',
            {
              attrs: {
                value: i,
                selected: selected?.name == p.name,
              },
            },
            p.name,
          ),
        ),
      ),
    ),
  ]);
}

function radioGroup(ctrl: CustomBackgroundCtrl): VNode {
  const selected = ctrl.data.light ? 'light' : 'dark';
  return h(
    'group.radio.dual',
    ['dark', 'light'].map(shade => {
      const id = `dasher-shade-${shade}`;
      const checked = shade == selected;
      return h('div', { key: `${id}-${selected}` }, [
        h(`input#${id}`, {
          hook: {
            insert: vnode => {
              const el = vnode.elm as HTMLInputElement;
              el.addEventListener('input', _ => {
                ctrl.setShading(el.value === '1');
              });
            },
          },
          attrs: {
            type: 'radio',
            name: shade,
            id,
            value: shade === 'light' ? '1' : '0',
            checked,
          },
        }),
        h(
          'label.required',
          {
            attrs: {
              for: id,
            },
          },
          shade === 'light' ? i18n('light') : i18n('dark'),
        ),
      ]);
    }),
  );
}

function makeColorPicker(ctrl: CustomBackgroundCtrl, vnode: VNode, key: ColorKey) {
  const move = (color: any) => {
    const hexColor = color.toHexString();
    console.log(hexColor);

    const prevColor = ctrl.data[key] || '';

    if (hexColor === prevColor) return;
    ctrl.setColor(key, hexColor);
  };

  console.log('SEETING', ctrl.data[key]);

  $(vnode.elm as HTMLElement).spectrum({
    type: 'component',
    color: ctrl.data[key],
    preferredFormat: 'hex',
    showAlpha: false,
    showPalette: false,
    showButtons: false,
    allowEmpty: false,
    top: '37px',
    move: debounce(move, 20),
  });
}

export function cssVariableName(key: ColorKey): string {
  return `--custom-${camelToKebab(key)}`;
}

function applyCustomColor(key: ColorKey, value: string | undefined) {
  document.documentElement.style.setProperty(cssVariableName(key), value || '');
}

function applyShading(isLight: boolean) {
  document.documentElement.classList.remove('custom-dark', 'custom-light');
  document.documentElement.classList.add(isLight ? 'custom-light' : 'custom-dark');
}

function applyEverything(data: CustomBackgroundData): void {
  applyShading(data.light);
  for (const k of colors) {
    applyCustomColor(k, data[k]);
  }
}

const presets: { name: string; preset: CustomBackgroundData }[] = [
  {
    name: 'gruvbox',
    preset: {
      light: false,
      bgPage: '#1d2021',
      font: '#ebdbb2',
      accent: '#fb4934',
      primary: '#83a598',
      secondary: '#8c8e0d',
      brag: '#bf811d',
      green: '#629924',
      red: '#c33',
    },
  },
  {
    name: 'neon',
    preset: {
      light: false,
      bgPage: '#1a1a2e',
      font: '#e0e0e0',
      accent: '#ff2079',
      primary: '#00ffcc',
      secondary: '#ffcc00',
      brag: '#ff5e5e',
      green: '#00cc66',
      red: '#ff3366',
    },
  },
  {
    name: '侍',
    preset: {
      light: false,
      bgPage: '#1c1c1c',
      font: '#f5f5f5',
      accent: '#c41e3a',
      primary: '#6589a3',
      secondary: '#8c7851',
      brag: '#b99041',
      green: '#5a7d5a',
      red: '#c41e3a',
    },
  },
  {
    name: 'fantasy',
    preset: {
      light: false,
      bgPage: '#1c2520',
      font: '#d9c7a3',
      accent: '#b68d40',
      primary: '#77a174',
      secondary: '#6b4e31',
      brag: '#e6b800',
      green: '#5a8c5a',
      red: '#8b0000',
    },
  },
  {
    name: 'nord',
    preset: {
      light: false,
      bgPage: '#2e3440',
      font: '#d8dee9',
      accent: '#bf616a',
      primary: '#88c0d0',
      secondary: '#81a1c1',
      brag: '#ebcb8b',
      green: '#a3be8c',
      red: '#bf616a',
    },
  },
  {
    name: 'solarized-dark',
    preset: {
      light: false,
      bgPage: '#002b36',
      font: '#c7d2d3',
      accent: '#b58900',
      primary: '#268bd2',
      secondary: '#2aa198',
      brag: '#cb4b16',
      green: '#859900',
      red: '#dc322f',
    },
  },
  {
    name: 'dracula',
    preset: {
      light: false,
      bgPage: '#282a36',
      font: '#f8f8f2',
      accent: '#ff79c6',
      primary: '#bd93f9',
      secondary: '#50fa7b',
      brag: '#f1fa8c',
      green: '#69c379',
      red: '#ff5555',
    },
  },
  {
    name: 'gruvbox-light',
    preset: {
      light: true,
      bgPage: '#fbf1c7',
      font: '#3c3836',
      accent: '#d65d0e',
      primary: '#458588',
      secondary: '#b16286',
      brag: '#d79921',
      green: '#98971a',
      red: '#cc241d',
    },
  },
  {
    name: 'solarized-light',
    preset: {
      light: true,
      bgPage: '#fdf6e3',
      font: '#657b83',
      accent: '#b58900',
      primary: '#268bd2',
      secondary: '#2aa198',
      brag: '#cb4b16',
      green: '#859900',
      red: '#dc322f',
    },
  },
  {
    name: 'nord-light',
    preset: {
      light: true,
      bgPage: '#eceff4',
      font: '#4c566a',
      accent: '#bf616a',
      primary: '#5e81ac',
      secondary: '#81a1c1',
      brag: '#d08770',
      green: '#a3be8c',
      red: '#bf616a',
    },
  },
];
