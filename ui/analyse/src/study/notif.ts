import { type VNode, h } from 'snabbdom';

interface Notif {
  duration: number;
  text: string;
  class?: string;
}

export interface NotifCtrl {
  set(n: Notif): void;
  get(): Notif | undefined;
}

export function ctrl(redraw: () => void): NotifCtrl {
  let current: Notif | undefined;
  let timeout: number;
  return {
    set(n: Notif) {
      clearTimeout(timeout);
      current = n;
      timeout = setTimeout(() => {
        current = undefined;
        redraw();
      }, n.duration);
    },
    get: () => current,
  };
}

export function view(ctrl: NotifCtrl): VNode | undefined {
  const c = ctrl.get();
  return c ? h(`div.notif.${c.class}`, c.text) : undefined;
}
