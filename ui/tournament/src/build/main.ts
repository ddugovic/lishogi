import { Shogiground } from 'shogiground';
import { attributesModule, classModule, eventListenersModule, init } from 'snabbdom';
import { boot } from '../boot';
import makeCtrl from '../ctrl';
import type TournamentController from '../ctrl';
import type { TournamentOpts } from '../interfaces';
import view from '../view/main';

const patch = init([classModule, attributesModule, eventListenersModule]);

function main(opts: TournamentOpts): TournamentController {
  return boot(opts, start);
}

function start(opts: TournamentOpts): TournamentController {
  const element = document.querySelector('main.tour')!;

  opts.classes = element.getAttribute('class')!;
  opts.$side = $('.tour__side').clone();
  opts.$faq = $('.tour__faq').clone();
  opts.$desc = $('.tour__desc').clone();
  opts.playerManagmentButton = opts.$side.find('.manage-players')[0];
  opts.teamEditButton = opts.$side.find('.tour-team-edit')[0];

  const ctrl = new makeCtrl(opts, redraw);

  const blueprint = view(ctrl);
  element.innerHTML = '';
  let vnode = patch(element, blueprint);

  function redraw() {
    vnode = patch(vnode, view(ctrl));
  }

  return ctrl;
}

window.lishogi.registerModule(__bundlename__, main);

window.Shogiground = Shogiground;
