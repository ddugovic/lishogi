import * as game from 'game';
import { finished } from 'game/status';
import type RoundController from './ctrl';
import * as xhr from './xhr';

export default class MoveOn {
  private storage = window.lishogi.storage.makeBoolean(this.key);

  constructor(
    private ctrl: RoundController,
    private key: string,
  ) {}

  toggle = (): void => {
    this.storage.toggle();
    this.next(true);
  };

  get: () => boolean = this.storage.get;

  private redirect = (href: string) => {
    this.ctrl.setRedirecting();
    window.lishogi.properReload = true;
    window.location.href = href;
  };

  next = (force?: boolean): void => {
    const d = this.ctrl.data;
    if (
      (!d.simul && finished(d)) ||
      d.player.spectator ||
      !game.isSwitchable(d) ||
      game.isPlayerTurn(d) ||
      !this.get() ||
      !document.querySelector('.round__now-playing') // no other game currently played
    )
      return;
    if (force) this.roundNext();
    else if (d.simul) {
      if (d.simul.hostId === this.ctrl.opts.userId && d.simul.nbPlaying > 1) {
        if (this.ctrl.simulPlayerMoved) this.roundNext();
        else this.whatsNext(); // probably not even necessary
      }
    } else this.whatsNext();
  };

  private roundNext = (): void => {
    this.redirect(`/round-next/${this.ctrl.data.game.id}`);
  };

  private whatsNext = (): void => {
    xhr.whatsNext(this.ctrl).then(data => {
      if (data.next) this.redirect(`/${data.next}`);
    });
  };
}
