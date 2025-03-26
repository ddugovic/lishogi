import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { signature } from '../constants.js';

export async function generateColorMixVariables(
  rootDir: string,
  extracted: string[],
  outDir: string,
): Promise<void> {
  let output = `${signature} ${path.relative(rootDir, import.meta.filename)}
    
html {
`;

  output += extracted
    .map(name => {
      const mixFunction = generateColorMixFunction(name);
      return mixFunction ? `  --${name}: ${mixFunction}` : null;
    })
    .filter(Boolean)
    .join('\n');
  output += '}';

  await writeFile(path.join(outDir, '_color-mix.scss'), output);
}

function generateColorMixFunction(variableName: string): string | null {
  const parts = variableName.split('_');

  const colorConstants = ['white', 'black', 'transparent', 'gray'];
  const processColorName = (name: string): string => {
    if (colorConstants.includes(name)) {
      return name;
    }
    return `var(--c-${name})`;
  };

  // Handle color mixing pattern: --m-accent_bg-box_mix_10 → color-mix(in srgb, var(--c-accent) 10%, var(--c-bg-box) 90%)
  if (parts.length === 4 && parts[2] === 'mix') {
    const firstColor = parts[0].replace(/^m-/, '');
    const secondColor = parts[1];
    const mixPercentage = Number.parseInt(parts[3]);
    const complementPercentage = 100 - mixPercentage;

    return `color-mix(in srgb, ${processColorName(firstColor)} ${mixPercentage}%, ${processColorName(secondColor)} ${complementPercentage}%);`;
  }

  // Handle alpha negation pattern: --m-accent_alpha_neg40 → oklch(from var(--c-accent) l c h / 0.6)
  if (parts.length === 3 && parts[1] === 'alpha' && parts[2].startsWith('neg')) {
    const colorName = parts[0].replace(/^m-/, '');
    const negationValue = Number.parseInt(parts[2].replace('neg', ''));
    const alphaValue = (100 - negationValue) / 100;

    return `oklch(from ${processColorName(colorName)} l c h / ${alphaValue});`;
  }

  // Handle lightness pattern: --m-primary_lightness_10 → oklch(from var(--c-primary) calc(l + 0.1) c h)
  if (parts.length === 3 && parts[1] === 'lightness' && !parts[2].startsWith('neg')) {
    const colorName = parts[0].replace(/^m-/, '');
    const lightnessValue = Number.parseInt(parts[2], 10) / 100;

    return `oklch(from ${processColorName(colorName)} calc(l + ${lightnessValue}) c h);`;
  }

  // Handle negative lightness (darkening): --m-bg-input_lightness_neg3 → oklch(from var(--c-bg-input) calc(l - 0.03) c h)
  if (parts.length === 3 && parts[1] === 'lightness' && parts[2].startsWith('neg')) {
    const colorName = parts[0].replace(/^m-/, '');
    const darknessValue = Number.parseInt(parts[2].replace('neg', '')) / 100;

    return `oklch(from ${processColorName(colorName)} calc(l - ${darknessValue}) c h);`;
  }

  // Handle special c-lightness pattern: --m-bg-page_c-lightness_78 → oklch(from var(--c-bg-page) 0.78 c h)
  if (parts.length === 3 && parts[1] === 'c-lightness') {
    const colorName = parts[0].replace(/^m-/, '');
    const lightnessValue = Number.parseInt(parts[2]) / 100;

    return `oklch(from ${processColorName(colorName)} ${lightnessValue} c h);`;
  }

  // Handle alpha setting: --m-bg-page_c-alpha_78 → oklch(from var(--c-bg-page) l c h / 0.78)
  if (parts.length === 3 && parts[1] === 'c-alpha') {
    const colorName = parts[0].replace(/^m-/, '');
    const alphaValue = Number.parseInt(parts[2]) / 100;

    return `oklch(from ${processColorName(colorName)} l c h / ${alphaValue});`;
  }

  console.warn(`Couldn't properly parse: ${variableName}`);

  return null;
}
