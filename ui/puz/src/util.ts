import { parseSfen } from 'shogiops/sfen';
import type { Puzzle } from './interfaces';

export const getNow = (): number => Math.round(performance.now());

export const puzzlePov = (puzzle: Puzzle): Color =>
  parseSfen('standard', puzzle.sfen, false).unwrap().turn;
