import type { MaybeVNodes } from 'common/snabbdom';
import { usernameVNodes } from 'shogi/username';
import { h, type VNode } from 'snabbdom';
import type { User } from '../interfaces';

export function userIcon(user: User, cls: string): VNode {
  return h(
    `div.user-link.${cls}`,
    {
      class: {
        online: user.online,
        offline: !user.online,
      },
    },
    [h(`i.line${user.patron ? '.patron' : ''}${user.id === 'lishogi' ? '.moderator' : ''}`)],
  );
}

export function userName(user: User): MaybeVNodes {
  return usernameVNodes({
    username: user.name,
    bot: user.title === 'BOT',
    countryCode: user.countryCode,
  });
}
