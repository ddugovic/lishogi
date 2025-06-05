import type { Role } from 'shogiops/types';
import { isDrop, parseUsi } from 'shogiops/util';

export function plyColor(ply: number): Color {
  return ply % 2 === 0 ? 'sente' : 'gote';
}

export function usiToRole(usi: string): Role | undefined {
  const md = parseUsi(usi);
  return md && isDrop(md) ? md.role : undefined;
}
