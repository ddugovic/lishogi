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
    reloadFull() {
      ctrl.askFullReload();
    },
    redirect(url: string) {
      const id = url.startsWith('challenge') ? url : url.slice(0, 8);
      ctrl.redirectFirst(id, true);
      return true;
    },
    arrangement(arr: Arrangement) {
      const users = [arr.user1?.id, arr.user2?.id];
      const index = ctrl.data.standing.arrangements.findIndex(a => a.id === arr.id);

      if (index !== -1) {
        ctrl.data.standing.arrangements[index] = arr;
      } else ctrl.data.standing.arrangements.push(arr);

      if (
        (ctrl.arrangement &&
          !ctrl.arrangement.id &&
          users.includes(ctrl.arrangement.user2?.id) &&
          users.includes(ctrl.arrangement.user1?.id)) ||
        (ctrl.arrangement && ctrl.arrangement.id === arr.id)
      )
        ctrl.arrangement = arr;

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
