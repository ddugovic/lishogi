import { icons } from 'common/icons';
import type { Player } from 'game/interfaces';
import { i18n, i18nFormat } from 'i18n';
import { engineNameFromCode } from 'shogi/engine-name';
import { rankFromRating } from 'shogi/rank';
import { usernameVNodes } from 'shogi/username';
import { h, type VNode } from 'snabbdom';
import type RoundController from '../ctrl';
import type { Position } from '../interfaces';

export function userHtml(ctrl: RoundController, player: Player, position: Position): VNode {
  const d = ctrl.data;
  const user = player.user;
  const perf = user ? user.perfs[d.game.perf] : null;
  const isBot = user?.title === 'BOT';
  const rating = player.rating ? player.rating : perf?.rating;
  const rank = !isBot && !player.provisional && rating ? rankFromRating(rating) : undefined;
  const rd = player.ratingDiff;
  const ratingDiff =
    rd === 0
      ? h('span', '±0')
      : rd && rd > 0
        ? h('good', `+${rd}`)
        : rd && rd < 0
          ? h('bad', `−${-rd}`)
          : undefined;

  if (user) {
    const connecting = !player.onGame && ctrl.firstSeconds && user.online;
    return h(
      `div.ruser-${position}.ruser.user-link`,
      {
        class: {
          online: player.onGame,
          offline: !player.onGame,
          long: user.username.length > 15,
          connecting,
        },
      },
      [
        h(`i.line${user.patron ? '.patron' : ''}`, {
          attrs: {
            title: connecting
              ? i18n('connectingToTheGame')
              : player.onGame
                ? i18nFormat('xJoinedTheGame', user.username)
                : i18nFormat('xLeftTheGame', user.username),
          },
        }),
        h(
          'a.text.ulpt',
          {
            attrs: {
              'data-pt-pos': 's',
              href: `/@/${user.username}`,
              target: ctrl.isPlaying() ? '_blank' : '_self',
            },
          },
          usernameVNodes({
            username: user.username,
            rank: rank,
            bot: isBot,
            countryCode: user.countryCode,
          }),
        ),
        rating ? h('rating', rating + (player.provisional ? '?' : '')) : null,
        ratingDiff,
        player.engine
          ? h('span', {
              attrs: {
                'data-icon': icons.error,
                title: i18n('thisAccountViolatedTos'),
              },
            })
          : null,
      ],
    );
  }
  const connecting = !player.onGame && ctrl.firstSeconds;
  return h(
    `div.ruser-${position}.ruser.user-link`,
    {
      class: {
        online: player.onGame,
        offline: !player.onGame,
        connecting,
      },
    },
    [
      h('i.line', {
        attrs: {
          title: connecting
            ? i18n('connectingToTheGame')
            : player.onGame
              ? i18nFormat('xJoinedTheGame', i18n('player'))
              : i18nFormat('xLeftTheGame', i18n('player')),
        },
      }),
      ...usernameVNodes({
        username: player.aiCode ? engineNameFromCode(player.aiCode) : player.name,
        rank: rank,
        engineLvl: player.ai,
      }),
    ],
  );
}

export function userTxt(player: Player): string {
  if (player.user) {
    return (player.user.title ? `${player.user.title} ` : '') + player.user.username;
  } else if (player.ai) return engineNameFromCode(player.aiCode);
  else return i18n('anonymousUser');
}
