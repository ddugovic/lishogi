import { useJp } from 'common/common';
import { modal } from 'common/modal';
import { type MaybeVNode, bind } from 'common/snabbdom';
import { i18n, i18nFormat } from 'i18n';
import { i18nVariant } from 'i18n/variant';
import { h } from 'snabbdom';
import type SimulCtrl from '../ctrl';
import type { Applicant } from '../interfaces';
import xhr from '../xhr';
import * as util from './util';

export default function (showText: (ctrl: SimulCtrl) => MaybeVNode) {
  return (ctrl: SimulCtrl) => {
    const candidates = ctrl.candidates().sort(byName);
    const accepted = ctrl.accepted().sort(byName);
    const isHost = ctrl.createdByMe();
    const variantIconFor = (a: Applicant) => {
      const variant = ctrl.data.variants.find(v => a.variant == v.key);
      return (
        variant &&
        h('td.variant', {
          attrs: {
            'data-icon': variant.icon,
          },
        })
      );
    };
    return [
      h('div.box__top', [
        util.title(ctrl),
        h(
          'div.box__top__actions',
          ctrl.opts.userId
            ? isHost
              ? [startOrCancel(ctrl, accepted), randomButton(ctrl)]
              : ctrl.containsMe()
                ? h(
                    'a.button',
                    {
                      hook: bind('click', () => xhr.withdraw(ctrl.data.id)),
                    },
                    i18n('withdraw'),
                  )
                : h(
                    `a.button.text${ctrl.teamBlock() ? '.disabled' : ''}`,
                    {
                      attrs: {
                        disabled: ctrl.teamBlock(),
                        'data-icon': 'G',
                      },
                      hook: ctrl.teamBlock()
                        ? {}
                        : bind('click', () => {
                            if (ctrl.data.variants.length === 1)
                              xhr.join(ctrl.data.id, ctrl.data.variants[0].key);
                            else {
                              modal({
                                content: [
                                  h(
                                    'div.continue-with',
                                    ctrl.data.variants.map(variant =>
                                      h(
                                        'button.button',
                                        {
                                          attrs: {
                                            'data-variant': variant.key,
                                          },
                                        },
                                        i18nVariant(variant.key),
                                      ),
                                    ),
                                  ),
                                ],
                                onClose() {
                                  xhr.join(ctrl.data.id, $(this).data('variant'));
                                },
                              });
                            }
                          }),
                    },
                    ctrl.teamBlock() && ctrl.data.team
                      ? i18nFormat('mustBeInTeam', ctrl.data.team.name)
                      : i18n('join'),
                  )
            : h(
                'a.button.text',
                {
                  attrs: {
                    'data-icon': 'G',
                    href: `/login?referrer=${window.location.pathname}`,
                  },
                },
                i18n('signIn'),
              ),
        ),
      ]),
      showText(ctrl),
      ctrl.acceptedContainsMe()
        ? h('p.instructions', 'You have been selected! Hold still, the simul is about to begin.')
        : isHost && ctrl.data.applicants.length < 6
          ? h('p.instructions', 'Share this page URL to let people enter the simul!')
          : null,
      h(
        'div.halves',
        {
          hook: {
            postpatch(_old, vnode) {
              window.lishogi.powertip.manualUserIn(vnode.elm as HTMLElement);
            },
          },
        },
        [
          h(
            'div.half.candidates',
            h(
              'table.slist.slist-pad',
              h(
                'thead',
                h(
                  'tr',
                  h(
                    'th',
                    {
                      attrs: { colspan: 3 },
                    },
                    [h('strong', candidates.length), ' candidate players'],
                  ),
                ),
              ),
              h(
                'tbody',
                candidates.map(applicant => {
                  return h(
                    'tr',
                    {
                      key: applicant.player.id,
                      class: {
                        me: ctrl.opts.userId === applicant.player.id,
                      },
                    },
                    [
                      h('td', util.player(applicant.player, ctrl)),
                      variantIconFor(applicant),
                      h(
                        'td.action',
                        isHost
                          ? [
                              h('a.button', {
                                attrs: {
                                  'data-icon': 'E',
                                  title: 'Accept',
                                },
                                hook: bind('click', () =>
                                  xhr.accept(applicant.player.id)(ctrl.data.id),
                                ),
                              }),
                            ]
                          : [],
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
          h('div.half.accepted', [
            h(
              'table.slist.user_list',
              h('thead', [
                h(
                  'tr',
                  h(
                    'th',
                    {
                      attrs: { colspan: 3 },
                    },
                    [h('strong', accepted.length), ' accepted players'],
                  ),
                ),
                isHost && candidates.length && !accepted.length
                  ? [
                      h(
                        'tr.help',
                        h('th', 'Now you get to accept some players, then start the simul'),
                      ),
                    ]
                  : [],
              ]),
              h(
                'tbody',
                accepted.map(applicant => {
                  return h(
                    'tr',
                    {
                      key: applicant.player.id,
                      class: {
                        me: ctrl.opts.userId === applicant.player.id,
                      },
                    },
                    [
                      h('td', util.player(applicant.player, ctrl)),
                      variantIconFor(applicant),
                      h(
                        'td.action',
                        isHost
                          ? [
                              h('a.button.button-red', {
                                attrs: {
                                  'data-icon': '',
                                },
                                hook: bind('click', () =>
                                  xhr.reject(applicant.player.id)(ctrl.data.id),
                                ),
                              }),
                            ]
                          : [],
                      ),
                    ],
                  );
                }),
              ),
            ),
          ]),
        ],
      ),
      ctrl.data.proverb
        ? h('blockquote.pull-quote', [
            h('p', useJp() ? ctrl.data.proverb.japanese : ctrl.data.proverb.english),
          ])
        : null,
    ];
  };
}

const byName = (a: Applicant, b: Applicant) => (a.player.name > b.player.name ? 1 : -1);

const randomButton = (ctrl: SimulCtrl) =>
  ctrl.candidates().length
    ? h(
        'a.button.text',
        {
          attrs: {
            'data-icon': 'E',
          },
          hook: bind('click', () => {
            const candidates = ctrl.candidates();
            const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
            xhr.accept(randomCandidate.player.id)(ctrl.data.id);
          }),
        },
        'Accept random candidate',
      )
    : null;

const startOrCancel = (ctrl: SimulCtrl, accepted: Applicant[]) =>
  accepted.length > 1
    ? h(
        'a.button.button-green.text',
        {
          attrs: {
            'data-icon': 'G',
          },
          hook: bind('click', () => xhr.start(ctrl.data.id)),
        },
        `Start (${accepted.length})`,
      )
    : h(
        'a.button.button-red.text',
        {
          attrs: {
            'data-icon': 'L',
          },
          hook: bind('click', () => {
            if (confirm('Delete this simul?')) xhr.abort(ctrl.data.id);
          }),
        },
        i18n('cancel'),
      );
