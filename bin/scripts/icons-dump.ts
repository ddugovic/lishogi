import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

function toCamelCase(str: string): string {
  return str
    .split(/[_\-\s]+/)
    .map((part, i) =>
      i === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join('');
}

function formatScalaChar(cp: number): string {
  return `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

async function main(): Promise<void> {
  const baseFolder = path.dirname(execSync('pnpm root -w').toString());
  const codepointsFile = path.join(baseFolder, 'ui/@build/icons/codepoints.json');
  const outputFile = path.join(baseFolder, 'modules/common/src/main/Icons.scala');

  const codepoints: Record<string, number> = JSON.parse(fs.readFileSync(codepointsFile, 'utf8'));

  const entries = Object.entries(codepoints).toSorted();

  const scalaLines = [
    '// Generated with bin/icons-dump.ts',
    'package lila.common',
    '// format: off',
    'object Icons {',
  ];
  for (const [name, cp] of entries) {
    const key = toCamelCase(name);
    scalaLines.push(`  val ${key} = "${formatScalaChar(cp)}"`);
  }
  scalaLines.push('}\n');
  fs.writeFileSync(outputFile, scalaLines.join('\n'), 'utf8');

  console.error('Scala icons updated!');
}

await main();
