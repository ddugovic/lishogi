import type { Role } from 'shogiops/types';
import { isDrop, parseUsi } from 'shogiops/util';

export function plyColor(ply: number): Color {
  return ply % 2 === 0 ? 'sente' : 'gote';
}

export function usiToRole(usi: string): Role | undefined {
  const md = parseUsi(usi);
  return md && isDrop(md) ? md.role : undefined;
}

export function flipMetaPlayers(orientation: Color): void {
  const metaPlayers = document.querySelector<HTMLElement>('.game__meta__players');
  if (metaPlayers) {
    metaPlayers.classList.toggle('orientation-sente', orientation === 'sente');
    metaPlayers.classList.toggle('orientation-gote', orientation === 'gote');
  }
}
