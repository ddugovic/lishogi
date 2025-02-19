import ctrl from './ctrl';
import * as view from './view';
import * as winningChances from './winning-chances';

export type { CevalCtrl, NodeEvals, Eval, EvalMeta, CevalOpts } from './types';
export { isEvalBetter, renderEval } from './util';
export { ctrl, view, winningChances };

// stop when another tab starts. Listen only once here,
// as the ctrl can be instantiated several times.
// gotta do the click on the toggle to have it visually change.
window.lishogi.storage.make('ceval.disable').listen(() => {
  const toggle = document.getElementById('analyse-toggle-ceval') as HTMLInputElement | undefined;
  if (toggle?.checked) toggle.click();
});
