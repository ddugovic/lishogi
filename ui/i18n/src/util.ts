import { i18n } from './i18n';

export const colonSymbol: () => string = () => {
  const symbol = i18n('colonSymbol');
  const space = symbol === ':' ? ' ' : '';
  return `${symbol}${space}`;
};
