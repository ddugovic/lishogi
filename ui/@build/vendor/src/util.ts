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
  fileNames: string[],
  baseDistFolder: string,
): Promise<void> {
  const nameNoScope = stripScope(packageName);
  const packagePath = path.join(dirname, 'node_modules', packageName);

  await fs.mkdir(path.join(baseDistFolder, nameNoScope), { recursive: true });

  for (const fileName of fileNames) {
    const sourceFilePath = path.join(packagePath, fileName);
    const destinationFilePath = path.join(
      path.join(baseDistFolder, nameNoScope),
      path.basename(fileName),
    );

    await fs.copyFile(sourceFilePath, destinationFilePath);

    console.log(`Copied ${packageName}`);
  }
}
