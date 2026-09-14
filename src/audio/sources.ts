import { BgmType, SeType } from './AudioManager';

// Metro needs static requires. Never require an absent file; see assets/audio/bgm/README.md.
export const sources: Record<BgmType | SeType, number | null> = {
  menu: null,
  play: null,
  'card-place': require('../../assets/audio/se/card-place.wav'),
  'card-remove': require('../../assets/audio/se/card-remove.wav'),
  reset: require('../../assets/audio/se/reset.wav'),
  confirm: require('../../assets/audio/se/confirm.wav'),
  result: require('../../assets/audio/se/result.wav'),
  perfect: require('../../assets/audio/se/perfect.wav'),
  button: require('../../assets/audio/se/button.wav'),
};
