import fs from 'node:fs/promises';
import path from 'node:path';
import { getPackageFromPath, type Project } from '@build/helpers/workspace-packages';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcss from 'postcss';
import * as sass from 'sass-embedded';

interface Builder {
  build: (filepath: string) => Promise<void>;
  stop: () => Promise<void>;
}

export async function createBuilder(
  rootDir: string,
  pkgs: Project[],
  outdir: string,
): Promise<Builder> {
  const isProd = process.argv.includes('--prod');

  const sassOptions: sass.Options<'async'> = {
    style: 'expanded',
    sourceMap: !isProd,
    loadPaths: [''].map(p => path.join(rootDir, p)),
    importers: [new sass.NodePackageImporter()],
  };
  const compiler = await sass.initAsyncCompiler();

  const postCssPlugins: postcss.AcceptedPlugin[] = !isProd
    ? [autoprefixer({ remove: false })]
    : [
        autoprefixer({ remove: false }),
        cssnano({
          preset: [
            'default',
            {
              normalizeWhitespace: isProd,
              colormin: { precision: 3 },
              discardComments: { removeAll: isProd },
              calc: false,
            },
          ],
        }),
      ];
  const processor = postcss(postCssPlugins);

  return {
    build: async filepath => {
      const sassResult = await compiler.compileAsync(filepath, sassOptions);
      const postCssResult = await processor.process(sassResult.css, { from: filepath });

      for (const warning of postCssResult.warnings()) {
        console.warn(warning.toString());
      }

      const pkg = getPackageFromPath(pkgs, filepath)!;
      const basename = path.basename(filepath, '.scss');
      const name = basename === 'main' ? pkg.manifest.name : `${pkg.manifest.name}.${basename}`;
      const outputPath = path.join(outdir, `${name}.${isProd ? 'min' : 'dev'}.css`);

      let res = postCssResult.css;
      if (!isProd && sassResult.sourceMap)
        res = res + '\n'.repeat(2) + createSourceMap(sassResult.sourceMap);

      await fs.writeFile(outputPath, res);
    },
    stop: async () => {
      await compiler.dispose();
    },
  };
}

function createSourceMap(sourceMap: Exclude<sass.CompileResult['sourceMap'], undefined>): string {
  const sm = JSON.stringify(sourceMap);
  const smBase64 = (Buffer.from(sm, 'utf8') || '').toString('base64');
  return `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${smBase64} */`;
}
