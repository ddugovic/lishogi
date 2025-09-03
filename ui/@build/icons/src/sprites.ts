import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import SVGSpriter from 'svg-sprite';

interface CompileResult {
  [mode: string]: {
    [resource: string]: {
      path: string;
      contents: Buffer | string;
    };
  };
}

async function generateSprite(categ: string, assetsDir: string, baseDestDir: string) {
  const config: SVGSpriter.Config = {
    dest: baseDestDir,
    mode: {
      symbol: {
        dest: '.',
        sprite: `${categ}.svg`,
        example: false,
      },
    },
  };

  const spriter = new SVGSpriter(config);
  const dir = path.join(assetsDir, categ);

  let userList: string[] = [];

  readdirSync(dir).forEach(file => {
    if (file.endsWith('.svg')) {
      const fullPath = path.join(dir, file);
      spriter.add(fullPath, file, readFileSync(fullPath, 'utf-8'));
      if (!file.startsWith('li-')) userList.push(path.basename(file, '.svg'));
    }
  });

  writeFileSync(path.join(baseDestDir, `${categ}.txt`), userList.join('\n'));

  return new Promise<void>((resolve, reject) => {
    spriter.compile((error: any, result: CompileResult) => {
      if (error) return reject(error);

      for (const mode in result) {
        for (const resource in result[mode]) {
          writeFileSync(result[mode][resource].path, result[mode][resource].contents);
          console.log(`Wrote ${result[mode][resource].path}...`);
        }
      }
      resolve();
    });
  });
}

export async function sprites(destDir: string, categs: string[]): Promise<void> {
  const assetsDir = path.join(import.meta.dirname, '../assets');

  for (const categ of categs) {
    await generateSprite(categ, assetsDir, destDir);
  }

  console.log('All SVG sprites created!');
}
