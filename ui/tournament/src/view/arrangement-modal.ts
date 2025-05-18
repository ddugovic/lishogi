import { flatpickr } from 'common/assets';
import { modal } from 'common/modal';
import { type MaybeVNode, bind } from 'common/snabbdom';
import { ids } from 'game/status';
import { i18n } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../ctrl';
import type { Arrangement, ArrangementUser } from '../interfaces';
import { flatpickrConfig, preloadUserTips, player as renderPlayer } from './util';

let fInstance: any = null;
let showCalendar = false;

export function arrangementModal(ctrl: TournamentController, a: Arrangement): VNode {
  const isFlipped = a.user1.id === ctrl.opts.userId;
  const users = isFlipped ? [a.user2, a.user1] : [a.user1, a.user2];

  return modal({
    class: 'arrangement__modal',
    onInsert(el) {
      preloadUserTips(el);
      el.addEventListener('mousedown', () => {
        if (fInstance) fInstance.close();
      });
    },
    onClose() {
      if (!fInstance?.isOpen) ctrl.showArrangement(undefined);
      if (hasMe(ctrl, a)) ctrl.arrangementMatch(a, false);
      showCalendar = false;
      ctrl.redraw();
    },
    content: [
      h('div.arr-modal', [
        h('div.arr-header', h('h3', a.name || i18n('tourArrangements:gameScheduling'))),
        h(
          'div.arr-users',
          users.map((u, i) =>
            playerSection(ctrl, a, u, action(ctrl, a, u), i === 0 ? 'top' : 'bottom'),
          ),
        ),
        totalSection(ctrl, a),
      ]),
    ],
  });
}

function playerSection(
  ctrl: TournamentController,
  a: Arrangement,
  user: ArrangementUser,
  action: MaybeVNode,
  pos: 'top' | 'bottom',
): VNode {
  const player = ctrl.data.standing.players.find(p => p.id === user.id)!;
  return h(`div.arr-user.arr-user-${pos}`, [
    h('div.arr-name', [
      renderPlayer(player, true, true),
      hasMe(ctrl, a) && player.id !== ctrl.opts.userId && !a.gameId
        ? h('a.user-button.message', {
            attrs: {
              href: `/inbox/${user.id}`,
              target: '_blank',
              title: i18n('chat'),
              'data-icon': 'c',
            },
          })
        : null,
      points(ctrl, a, user),
    ]),
    !ctrl.data.isFinished && !a.gameId && !a.locked
      ? h('div.arr-time.values', [
          h('div', [
            h('span.title', i18n('tourArrangements:suggestedTime')),
            h('span.value', formatDate(user.scheduledAt)),
          ]),
        ])
      : null,
    h('div.arr-action', action),
  ]);
}

function points(ctrl: TournamentController, a: Arrangement, user: ArrangementUser): MaybeVNode {
  if (a.status && a.status >= ids.mate) {
    const points = a.points || ctrl.defaultArrangementPoints;
    const isWinner = a.winner === user.id;
    const isLoser = a.winner && !isWinner;
    const userPoints = isWinner ? points.w : isLoser ? points.l : points.d;
    return h(`div.points${isWinner ? '.winner' : isLoser ? '.loser' : ''}`, userPoints);
  } else return;
}

function action(ctrl: TournamentController, a: Arrangement, user: ArrangementUser): MaybeVNode {
  const me = ctrl.opts.userId;
  const hasMe = a.user1.id === me || a.user2.id === me;
  if (!hasMe || ctrl.data.isFinished || a.gameId) return;
  else return user.id === me ? myActions(ctrl, a, user) : opponentActions(ctrl, a, user);
}

function myActions(ctrl: TournamentController, a: Arrangement, user: ArrangementUser): VNode {
  return h('div.actions.my-actions', [
    h(
      'button.button.text',
      {
        class: { pressed: showCalendar },
        hook: bind('click', () => {
          showCalendar = !showCalendar;
          // el.classList.toggle('none', !showCalendar);
          ctrl.redraw();
          const el = document.querySelector('.arr-calendar')!;
          if (showCalendar) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }),
        attrs: { 'data-icon': 'p' },
      },
      user.scheduledAt
        ? i18n('tourArrangements:suggestDifferentTime')
        : i18n('tourArrangements:suggestTime'),
    ),
    h('div.arr-calendar', { class: { none: !showCalendar } }, [
      h(
        'div.arr-calendar-wrap',
        h('input.flatpickr', {
          key: a.id,
          hook: {
            insert: (node: VNode) => {
              flatpickr().then(() => {
                fInstance = window.flatpickr(node.elm as HTMLInputElement, {
                  ...flatpickrConfig,
                  inline: true,
                  onChange: () => {
                    ctrl.redraw();
                  },
                });
                if (user.scheduledAt) {
                  const scheduledDate = new Date(user.scheduledAt);
                  fInstance.setDate(scheduledDate, false);
                  fInstance.altInput.value = scheduledDate.toLocaleString();
                }
              });
            },
            destroy: () => {
              if (fInstance) fInstance.destroy();
              fInstance = null;
            },
          },
        }),
      ),
      h('div.arr-calendar-buttons', [
        h(
          'button.button.button-green.text',
          {
            hook: bind('click', () => {
              showCalendar = false;
              ctrl.arrangementTime(a, fInstance.selectedDates[0]);
            }),
            class: {
              disabled: !fInstance || fInstance.selectedDates[0]?.getTime() === user.scheduledAt,
            },
            attrs: { 'data-icon': 'E' },
          },
          i18n('confirm'),
        ),
        h(
          'button.button.button-red.text',
          {
            hook: bind('click', () => {
              showCalendar = false;
              ctrl.arrangementTime(a, undefined);
              if (fInstance) fInstance.clear();
            }),
            class: {
              disabled: !user.scheduledAt,
            },
            attrs: { 'data-icon': 'L', title: i18n('reset') },
          },
          i18n('delete'),
        ),
      ]),
    ]),
  ]);
}

