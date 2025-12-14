import { parseSfen } from 'shogiops/sfen';
import { parseUsi } from 'shogiops/util';
import type { Shogi } from 'shogiops/variant/shogi';
import type { Puzzle } from './interfaces';
import { getNow } from './util';

export default class CurrentPuzzle {
  line: Usi[];
  startAt: number;
  moveIndex = 0;
  pov: Color;

  constructor(
    readonly index: number,
    readonly puzzle: Puzzle,
  ) {
    this.line = puzzle.line.split(' ');
    this.pov = parseSfen('standard', puzzle.sfen, false).unwrap().turn;
    this.startAt = getNow();
  }

  position = (): Shogi => {
    const pos = parseSfen('standard', this.puzzle.sfen, false).unwrap() as Shogi;
    this.line.slice(0, this.moveIndex).forEach(usi => {
      pos.play(parseUsi(usi)!);
    });
    return pos;
  };

  expectedMove = (): string => this.line[this.moveIndex];

  lastMove = (): string => this.line[this.moveIndex - 1];

  isOver = (): boolean => this.moveIndex >= this.line.length - 1;
}
