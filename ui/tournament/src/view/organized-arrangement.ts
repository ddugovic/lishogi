import { flatpickr } from 'common/assets';
import { type MaybeVNode, type MaybeVNodes, bind } from 'common/snabbdom';
import { i18n, i18nPluralSame } from 'i18n';
import { colorName } from 'shogi/color-name';
import { colors } from 'shogiground/constants';
import { opposite } from 'shogiground/util';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../ctrl';
import type { Arrangement, NewArrangement } from '../interfaces';
import { arrangementLine } from './arrangement';
import { backControl } from './controls';
import header from './header';
import { arrangementHasUser, flatpickrConfig } from './util';

let fInstance: any = null;

export function organizedArrangementView(ctrl: TournamentController): MaybeVNodes {
  return [
    header(ctrl),
    backControl(() => {
      ctrl.showOrganizerArrangement(undefined);
    }),
    organizerArrangement(ctrl),
  ];
}

function organizerArrangement(ctrl: TournamentController): MaybeVNode {
  const state = ctrl.newArrangement;
  if (!state) return;

  return h(
    'div.organizer-arrangement-wrap',
    ctrl.data.standing.arrangements.length >= ctrl.data.maxGames! && !state.id
      ? h('div.max-arrs', [
          'Maximum number of games reached: ',
          i18nPluralSame('nbGames', ctrl.data.standing.arrangements.length),
        ])
      : organizerArrangementForm(ctrl, state),
  );
}

const organizerArrangementForm = (
  ctrl: TournamentController,
  state: Partial<Arrangement>,
): MaybeVNode => {
  const points = state.points;

  const canSubmit = state.user1?.id && state.user2?.id;
  const isNew = !state.id;
  const hasGame = !!state.gameId;

  const user1Id = state.user1?.id;
  const user2Id = state.user2?.id;
  const gamesBetweenUsers =
    user1Id && user2Id
      ? ctrl.data.standing.arrangements.filter(
          a => arrangementHasUser(a, user1Id) && arrangementHasUser(a, user2Id),
        )
      : [];

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
      id: state.id || 'new', // new id forces creation of new arrangement
      users: `${state.user1?.id};${state.user2?.id}`,
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
      h('label', `${i18n('players')}*`),
      h('span.vs', 'vs'),
      h('div.sides.search-wrap', [
        h(
          'select',
          {
            attrs: {
              disabled: !isNew,
            },
            class: {
              disabled: !isNew,
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
              disabled: !isNew,
            },
            class: {
              disabled: !isNew,
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
                disabled: hasGame,
              },
              hook: bind('click', () => handleDelete()),
            },
            i18n('delete'),
          )
        : null,
    ]),
    gamesBetweenUsers.length && isNew
      ? h('div.games-users-wrap', [
          h('div.arrs-list-wrap', [
            h('h2.arrs-title', i18n('tourArrangements:existingGamesBetweenPlayers')),
            h(
              'div.arrs-list',
              gamesBetweenUsers.map(g => arrangementLine(ctrl, g)),
            ),
          ]),
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
    h('option', { attrs: { value: '', disabled: true, hidden: true, selected: !selectedUserId } }),
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
