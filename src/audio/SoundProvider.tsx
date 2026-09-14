import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioManager, BgmType, DEFAULT_SOUND_SETTINGS, SeType, SoundSettings, SoundState } from './AudioManager';
import { expoBackend } from './expoBackend';

type Sound = {
  state: SoundState;
  playBgm(type: BgmType): void;
  stopBgm(): void;
  playSe(type: SeType): void;
  setSettings(settings: SoundSettings): void;
};
const SoundContext = createContext<Sound | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const manager = useRef<AudioManager | null>(null);
  const [state, setState] = useState<SoundState>({ ...DEFAULT_SOUND_SETTINGS, ready: false, saveError: false });
  // Remember screen intent even if children's effects run before the provider's mount effect.
  const desiredBgm = useRef<BgmType | null>(null);
  useEffect(() => {
    const audio = new AudioManager(expoBackend, AsyncStorage, setState);
    manager.current = audio;
    let webUnlocked = Platform.OS !== 'web';
    const updateActivity = () => audio.setActive(webUnlocked && AppState.currentState === 'active' &&
      (Platform.OS !== 'web' || typeof document === 'undefined' || !document.hidden));
    updateActivity();
    const subscription = AppState.addEventListener('change', updateActivity);
    const unlock = () => { webUnlocked = true; updateActivity(); };
    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', updateActivity);
      document.addEventListener('pointerdown', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
    }
    if (desiredBgm.current) audio.playBgm(desiredBgm.current);
    void audio.initialize();
    return () => {
      subscription.remove();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', updateActivity);
        document.removeEventListener('pointerdown', unlock);
        document.removeEventListener('keydown', unlock);
      }
      audio.dispose();
      manager.current = null;
    };
  }, []);
  const actions = useMemo(() => ({
    playBgm(type: BgmType) { desiredBgm.current = type; manager.current?.playBgm(type); },
    stopBgm() { desiredBgm.current = null; manager.current?.stopBgm(); },
    playSe(type: SeType) { void manager.current?.playSe(type); },
    setSettings(settings: SoundSettings) { void manager.current?.setSettings(settings); },
  }), []);
  return <SoundContext.Provider value={{ state, ...actions }}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const sound = useContext(SoundContext);
  if (!sound) throw new Error('useSound requires SoundProvider');
  return sound;
}
