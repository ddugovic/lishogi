import { flatpickr } from 'common/assets';
import { bind, type MaybeVNode, type MaybeVNodes } from 'common/snabbdom';
import { i18n, i18nPluralSame } from 'i18n';
import { colorName } from 'shogi/color-name';
import { colors } from 'shogiground/constants';
import { opposite } from 'shogiground/util';
import { h, type VNode } from 'snabbdom';
import type TournamentController from '../../../ctrl';
import type { NewArrangement } from '../../../interfaces';
import header from '../../header';
import { arrangementHasUser, backControl, flatpickrConfig } from '../../util';
import { renderGames } from '../arrangements';

let fInstance: any = null;

export function arrangementFormView(ctrl: TournamentController): MaybeVNodes {
  return [
    header(ctrl),
    backControl(() => {
      ctrl.showOrganizerArrangement(undefined);
    }),
    arrangementFormWrap(ctrl),
  ];
}

function arrangementFormWrap(ctrl: TournamentController): MaybeVNode {
  if (!ctrl.newArrangement) return;

  return h(
    'div.organizer-arrangement-wrap',
    ctrl.data.standing.arrangements.length >= ctrl.data.maxGames! && !ctrl.newArrangement.id
      ? h('div.max-arrs', [
          'Maximum number of games reached: ',
          i18nPluralSame('nbGames', ctrl.data.standing.arrangements.length),
        ])
      : arrangementForm(ctrl, ctrl.newArrangement),
  );
}