function opponentActions(
  ctrl: TournamentController,
  a: Arrangement,
  u: ArrangementUser,
): MaybeVNode {
  const disabled =
    !u.scheduledAt ||
    u.scheduledAt < new Date().getTime() + 60 * 60 * 1000 ||
    a.scheduledAt === u.scheduledAt;
  return !a.locked
    ? h('div.actions', [
        h(
          'button.button.text',
          {
            hook: bind('click', () => {
              showCalendar = false;
              ctrl.redraw();
              ctrl.arrangementTime(a, new Date(u.scheduledAt!));
            }),
            class: { disabled },
            attrs: { 'data-icon': 'p' },
          },
          i18n('tourArrangements:acceptSuggestedTime'),
        ),
      ])
    : null;
}

function totalSection(ctrl: TournamentController, a: Arrangement): VNode {
  const now = Date.now();
  const myArrangement = hasMe(ctrl, a);
  const meAndOpponent = myArrangement
    ? a.user1.id === ctrl.opts.userId
      ? [a.user1, a.user2]
      : [a.user2, a.user1]
    : undefined;
  const me = meAndOpponent?.[0];
  const opponent = meAndOpponent?.[1];

  const meReady = !!me?.readyAt && now - me.readyAt <= 20000;
  const opponentReady = !!opponent?.readyAt && now - opponent.readyAt <= 20000;

  return h('div.total-section', [
    h('div.values', [
      h('div', [
        h('span.title', i18n('tourArrangements:scheduledAt')),
        h('span.value', formatDate(a.scheduledAt)),
      ]),
      a.startedAt
        ? h('div', [
            h('span.title', i18n('tourArrangements:startedAt')),
            h('span.value', formatDate(a.startedAt)),
          ])
        : null,
      a.winner
        ? h('div', [
            h('span.title', i18n('winner')),
            h('span.value', ctrl.data.standing.players.find(p => p.id === a.winner)!.name),
          ])
        : null,
      a.points
        ? h('div', [
            h('span.title', i18n('tourArrangements:pointsWDL')),
            h('span.value', `${a.points.w}/${a.points.d}/${a.points.l}`),
          ])
        : null,
    ]),
    ctrl.isCreator() && ctrl.isOrganized()
      ? h(
          'button.button.edit-button',
          {
            hook: bind('click', () => {
              ctrl.showOrganizerArrangement(a);
              ctrl.showArrangement(undefined);
            }),
          },
          i18n('edit'),
        )
      : null,
    a.gameId
      ? h(
          'a.fbt.go-to-game',
          { attrs: { href: `/${a.gameId}` } },
          i18n('tourArrangements:goToGame'),
        )
      : !ctrl.data.isFinished && myArrangement
        ? h('div.arr-start-wrap', [
            h(
              'button.fbt',
              {
                attrs: {
                  title: meReady ? i18n('cancel') : i18n('tourArrangements:startGameNow'),
                },
                class: {
                  glowing: opponentReady,
                  'rubber-band': opponentReady,
                },
                hook: bind('click', () => {
                  ctrl.arrangementMatch(a, true);
                }),
              },
              h(
                'span',
                meReady ? i18n('waitingForOpponent') : i18n('tourArrangements:startGameNow'),
              ),
            ),
            h('span.help', i18n('tourArrangements:gameWillNotStart')),
          ])
        : null,
  ]);
}

function formatDate(dateNumber: number | undefined): VNode {
  const date = dateNumber ? new Date(dateNumber) : undefined;
  return date
    ? h(
        'span.date',
        {
          attrs: {
            title: date.toUTCString(),
          },
        },
        `${date.toLocaleString()}`,
      )
    : h('span.date', '-');
}

function hasMe(ctrl: TournamentController, a: Arrangement): boolean {
  return ctrl.opts.userId === a.user1.id || ctrl.opts.userId === a.user2.id;
}
