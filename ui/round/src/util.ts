import type { Result } from '@badrap/result';
import type * as sg from 'shogiground/types';
import { shogigroundDropDests, shogigroundMoveDests } from 'shogiops/compat';
import type { SquareName } from 'shogiops/types';
import { makePieceName, makeSquareName } from 'shogiops/util';
import type { Position } from 'shogiops/variant/position';
import { fullSquareSet, handRoles } from 'shogiops/variant/util';
import type { VNodeData } from 'snabbdom';

export { bind, onInsert } from 'common/snabbdom';

export function justIcon(icon: string): VNodeData {
  return {
    attrs: { 'data-icon': icon },
  };
}
export function getMoveDests(posRes: Result<Position>, illegal: boolean): sg.MoveDests {
  return posRes.unwrap(
    p => (illegal ? allMoveDests(p) : shogigroundMoveDests(p)),
    _ => new Map(),
  );
}

export function getDropDests(posRes: Result<Position>, illegal: boolean): sg.DropDests {
  return posRes.unwrap(
    p => (illegal ? allDropDests(p) : shogigroundDropDests(p)),
    _ => new Map(),
  );
}

function wholeBoardDests(pos: Position): SquareName[] {
  const wholeBoard = fullSquareSet(pos.rules).diff(pos.board.color(pos.turn));
  return Array.from(wholeBoard, s => makeSquareName(s));
}

function allMoveDests(pos: Position): sg.MoveDests {
  const wb = wholeBoardDests(pos);
  const result: sg.MoveDests = new Map();

  for (const square of pos.board.color(pos.turn)) {
    result.set(makeSquareName(square), wb);
  }

  return result;
}

function allDropDests(pos: Position): sg.DropDests {
  const wb = wholeBoardDests(pos);
  const result: sg.DropDests = new Map();

  for (const role of handRoles(pos.rules)) {
    const piece = { color: pos.turn, role };
    if (pos.hands[pos.turn].get(role) > 0) {
      result.set(makePieceName(piece), wb);
    } else result.set(makePieceName(piece), []);
  }

  return result;
}
