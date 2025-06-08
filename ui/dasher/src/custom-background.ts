import { spectrum } from 'common/assets';
import { onInsert } from 'common/snabbdom';
import spinner from 'common/spinner';
import { camelToKebab } from 'common/string';
import { debounce } from 'common/timings';
import { i18n } from 'i18n';
import { type VNode, h } from 'snabbdom';
import { type Open, header, urlInput, validateUrl } from './util';

export interface CustomBackgroundData {
  light: boolean;
  bgPage: string;
  bgImg: string;
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

const colorInputs = new Map<ColorKey, any>();

export interface CustomBackgroundCtrl {
  set: (cbd: CustomBackgroundData) => void;
  setBgColor: (value: string, isLight: boolean) => void;
  setColor: <K extends ColorKey>(key: K, value: CustomBackgroundData[K]) => void;
  // setShading: (isLight: boolean) => void;
  setImage: (url: string) => void;
  data: CustomBackgroundData;
  redraw: Redraw;
  open: Open;
  loading?: 'loading' | 'done'; // load spectrum only once
}

const announceFail = (validUrl: boolean) =>
  window.lishogi.announce({
    msg: `Failed to save custom background${validUrl ? '' : ': URL should start with https'}`,
  });

export function ctrl(
  dataInit: CustomBackgroundData | undefined,
  redraw: Redraw,
  open: Open,
): CustomBackgroundCtrl {
  const data = {} as CustomBackgroundData;
  data.light = dataInit?.light || false;
  data.bgImg = dataInit?.bgImg || '';
  colors.forEach(c => {
    data[c] = dataInit?.[c] || presets[0].preset[c];
  });
  const saveTheme = debounce(function (this: HTMLElement) {
    window.lishogi.xhr
      .text('POST', '/pref/customBackground', { formData: data })
      .catch(() => announceFail(validateUrl(data.bgImg)));
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
    setBgColor: (value: string, isLight: boolean) => {
      data.bgPage = value;
      applyCustomColor('bgPage', value);
      if (data.light !== isLight) {
        data.light = isLight;
        applyShading(isLight);
      }
      redraw();
      saveTheme();
    },
    setImage: (url: string) => {
      data.bgImg = url;
      applyImage(url);
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
          colorInput('bgPage', ctrl, i18n('backgroundColor')),
          colorInput('font', ctrl, 'Font:'),
          colorInput('accent', ctrl, 'color#1:'),
          colorInput('primary', ctrl, 'color#2:'),
          colorInput('secondary', ctrl, 'color#3:'),
          colorInput('brag', ctrl, `${i18n('patron:lishogiPatron')}:`),
          colorInput('green', ctrl, `${i18n('success')}:`),
          colorInput('red', ctrl, `${i18n('error.unknown')}:`),
          urlInput(
            'bgImg',
            ctrl.data.bgImg,
            (_, url) => ctrl.setImage(url),
            i18n('backgroundImageUrl'),
          ),
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

function colorInput(key: ColorKey, ctrl: CustomBackgroundCtrl, title: string): VNode {
  const id = `#col-pick-${key}`;
  return h('div.color-wrap', [
    h('p', title),
    h(`input${id}`, { hook: { insert: () => makeColorPicker(ctrl, id, key) } }),
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
              const sp = colorInputs.get(c);
              sp.set(preset.preset[c]);
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

function makeColorPicker(ctrl: CustomBackgroundCtrl, id: string, key: ColorKey) {
  const move = (e: any) => {
    const color = e.detail.color;
    const hexColor = key === 'bgPage' ? color.toHex8String() : color.toHexString();

    const prevColor = ctrl.data[key] || '';

    if (hexColor === prevColor) return;

    if (key === 'bgPage') ctrl.setBgColor(hexColor, color.isLight());
    else ctrl.setColor(key, hexColor);
  };

  const sp = (window as any).Spectrum.create(id, {
    type: 'component',
    color: ctrl.data[key],
    preferredFormat: key === 'bgPage' ? 'hex8' : 'hex',
    showAlpha: key === 'bgPage',
    showPalette: false,
    showButtons: false,
    allowEmpty: false,
    top: '37px',
    move: debounce(move, 20),
  });
  colorInputs.set(key, sp);
}

export function cssVariableName(key: Key): string {
  return `--custom-${camelToKebab(key)}`;
}

function applyCustomColor(key: ColorKey, value: string | undefined) {
  document.documentElement.style.setProperty(cssVariableName(key), value || '');
}

function applyShading(isLight: boolean) {
  document.documentElement.classList.remove('custom-dark', 'custom-light');
  document.documentElement.classList.add(isLight ? 'custom-light' : 'custom-dark');
}

function applyImage(url: string) {
  document.documentElement.style.setProperty(cssVariableName('bgImg'), url ? `url(${url})` : null);
  if (url === 'none' || url === '') document.body.classList.remove('custom-background-img');
  else document.body.classList.add('custom-background-img');
}

function applyEverything(data: CustomBackgroundData): void {
  applyShading(data.light);
  applyImage(data.bgImg);
  for (const k of colors) {
    applyCustomColor(k, data[k]);
  }
}

const presets: { name: string; preset: CustomBackgroundData }[] = [
  {
    name: 'Gruvbox',
    preset: {
      light: false,
      bgPage: '#1d2021',
      bgImg: '',
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
    name: 'Neon',
    preset: {
      light: false,
      bgPage: '#1a1a2e',
      bgImg: '',
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
      bgImg: '',
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
    name: 'Fantasy',
    preset: {
      light: false,
      bgPage: '#1c2520',
      bgImg: '',
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
    name: 'Nord',
    preset: {
      light: false,
      bgPage: '#2e3440',
      bgImg: '',
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
    name: 'Solarized dark',
    preset: {
      light: false,
      bgPage: '#002b36',
      bgImg: '',
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
    name: 'Dracula',
    preset: {
      light: false,
      bgPage: '#282a36',
      bgImg: '',
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
    name: 'Gruvbox light',
    preset: {
      light: true,
      bgPage: '#fbf1c7',
      bgImg: '',
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
    name: 'Solarized light',
    preset: {
      light: true,
      bgPage: '#fdf6e3',
      bgImg: '',
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
    name: 'Nord light',
    preset: {
      light: true,
      bgPage: '#eceff4',
      bgImg: '',
      font: '#4c566a',
      accent: '#bf616a',
      primary: '#5e81ac',
      secondary: '#81a1c1',
      brag: '#d08770',
      green: '#a3be8c',
      red: '#bf616a',
    },
  },
  {
    name: 'River',
    preset: {
      light: true,
      bgPage: '#c1d3c5e8',
      bgImg: '//lishogi1.org/assets/images/background/river.jpg',
      font: '#100f0f',
      accent: '#758b6a',
      primary: '#003b66',
      secondary: '#9fbb87',
      brag: '#6a4a0f',
      green: '#5a7d5a',
      red: '#c41e3a',
    },
  },
];
