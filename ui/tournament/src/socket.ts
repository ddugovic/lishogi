import type TournamentController from './ctrl';
import type { Arrangement } from './interfaces';

export interface TournamentSocket {
  send: Socket.Send;
  receive(type: string, data: any): void;
}

export default function (send: Socket.Send, ctrl: TournamentController): TournamentSocket {
  const handlers: Record<string, any> = {
    reload() {
      ctrl.askReload();
    },
    redirect(fullId: string) {
      ctrl.redirectFirst(fullId.slice(0, 8), true);
      return true;
    },
    arrangement(arr: Arrangement) {
      const f: (a: Arrangement) => boolean = ctrl.isRobin()
        ? a => {
            return users.includes(a.user1.id) && users.includes(a.user2.id);
          }
        : a => {
            return a.id === arr.id;
          };
      const users = [arr.user1.id, arr.user2.id];
      const index = ctrl.data.standing.arrangements.findIndex(a => f(a));

      if (index !== -1) ctrl.data.standing.arrangements[index] = arr;
      else ctrl.data.standing.arrangements.push(arr);

      if (
        ctrl.arrangement &&
        users.includes(ctrl.arrangement.user1.id) &&
        users.includes(ctrl.arrangement.user2.id)
      ) {
        if (
          ctrl.arrangement.user1.readyAt !== arr.user1.readyAt ||
          ctrl.arrangement.user2.readyAt !== arr.user2.readyAt
        ) {
          ctrl.arrangementReadyRedraw(arr);
        }

        ctrl.arrangement = arr;
      }

      ctrl.redraw();
    },
  };

  return {
    send,
    receive(type: string, data: any) {
      if (handlers[type]) return handlers[type](data);
      return false;
    },
  };
}
