import type { Challenge } from 'challenge/interfaces';
import type { MaybeVNode } from 'common/snabbdom';
import { i18n, i18nVdom } from 'i18n';
import { type VNode, h } from 'snabbdom';
import type TournamentController from '../../ctrl';
import { playerName } from '../util';

export function challenges(ctrl: TournamentController): VNode {
  const challengesExists = !!(ctrl.challengeData.in.length + ctrl.challengeData.out.length);

  return h(
    'div.slist-wrap',
    challengesExists
      ? renderChallenges(ctrl, ctrl.challengeData.in, ctrl.challengeData.out)
      : h(
          'div.text.empty-tab',
          {
            attrs: {
              'data-icon': '',
            },
          },
          i18n('noChallenges'),
        ),
  );
}

function renderChallenges(ctrl: TournamentController, inC: Challenge[], outC: Challenge[]): VNode {
  return h(
    'table.slist.slist-clean',
    h(
      'tbody',
      {
        on: {
          click: arrangementRowClick(ctrl),
        },
      },
      [
        ...inC.map(c => renderChallenge(ctrl, c, 'in')),
        ...outC.map(c => renderChallenge(ctrl, c, 'out')),
      ],
    ),
  );
}

function renderChallenge(ctrl: TournamentController, c: Challenge, dir: 'in' | 'out'): MaybeVNode {
  const isIn = dir === 'in';

  console.log('c.tourInfo?.arrId', c.tourInfo?.arrId);

  const a = ctrl.findOrCreateArrangement(c.tourInfo?.arrId!);

  if (!a) return;
  const players = [
    a.user1 ? ctrl.data.standing.players.find(p => p.id === a.user1?.id) : undefined,
    a.user2 ? ctrl.data.standing.players.find(p => p.id === a.user2?.id) : undefined,
  ];

  return h(
    'tr',
    {
      class: {
        me: dir === 'out',
      },
      attrs: {
        'data-key': a.id,
      },
    },
    [
      h('td.small', h('i', { attrs: { 'data-icon': 'U' } })),
      ctrl.isOrganized() ? h('td.bold.small', a?.name || '') : undefined,
      h(
        'td.small',
        i18nVdom('xVsY', h('span', playerName(players[0])), h('span', playerName(players[1]))),
      ),
      h('td.center'),
      h('td.right.no-pad', [
        h('div.buttons', [
          h('a.button', {
            attrs: {
              href: `/challenge/${c.id}`,
              'data-icon': 'v',
              title: i18n('viewInFullSize'),
            },
            on: {
              click: e => {
                e.stopPropagation();
              },
            },
          }),
          isIn
            ? h('button.button.button-red', {
                attrs: {
                  title: i18n('decline'),
                  'data-icon': 'L',
                },
                on: {
                  click: e => {
                    e.stopPropagation();
                    window.lishogi.xhr.text('POST', `/challenge/${c.id}/decline`).catch(() =>
                      window.lishogi.announce({
                        msg: 'Failed to send challenge decline',
                      }),
                    );
                  },
                },
              })
            : h('button.button.button-red', {
                attrs: {
                  title: i18n('cancel'),
                  'data-icon': 'L',
                },
                on: {
                  click: e => {
                    e.stopPropagation();
                    c.declined = true;
                    window.lishogi.xhr.text('POST', `/challenge/${c.id}/cancel`).catch(() =>
                      window.lishogi.announce({
                        msg: 'Failed to send challenge cancellation',
                      }),
                    );
                  },
                },
              }),
        ]),
      ]),
    ],
  );
}

function arrangementRowClick(ctrl: TournamentController): (e: Event) => void {
  return e => {
    const target = (e.target as HTMLElement).closest('tr');
    const key = target?.dataset.key;
    const arr = key ? ctrl.findOrCreateArrangement(key) : undefined;

    if (arr) ctrl.showArrangement(arr);
  };
}
