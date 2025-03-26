import fg, { type Options, type Pattern } from 'fast-glob';

export function glob(source: Pattern | Pattern[], options?: Options): Promise<string[]> {
  return fg(source, {
    absolute: true,
    ignore: ['**/node_modules/**'],
    ...options,
  });
}