const arrangementForm = (ctrl: TournamentController, state: NewArrangement): MaybeVNode => {
  const points = state.points;

  // modules/tournament/src/main/Format.scala
  const canSubmit = ctrl.data.standing.arrangements.length < 350;
  const isNew = !state.id;
  const hasGame = !!state.gameId;

  const user1Id = state.user1?.id;
  const user2Id = state.user2?.id;
  const gamesBetweenUsers =
    user1Id && user2Id
      ? ctrl.data.standing.arrangements.filter(
          a => arrangementHasUser(a, user1Id) && arrangementHasUser(a, user2Id),
        )
      : undefined;

  const updateState = <K extends keyof NewArrangement>(
    key: K,
    value: NewArrangement[K],
    redraw = false,
  ) => {
    state[key] = value;
    if (redraw) ctrl.redraw();
  };
  const updateStateWithValidity = <K extends keyof NewArrangement>(
    key: K,
    value: NewArrangement[K],
    elm: HTMLInputElement,
    redraw = false,
  ) => {
    if (elm.checkValidity()) updateState(key, value);

    if (redraw) ctrl.redraw();
  };
  const updatePoints = (key: 'w' | 'd' | 'l', elm: HTMLInputElement) => {
    const p = state.points || ctrl.defaultArrangementPoints;
    if (elm.checkValidity()) p[key] = Number.parseInt(elm.value) || 0;
    else elm.value = p[key].toString() || '';
    state.points = p;
  };

  const handleSubmit = () => {
    const arrangement = {
      id: state.id,
      user1: state.user1?.id,
      user2: state.user2?.id,
      name: state.name || undefined,
      color: state.color ? state.color === 'sente' : undefined,
      points: state.points ? `${state.points.l};${state.points.d};${state.points.w}` : undefined,
      scheduledAt: state.scheduledAt ? new Date(state.scheduledAt).getTime() : undefined,
    };
    ctrl.newArrangementSettings({
      points: state.points,
      scheduledAt: undefined,
    });
    ctrl.socket.send('arrangement-organizer', arrangement);
    ctrl.showOrganizerArrangement(undefined);
  };

  const handleDelete = () => {
    ctrl.socket.send('arrangement-delete', {
      id: state.id,
      users: `${state.user1?.id};${state.user2?.id}`,
    });
    ctrl.showOrganizerArrangement(undefined);
  };

  const u1Disabled = !isNew && !!state.origin?.user1?.id;
  const u2Disabled = !isNew && !!state.origin?.user2?.id;

  return h('div.organizer-arrangement', [
    state.id
      ? h('div.field-wrap.id', [
          h('label', 'ID'),
          h('input.disabled', {
            attrs: { disabled: true, value: state.id },
          }),
        ])
      : null,
    h('div.field-wrap.name', [
      h('label', i18n('tourArrangements:gameName')),
      h('input', {
        attrs: { type: 'text', value: state.name || '', maxlength: 30 },
        on: {
          input: (e: Event) => {
            const elm = e.target as HTMLInputElement;
            updateStateWithValidity('name', elm.value, elm);
          },
        },
      }),
    ]),
    h('div.field-wrap.players', [
      h('label', i18n('players')),
      h('span.vs', 'vs'),
      h('div.sides.search-wrap', [
        h(
          'select',
          {
            attrs: {
              disabled: u1Disabled,
            },
            class: {
              disabled: u1Disabled,
            },
            on: {
              change: (e: Event) => {
                updateState('user1', { id: (e.target as HTMLInputElement).value }, true);
              },
            },
          },
          playerOptions(ctrl, state.user1?.id, state.user2?.id),
        ),
        h(
          'select',
          {
            attrs: {
              disabled: u2Disabled,
            },
            class: {
              disabled: u2Disabled,
            },
            on: {
              change: (e: Event) => {
                updateState('user2', { id: (e.target as HTMLInputElement).value }, true);
              },
            },
          },
          playerOptions(ctrl, state.user2?.id, state.user1?.id),
        ),
      ]),
      h('div.sides.color-wrap', [
        h(
          'select',
          {
            key: state.color,
            class: {
              disabled: hasGame,
            },
            attrs: { value: state.color || '', disabled: hasGame },
            on: {
              change: (e: Event) =>
                updateState(
                  'color',
                  (e.target as HTMLInputElement).value as Color | undefined,
                  true,
                ),
            },
          },
          colorOptions(state.color, false),
        ),
        h(
          'select',
          {
            key: state.color,
            class: {
              disabled: hasGame,
            },
            attrs: { value: state.color ? opposite(state.color) : '', disabled: hasGame },
            on: {
              change: (e: Event) =>
                updateState(
                  'color',
                  (e.target as HTMLInputElement).value as Color | undefined,
                  true,
                ),
            },
          },
          colorOptions(state.color, true),
        ),
      ]),
    ]),
    h('div.field-wrap.points', [
      h(
        'label',
        {
          attrs: {
            title: `${i18n('victory')}/${i18n('draw')}/${i18n('defeat')}`,
          },
        },
        i18n('tourArrangements:pointsWDL'),
      ),
      h('div.points-wrap', [
        h('input', {
          class: {
            disabled: hasGame,
          },
          attrs: {
            type: 'text',
            disabled: hasGame,
            inputmode: 'numberic',
            pattern: '[0-9]*',
            value: points?.w || ctrl.defaultArrangementPoints.w,
          },
          on: { input: (e: Event) => updatePoints('w', e.target as HTMLInputElement) },
        }),
        h('input', {
          class: {
            disabled: hasGame,
          },
          attrs: {
            type: 'text',
            disabled: hasGame,
            inputmode: 'numberic',
            pattern: '[0-9]*',
            value: points?.d || ctrl.defaultArrangementPoints.d,
          },
          on: { input: (e: Event) => updatePoints('d', e.target as HTMLInputElement) },
        }),
        h('input', {
          class: {
            disabled: hasGame,
          },
          attrs: {
            type: 'text',
            disabled: hasGame,
            inputmode: 'numberic',
            pattern: '[0-9]*',
            value: points?.l || ctrl.defaultArrangementPoints.l,
          },
          on: { input: (e: Event) => updatePoints('l', e.target as HTMLInputElement) },
        }),
      ]),
    ]),
    h('div.field-wrap.scheduled-at', [
      h('label', i18n('tourArrangements:scheduledAt')),
      h('input.flatpickr', {
        class: {
          disabled: hasGame,
        },
        attrs: {
          disabled: hasGame,
          placeholder: i18n('search:date'),
        },
        hook: {
          insert: (node: VNode) => {
            flatpickr().then(() => {
              fInstance = window.flatpickr(node.elm as HTMLInputElement, {
                ...flatpickrConfig,
                maxDate: ctrl.dateToFinish,
                onChange: dates => {
                  state.scheduledAt = dates[0].getTime();
                  ctrl.redraw();
                },
              });
              if (state.scheduledAt) {
                const scheduledDate = new Date(state.scheduledAt);
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
    ]),
    h('div.button-wrap', [
      h(
        'button.button',
        {
          hook: bind('click', () => handleSubmit()),
          class: { disabled: !canSubmit },
        },
        isNew ? i18n('createAGame') : i18n('save'),
      ),
      !isNew
        ? h(
            'button.button.button-red',
            {
              class: {
                disabled: !hasGame || !!ctrl.data.isFinished,
              },
              hook: bind('click', () => {
                if (
                  confirm(`${i18n('tourArrangements:annulResults')} - ${i18n('notReversible')}`)
                ) {
                  ctrl.annulGame(state.id!, state.gameId);
                }
              }),
            },
            i18n('tourArrangements:annulResults'),
          )
        : null,
      !isNew
        ? h(
            'button.button.button-red',
            {
              class: {
                disabled: hasGame || !!ctrl.data.isFinished,
              },
              hook: bind('click', () => handleDelete()),
            },
            i18n('delete'),
          )
        : null,
    ]),
    isNew && gamesBetweenUsers
      ? h('div.games-users-wrap', [
          h('h3', i18n('tourArrangements:existingGamesBetweenPlayers')),
          gamesBetweenUsers.length
            ? renderGames(ctrl, gamesBetweenUsers)
            : h('div.no-game', i18n('noGameFound')),
        ])
      : null,
  ]);
};

function colorOptions(stateColor: Color | undefined, flip: boolean) {
  return [
    h('option', { attrs: { value: '', selected: !stateColor } }, i18n('randomColor')),
    ...colors.map(color => {
      const realColor = flip ? opposite(color) : color;
      return h(
        'option',
        { attrs: { value: realColor, selected: stateColor === realColor } },
        colorName(color, false),
      );
    }),
  ];
}

function playerOptions(
  ctrl: TournamentController,
  selectedUserId: string | undefined,
  otherUserId: string | undefined,
) {
  return [
    h('option', { attrs: { value: '', selected: !selectedUserId } }),
    ...ctrl.data.standing.players.map(player => {
      return h(
        'option',
        {
          attrs: {
            value: player.id,
            selected: player.id === selectedUserId,
            disabled: player.id === otherUserId,
          },
        },
        player.name,
      );
    }),
  ];
}
