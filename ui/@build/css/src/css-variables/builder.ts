import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { generateCssVariables } from './css-variable-generator.js';
import { generateColorMixVariables } from './custom-theme.js';
import { generateScssMap } from './scss-map-generator.js';
import { parseThemes } from './theme-parser.js';

export async function build(extracted: Set<string>, themeDir: string): Promise<void> {
  try {
    const outDir = path.join(themeDir, 'gen');
    const themeVars = await parseThemes(themeDir);

    await mkdir(outDir, { recursive: true });

    await generateScssMap(themeVars, extracted, outDir);

    await generateCssVariables(themeVars, extracted, outDir);

    await generateColorMixVariables(extracted, outDir);

    console.log('CSS variables build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}
