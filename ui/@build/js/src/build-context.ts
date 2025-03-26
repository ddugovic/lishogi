import path from 'node:path';
import { glob } from '@build/helpers/glob';
import type { Project } from '@build/helpers/workspace-packages';
import { type BuildContext, context } from 'esbuild';

export async function createBuildContexts(pkg: Project, outdir: string): Promise<BuildContext[]> {
  const allEntries: string[] = await glob(path.join(pkg.rootDirRealPath, 'src', 'build', '*.ts'));
  return Promise.all(allEntries.map(entry => createBuildContext(pkg, entry, outdir)));
}

function createBuildContext(
  pkg: Project,
  entryPoint: string,
  outdir: string,
): Promise<BuildContext> {
  const isProd = process.argv.includes('--prod');
  const fileName = path.basename(entryPoint, '.ts');
  const packageName = pkg.manifest.name;
  const name = fileName === 'main' ? packageName : `${packageName}.${fileName}`;
  const lishogiName = `lishogi.${name}`;
  const ext = isProd ? '.min.js' : '.js';

  return context({
    entryPoints: [entryPoint],
    absWorkingDir: pkg.rootDirRealPath,
    bundle: true,
    target: 'es2017', // todo
    format: 'iife',
    charset: 'utf8',
    sourcemap: undefined,
    minify: isProd,
    legalComments: 'none',
    define: { __bundlename__: `"${moduleName(name)}"` },
    outfile: `${outdir}/${lishogiName}${ext}`,
  });
}

function moduleName(input: string): string {
  return input
    .split(/[\.-]/)
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}
