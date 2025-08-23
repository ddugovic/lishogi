import { icons } from './icons';

export function getPerfIcon(key: VariantKey | Perf): string;
export function getPerfIcon(key: string | undefined): string | undefined;
export function getPerfIcon(key: string | undefined): string | undefined {
  return perfIcons[(key || 'standard').toLowerCase()];
}

const perfIcons: Record<string, string> = {
  standard: icons.standard,
  blitz: icons.blitz,
  ultrabullet: icons.ultraBullet,
  bullet: icons.bullet,
  classical: icons.classical,
  rapid: icons.rapid,
  correspondence: icons.correspondence,
  minishogi: icons.minishogi,
  chushogi: icons.chushogi,
  annanshogi: icons.annanshogi,
  kyotoshogi: icons.kyotoshogi,
  checkshogi: icons.checkshogi,
};
