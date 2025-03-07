import { memoize } from './common';

const styles = memoize(() => getComputedStyle(document.documentElement));

export const cssVar = (name: string): string => {
  return styles().getPropertyValue(name).trim();
};

export const isLight: boolean =
  document.documentElement.classList.contains('light') ||
  document.documentElement.classList.contains('custom-light');
