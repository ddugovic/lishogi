export {};

declare global {
  type SoundCateg = 'system' | 'clock' | 'misc';

  type SoundSet = 'shogi' | 'shogialt' | 'chess' | 'nes' | 'sfx' | 'speech' | 'silent';

  type ClockSoundSet =
    | 'system'
    | 'chisei_mazawa'
    | 'eigo'
    | 'ippan_dansei'
    | 'robot_en'
    | 'robot_ja'
    | 'sakura_ajisai'
    | 'shougi_sennin'
    | 'silent';

  interface SoundI {
    play: (name: string, categ?: SoundCateg) => void;
    move: (capture?: boolean) => void;
    countdown: (number: number) => void;
    volume: (value?: number) => number;
    soundSet: (value?: SoundSet) => SoundSet;
    clockSoundSet: (value?: ClockSoundSet) => ClockSoundSet;
    loadGameSounds: (clock?: boolean) => void;
    say: (texts: { en?: string; ja?: string }, cut?: boolean, force?: boolean) => boolean;
  }

  interface LishogiSpeech {
    notation: string | undefined;
    cut: boolean;
  }
}
