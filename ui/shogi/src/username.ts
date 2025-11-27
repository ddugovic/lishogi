import type { MaybeVNodes } from 'common/snabbdom';
import { flagImage } from 'common/snabbdom';
import { i18n, i18nFormat } from 'i18n';
import { h } from 'snabbdom';
import { type Rank, rankTag } from './rank';

export function usernameVNodes(data: {
  username?: string;
  rank?: Rank;
  bot?: boolean;
  engineLvl?: number;
  countryCode?: string;
}): MaybeVNodes {
  return [
    !data.bot && data.rank ? rankTag(data.rank) : undefined,
    data.engineLvl ? h('span.engine-lvl', `${i18nFormat('levelX', data.engineLvl)} `) : undefined,
    data.bot ? h('span.bot-tag', 'BOT ') : undefined,
    h(`span.name${!data.username ? '.anon' : ''}`, data.username || i18n('anonymousUser')),
    data.countryCode ? flagImage(data.countryCode) : undefined,
  ];
}
