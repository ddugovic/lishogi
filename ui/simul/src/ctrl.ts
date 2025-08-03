import { idleTimer } from 'common/timings';
import type { Applicant, SimulData, SimulOpts } from './interfaces';
import { type SimulSocket, makeSocket } from './socket';
import xhr from './xhr';

export default class SimulCtrl {
  data: SimulData;
  socket: SimulSocket;
  loader?: string;

  constructor(
    readonly opts: SimulOpts,
    readonly redraw: Redraw,
  ) {
    this.data = opts.data;
    this.socket = makeSocket(opts.socketSend, this);
    if (this.createdByMe() && this.data.isCreated) this.setupCreatedHost();
  }

  private setupCreatedHost = () => {
    window.lishogi.storage.set('lishogi.move_on', '1'); // hideous hack :D
    let hostIsAround = true;
    idleTimer(
      15 * 60 * 1000,
      () => {
        hostIsAround = false;
      },
      () => {
        hostIsAround = true;
      },
    );
    setInterval(() => {
      if (this.data.isCreated && hostIsAround) xhr.ping(this.data.id);
    }, 10 * 1000);
  };

  reload = (data: SimulData): void => {
    this.data = {
      ...data,
      team: this.data.team, // reload data does not contain the team anymore
    };
    this.loader = undefined;
  };

  clear = (): void => {
    this.loader = undefined;
    this.redraw();
  };

  teamBlock = (): boolean => !!this.data.team && !this.data.team.isIn;
  createdByMe = (): boolean => this.opts.userId === this.data.host.id;
  candidates = (): Applicant[] => this.data.applicants.filter(a => !a.accepted);
  accepted = (): Applicant[] => this.data.applicants.filter(a => a.accepted);
  acceptedContainsMe = (): boolean => this.accepted().some(a => a.player.id === this.opts.userId);
  applicantsContainsMe = (): boolean =>
    this.candidates().some(a => a.player.id === this.opts.userId);
  containsMe = (): boolean =>
    !!this.opts.userId &&
    (this.applicantsContainsMe() || this.acceptedContainsMe() || this.pairingsContainMe());
  pairingsContainMe = (): boolean => this.data.pairings.some(a => a.player.id === this.opts.userId);
}
