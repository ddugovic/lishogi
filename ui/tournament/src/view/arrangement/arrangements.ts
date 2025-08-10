import { bind } from 'common/snabbdom';
import { ids } from 'game/status';
import { i18n, i18nVdom } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../../ctrl';
import type { Arrangement } from '../../interfaces';
import { playerName } from '../util';

const maxlength = 15;

let expanded = false;
export function arrangements(ctrl: TournamentController): VNode {
  const upcomingOngoing = ctrl.data.standing.arrangements.filter(
    arr => !arr.status || arr.status < ids.mate,
  );
  const finished = ctrl.data.standing.arrangements.filter(
    arr => arr.status && arr.status >= ids.mate,
  );

  const myUpcoming = upcomingOngoing.filter(arr => ctrl.arrangementHasMe(arr));
  const othersUpcoming = upcomingOngoing.filter(
    arr => !ctrl.arrangementHasMe(arr) && (!!arr.scheduledAt || !!arr.gameId || ctrl.isOrganized()),
  );

  const sortByScheduledAt = (arrs: Arrangement[]) =>
    arrs.sort((a, b) => {
      if (!a.scheduledAt && !b.scheduledAt) return 0;
      if (!a.scheduledAt) return 1;
      if (!b.scheduledAt) return -1;
      return a.scheduledAt - b.scheduledAt;
    });

  const sortedFinished = finished.sort((a, b) => {
    if (!a.startedAt && !b.startedAt) return 0;
    if (!a.startedAt) return 1;
    if (!b.startedAt) return -1;
    return b.startedAt - a.startedAt;
  });

  const sortedScheduled = [...sortByScheduledAt(myUpcoming), ...sortByScheduledAt(othersUpcoming)];

  const arrs = ctrl.data.isFinished
    ? [...sortedFinished, ...sortedScheduled]
    : [...sortedScheduled, ...sortedFinished];

  const trimArrs = arrs.length > maxlength && !expanded;
  const trimmedArrs = trimArrs ? arrs.slice(0, maxlength) : arrs;

  const withNewGameButton = ctrl.isOrganized() && ctrl.isCreator() && !ctrl.data.isFinished;

  return h('div.slist-wrap', [
    trimmedArrs.length || (ctrl.isOrganized() && ctrl.isCreator())
      ? renderGames(ctrl, trimmedArrs, withNewGameButton)
      : h(
          'div.text.empty-tab',
          {
            attrs: {
              'data-icon': '',
            },
          },
          i18n('noGameFound'),
        ),
    trimArrs
      ? h(
          'div.button.button-empty.view-more',
          {
            on: {
              click: () => {
                expanded = true;
                ctrl.redraw();
              },
            },
          },
          i18n('more'),
        )
      : null,
  ]);
}

export function renderGames(
  ctrl: TournamentController,
  arrs: Arrangement[],
  withNewGameButton = false,
): VNode {
  const players = ctrl.data.standing.players;
  const renderedArrs = arrs.map(a => {
    const arrPlayers = [
      a.user1 ? players.find(p => p.id === a.user1?.id) : undefined,
      a.user2 ? players.find(p => p.id === a.user2?.id) : undefined,
    ];
    const at = a.startedAt || a.scheduledAt;
    const date = at ? new Date(at) : undefined;

    return h(
      'tr',
      {
        attrs: {
          'data-key': a.id,
        },
      },
      [
        h(
          'td.small.fade',
          h('i', { attrs: { 'data-icon': a.status && a.status >= ids.mate ? 'E' : 'J' } }),
        ),
        ctrl.isOrganized() ? h('td.bold.small', a.name) : undefined,
        h(
          `td.small.vs-names${ctrl.isRobin() ? '.bold' : ''}`,
          i18nVdom(
            'xVsY',
            h('span', playerName(arrPlayers[0])),
            h('span', playerName(arrPlayers[1])),
          ),
        ),
        h('td.center', tdStatus(a)),
        h(
          'td.right.small',
          date
            ? h(
                'time.timeago',
                { attrs: { datetime: date.getTime() } },
                window.lishogi.timeago.format(date),
              )
            : null,
        ),
      ],
    );
  });

  return h(
    'table.slist.slist-clean',
    h(
      'tbody',
      {
        on: {
          click: arrangementRowClick(ctrl),
        },
      },
      withNewGameButton
        ? [
            h('tr.new-game', [
              h(
                'td.bold.center.text',
                {
                  attrs: { colspan: 5, 'data-icon': 'O' },
                  hook: bind('click', () => {
                    ctrl.showOrganizerArrangement(ctrl.newArrangementSettings());
                  }),
                },
                i18n('createAGame'),
              ),
            ]),
            ...renderedArrs,
          ]
        : renderedArrs,
    ),
  );
}

function arrangementRowClick(ctrl: TournamentController): (e: Event) => void {
  return e => {
    const target = (e.target as HTMLElement).closest('tr');
    const key = target?.dataset.key;
    const arr = ctrl.data.standing.arrangements.find(a => a.id === key);

    if (arr) ctrl.showArrangement(arr);
  };
}

function tdStatus(a: Arrangement): string {
  if (!a.status) return '-';
  else if (a.status < ids.mate) return i18n('playingRightNow');
  else return i18n('finished');
}
