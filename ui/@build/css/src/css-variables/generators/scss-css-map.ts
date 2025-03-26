import * as fs from 'node:fs';
import * as path from 'node:path';
import { signature } from '../constants.js';

export async function generateScssCssMap(
  rootDir: string,
  themes: Record<string, Record<string, string>>,
  extracted: string[],
  outDir: string,
): Promise<void> {
  let output = `${signature} ${path.relative(rootDir, import.meta.filename)}\n\n`;

  const themeKeys = new Set();
  Object.values(themes).forEach(theme => {
    Object.keys(theme).forEach(k => themeKeys.add(k));
  });

  for (const k of Array.from(themeKeys).sort()) {
    output += `$${k}: var(--${k});\n`;
  }

  extracted.forEach(name => {
    output += `$${name}: var(--${name});\n`;
  });

  await fs.promises.writeFile(path.join(outDir, '_theme.scss'), output);
}
