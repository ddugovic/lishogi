import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const dirname = path.dirname(import.meta.dirname);

function stripScope(packageName: string): string {
  if (packageName.startsWith('@')) return packageName.split('/')[1];
  else return packageName;
}

export async function copyLocalPackage(packageName: string, baseDistFolder: string): Promise<void> {
  const packagePath = path.join(dirname, 'assets', packageName);
  const nameNoScope = stripScope(packageName);
  const destinationPath = path.join(baseDistFolder, nameNoScope);

  await fs.mkdir(destinationPath, { recursive: true });
  await fs.cp(packagePath, destinationPath, { recursive: true });

  console.log(`Copied assets/${nameNoScope}`);
}

export async function copyVendorPackage(
  packageName: string,
  entries: string[],
  baseDistDir: string,
): Promise<void> {
  const nameNoScope = stripScope(packageName);
  const packagePath = path.join(dirname, 'node_modules', packageName);
  const destBase = path.join(baseDistDir, nameNoScope);

  await fs.mkdir(destBase, { recursive: true });

  for (const entry of entries) {
    const src = path.join(packagePath, entry);
    const dest = path.join(destBase, path.basename(entry));
    await fs.cp(src, dest, { recursive: true });
    console.log(`Copied ${packageName}: ${entry}`);
  }
}
