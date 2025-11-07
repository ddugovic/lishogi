import { clockToPerf } from 'common/clock';
import type { Game, Preset, PresetOpts, Seek } from './interfaces';

export const seeks: () => Promise<Seek[]> = () => window.lishogi.xhr.json('GET', '/lobby/seeks');

export const nowPlaying: () => Promise<Game[]> = () =>
  window.lishogi.xhr.json('GET', '/account/now-playing').then(o => o.nowPlaying);

  const perf = preset.timeMode == 2 ? 'correspondence' : 'realTime';
  const rating = opts.ratings?.[perf];
  const data = {
    variant: '1',
    timeMode: preset.timeMode.toString(),
    time: preset.lim.toString(),
    byoyomi: preset.byo.toString(),
    increment: preset.inc.toString(),
    periods: preset.per.toString(),
    days: preset.days.toString(),
    mode: (opts.isAnon ? 0 : 1).toString(),
    ratingRange:
      rating && !rating.clueless
        ? [rating.rating - opts.ratingDiff, rating.rating + opts.ratingDiff].join('-')
        : '',
    color: 'random',
  };
  if (preset.ai) {
    return window.lishogi.xhr
      .json('POST', '/setup/ai', {
        url: {
          redirect: true,
        },
        formData: {
          ...data,
          sfen: '',
          level: preset.ai.toString(),
          position: 'default',
        },
      })
      .then(data => {
        window.lishogi.redirect(data);
      });
  } else
    return window.lishogi.xhr.json('POST', `/setup/hook/${window.lishogi.sri}`, { formData: data });
}
