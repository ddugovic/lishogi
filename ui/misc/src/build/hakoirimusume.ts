import { SlidingPuzzles } from '@liskadan/sliding-puzzles';
import type { Situation } from '@liskadan/sliding-puzzles/situations';
import { i18nPluralSame } from 'i18n';

function solution(s: Situation): boolean {
  return s.pieces.find(p => p.name === 'K')!.position === 13;
}

function win(s: Situation): void {
  setTimeout(() => {
    const wscreen = document.createElement('div');
    wscreen.classList.add('win');
    s.elements.main.appendChild(wscreen);
  }, 50);
}

function updateMoveCnt(nb: number): void {
  const mcnt = document.getElementById('move-cnt');
  if (mcnt) mcnt.innerHTML = i18nPluralSame('nbMoves', nb);
}

function move(s: Situation): void {
  updateMoveCnt(s.moves);
}

function startPuzzle(): void {
  updateMoveCnt(0);

  SlidingPuzzles(
    document.getElementById('game')!,
    'G1 K K G2/G1 K K G2/B S S R/B N L R/ P1 . . P2',
    {
      solution: solution,
      onVictory: win,
      onMove: move,
    },
  );
}

window.lishogi.ready.then(() => {
  const btn = document.getElementById('reset') as HTMLButtonElement;
  btn.onclick = startPuzzle;
  startPuzzle();
});
