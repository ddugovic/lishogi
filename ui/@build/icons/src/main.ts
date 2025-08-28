import { font } from './font.js';
import { sprites } from './sprites.js';

const svgSpriteCategs = ['study', 'tour'];

async function main() {
  await sprites(svgSpriteCategs);
  await font();
}

await main();
