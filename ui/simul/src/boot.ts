import { wsConnect } from 'common/ws';
import type SimulCtrl from './ctrl';
import type { SimulOpts } from './interfaces';

export function boot(opts: SimulOpts, start: (opts: SimulOpts) => SimulCtrl): SimulCtrl {
  $('body').data('simul-id', opts.data.id);

  let ctrl: SimulCtrl | undefined = undefined;
  opts.socketSend = wsConnect(`/simul/${opts.data.id}/socket/v4`, opts.socketVersion, {
    receive: (t: string, d: any) => {
      ctrl?.socket.receive(t, d);
    },
  }).send;
  opts.$side = $('.simul__side').clone();

  ctrl = start(opts);

  return ctrl;
}
