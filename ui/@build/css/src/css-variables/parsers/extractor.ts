import * as fs from 'node:fs/promises';
import { prefix } from '../constants.js';

export async function extractFromFile(file: string): Promise<Set<string>> {
  const found = new Set<string>();

  const content = await fs.readFile(file, 'utf-8');
  const regex = new RegExp(`\\$${prefix}[\\w-]{2,}_(?:neg)?\\d+`, 'g');
  const matches: string[] = content.match(regex) || [];

  matches.forEach(match => {
    found.add(match.slice(1));
  });

  return found;
}
