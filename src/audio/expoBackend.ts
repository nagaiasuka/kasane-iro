import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { AudioBackend } from './AudioManager';
import { sources } from './sources';

export const expoBackend: AudioBackend = {
  configure: () => setAudioModeAsync({
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    allowsRecording: false,
    interruptionMode: 'mixWithOthers',
    shouldRouteThroughEarpiece: false,
  }),
  create(type) {
    const source = sources[type];
    return source === null ? null : createAudioPlayer(source, { downloadFirst: true });
  },
};
