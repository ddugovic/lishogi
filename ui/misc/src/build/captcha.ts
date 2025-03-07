import * as domData from 'common/data';
import { initOneWithState } from 'common/mini-board';
import { reverse } from 'common/string';
import type { Api as ShogigroundApi } from 'shogiground/api';
import * as compat from 'shogiops/compat';
import { parseSfen } from 'shogiops/sfen';
import type { Role } from 'shogiops/types';
import { toBW } from 'shogiops/util';
import * as util from 'shogiops/variant/util';

const readServerValue = (t: string): string => atob(reverse(t));

window.lishogi.ready.then(() => {
  setTimeout(() => {
    document.querySelectorAll('div.captcha').forEach((captchaEl: HTMLElement) => {
      const board = captchaEl.querySelector<HTMLElement>('.mini-board')!;
      const hint = readServerValue(board.dataset.x!) as Key;
      const orientation = readServerValue(board.dataset.y!) as Color;
      const sfen = readServerValue(board.dataset.z!);
      initOneWithState(board, {
        variant: 'minishogi',
        sfen,
        orientation,
        playable: true,
        noHands: true,
      });
      const sg = domData.get<ShogigroundApi>(board, 'shogiground')!;

      const input = captchaEl.querySelector<HTMLInputElement>('input')!;
      input.value = '';

      const fullSfen = `${sfen} ${toBW(orientation)}`;
      const pos = parseSfen('minishogi', fullSfen, false);
      const dests = pos.isOk ? compat.shogigroundMoveDests(pos.value) : new Map();

      sg.set({
        activeColor: sg.state.orientation,
        turnColor: sg.state.orientation,
        movable: {
          free: pos.isErr,
          dests,
          events: {
            after: (orig: Key, dest: Key) => {
              captchaEl.classList.remove('success', 'failure');
              submit(`${orig}${dest}`);
            },
          },
        },
        hands: {
          inlined: false,
        },
      });

      const submit = (solution: string) => {
        input.value = solution;
        window.lishogi.xhr
          .text('GET', captchaEl.dataset.checkUrl!, { url: { solution } })
          .then(data => {
            const isSuccess = data == '1';
            captchaEl.classList.add(isSuccess ? 'success' : 'failure');
            if (isSuccess) {
              sg.setSquareHighlights([]);

              const key = solution.slice(2, 4) as Key;
              const piece = sg.state.pieces.get(key)!;
              const sfenStr = `${sg.getBoardSfen()} ${piece.color === 'sente' ? ' w' : ' b'}`;
              const pos = parseSfen('minishogi', sfenStr, false);
              if (pos.isOk && !pos.value.isCheckmate()) {
                sg.setPieces(
                  new Map([
                    [
                      key,
                      {
                        color: piece.color,
                        role: util.promote('minishogi')(piece.role as Role) || piece.role,
                        promoted: true,
                      },
                    ],
                  ]),
                );
              }
              sg.stop();
            } else
              setTimeout(() => {
                sg.set({
                  sfen: {
                    board: sfen,
                  },
                  turnColor: sg.state.orientation,
                  movable: {
                    dests: dests,
                  },
                });
                sg.setSquareHighlights([{ key: hint, className: 'help' }]);
              }, 300);
          });
      };
    });
  });
});
