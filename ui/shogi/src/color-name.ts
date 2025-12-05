import { memoize } from 'common/common';
import { prefs } from 'common/prefs';
import { i18n } from 'i18n';

const colorNamePref = memoize(() => Number.parseInt(document.body.dataset.colorName || '0'));

export function colorName(color: Color, isHandicap: boolean): string {
  return isHandicap ? handicapColorName(color) : standardColorName(color);
}

function standardColorName(color: Color): string {
  switch (colorNamePref()) {
    case prefs.colorName.SENTEJP:
      return color === 'sente' ? '先手' : '後手';
    case prefs.colorName.SENTE:
      return color === 'sente' ? 'Sente' : 'Gote';
    case prefs.colorName.BLACK:
      return color === 'sente' ? i18n('black') : i18n('white');
    default:
      return color === 'sente' ? i18n('sente') : i18n('gote');
  }
}

function handicapColorName(color: Color): string {
  switch (colorNamePref()) {
    case prefs.colorName.SENTEJP:
      return color === 'sente' ? '下手' : '上手';
    case prefs.colorName.SENTE:
      return color === 'sente' ? 'Shitate' : 'Uwate';
    case prefs.colorName.BLACK:
      return color === 'sente' ? i18n('black') : i18n('white');
    default:
      return color === 'sente' ? i18n('shitate') : i18n('uwate');
  }
}
