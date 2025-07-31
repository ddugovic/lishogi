import type TournamentController from './ctrl';
import type { TournamentOpts } from './interfaces';

export function boot(
  opts: TournamentOpts,
  start: (opts: TournamentOpts) => TournamentController,
): TournamentController {
  $('body').data('tournament-id', opts.data.id);
  let ctrl: TournamentController | undefined = undefined;
  window.lishogi.socket = new window.lishogi.StrongSocket(
    `/tournament/${opts.data.id}/socket/v4`,
    opts.data.socketVersion!,
    {
      receive: (t: string, d: any) => ctrl?.socket.receive(t, d),
    },
  );
  opts.socketSend = window.lishogi.socket.send;
  ctrl = start(opts);

  if (opts.playerManagementButton) {
    opts.playerManagementButton.addEventListener('click', () => {
      ctrl.playerManagement = !ctrl.playerManagement;
      ctrl.redraw();
    });
  }

  return ctrl;
}
