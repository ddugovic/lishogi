import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import {
  findWorkspacePackages,
  type Project as OriginalProject,
} from '@pnpm/workspace.find-packages';

export type Project = OriginalProject & {
  manifest: OriginalProject['manifest'] & { name: string };
};

export async function getRootDir(): Promise<string> {
  const root = await findWorkspaceDir(process.cwd());
  return root!;
}

export async function getPackages(rootDir: string): Promise<Project[]> {
  const allPackages = (await findWorkspacePackages(rootDir)) as Project[];
  return allPackages.filter(
    pkg => !pkg.manifest.name.includes('@') && pkg.rootDirRealPath !== rootDir,
  );
}

export function getPackageFromPath(pkgs: Project[], filepath: string): Project | undefined {
  return pkgs.find(p => filepath.startsWith(`${p.rootDirRealPath}/`));
}
