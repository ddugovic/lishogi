import vm from 'node:vm';

export function isValidJs(code: string): boolean {
  try {
    new vm.Script(code);
    return true;
  } catch {
    return false;
  }
}
