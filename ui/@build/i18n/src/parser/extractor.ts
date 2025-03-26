import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from '@build/helpers/glob';
import type { Project } from '@build/helpers/workspace-packages';

const IMPORT_REGEX = /import\s*{([^}]+)}\s*from\s*['"]i18n(?:\/i18n)?['"`]/g;
const LOCAL_IMPORT_REGEX = /import\s*{([^}]+)}\s*from\s*['"](?:\.)(?:\/i18n)?['"`]/g;

async function extractI18nKeysFromFile(
  filePath: string,
  usesLocalImports: boolean,
): Promise<Set<string>> {
  const keys = new Set<string>();
  const importedFunctions = new Set<string>();

  const sourceCode = await fs.readFile(filePath, 'utf-8');
  const reg = usesLocalImports ? LOCAL_IMPORT_REGEX : IMPORT_REGEX;

  for (const match of sourceCode.matchAll(reg)) {
    const imports = match[1].split(',');
    for (const imp of imports) {
      const parts = imp.trim().split(/\s+as\s+/);
      const functionName = parts[parts.length - 1].trim();
      importedFunctions.add(functionName);
    }
  }

  const functionPattern = Array.from(importedFunctions).join('|');
  if (!functionPattern) return keys;

  const callRegex = new RegExp(
    `(?<![.])(?:\\.{3})?\\b(?:${functionPattern})\\s*\\(\\s*(['"\`])([^\\'"\`]+)\\1`,
    'g',
  );
  for (const match of sourceCode.matchAll(callRegex)) {
    keys.add(match[2]);
  }

  return keys;
}

export async function extractI18nKeysFromPackage(pkg: Project): Promise<Set<string>> {
  const files = await glob(path.join(pkg.rootDirRealPath, 'src/**/*.{ts,js}'));

  const fileKeysArr = await Promise.all(
    files.map(file => extractI18nKeysFromFile(file, pkg.manifest.name === 'i18n')),
  );
  return new Set(fileKeysArr.flatMap(set => [...set]));
}
