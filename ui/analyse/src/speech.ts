import { loadLishogiScript } from 'common/assets';

export function setup(): void {
  window.lishogi.pubsub.on('speech.enabled', onSpeechChange);
  onSpeechChange(window.lishogi.sound.soundSet() === 'speech');
}

function onSpeechChange(enabled: boolean) {
  if (!window.lishogi.modules.speech && enabled) loadLishogiScript('speech');
  else if (window.lishogi.modules.speech && !enabled)
    (window.lishogi.modules.speech as any) = undefined;
}

export function node(n: Tree.Node): void {
  if (window.lishogi.modules.speech)
    window.lishogi.modules.speech({ notation: n.notation, cut: true });
}
