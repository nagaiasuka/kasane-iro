export type BgmType = 'menu' | 'play';
export type SeType = 'card-place' | 'card-remove' | 'reset' | 'confirm' | 'result' | 'perfect' | 'button';
export type SoundSettings = Readonly<{ bgm: boolean; se: boolean }>;
export type SoundState = SoundSettings & Readonly<{ ready: boolean; saveError: boolean }>;
export const SOUND_STORAGE_KEY = 'kasane-iro:sound:v1';
export const DEFAULT_SOUND_SETTINGS: SoundSettings = { bgm: true, se: true };
export const BGM_VOLUME = { menu: 0.24, play: 0.20 };
export const SE_VOLUME = 0.60;

export interface SoundPlayer {
  volume: number;
  loop: boolean;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  remove(): void;
}
export interface AudioBackend {
  configure(): Promise<void>;
  // Missing sources return null, so the app can ship/test before music is supplied.
  create(type: BgmType | SeType): SoundPlayer | null;
}
export interface SoundStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
const SE_TYPES: SeType[] = ['card-place', 'card-remove', 'reset', 'confirm', 'result', 'perfect', 'button'];

/** One owner per app mount. Native playback is isolated from game state and scoring. */
export class AudioManager {
  state: SoundState = { ...DEFAULT_SOUND_SETTINGS, ready: false, saveError: false };
  private players = new Map<BgmType | SeType, SoundPlayer>();
  private desiredBgm: BgmType | null = null;
  private currentBgm: BgmType | null = null;
  private active = true;
  private disposed = false;
  private initialized = false;
  private generation = 0;
  private settingsRevision = 0;
  private seRequests = new Map<SeType, number>();
  private pendingSave: Promise<void> = Promise.resolve();

  constructor(private backend: AudioBackend, private storage: SoundStorage,
    private changed: (state: SoundState) => void = () => {}) {}

  async initialize() {
    if (this.initialized || this.disposed) return;
    this.initialized = true;
    let settings = DEFAULT_SOUND_SETTINGS;
    try {
      const raw = await this.storage.getItem(SOUND_STORAGE_KEY);
      const value = raw ? JSON.parse(raw) : null;
      if (value && typeof value.bgm === 'boolean' && typeof value.se === 'boolean') {
        settings = { bgm: value.bgm, se: value.se };
      }
    } catch { /* An unavailable/corrupt preference must not prevent playing the game. */ }
    if (this.disposed) return;
    try {
      await this.backend.configure();
      if (this.disposed) return;
      for (const type of [...(['menu', 'play'] as const), ...SE_TYPES]) {
        let player: SoundPlayer | null = null;
        try {
          player = this.backend.create(type);
          if (player) {
            player.loop = type === 'menu' || type === 'play';
            player.volume = type === 'menu' || type === 'play' ? BGM_VOLUME[type]
              : type === 'button' ? 0.28 : type === 'perfect' ? 0.65 : SE_VOLUME;
            this.players.set(type, player);
          }
        } catch { if (player) this.safely(() => player!.remove()); }
      }
    } catch { /* Audio unavailable: keep settings and the game usable. */ }
    if (this.disposed) return;
    this.state = { ...settings, ready: true, saveError: false };
    this.changed(this.state);
    this.syncBgm();
  }

  playBgm(type: BgmType) { this.desiredBgm = type; this.syncBgm(); }
  stopBgm() { this.desiredBgm = null; this.syncBgm(); }

  private safely(action: () => void) { try { action(); } catch { /* Never interrupt gameplay for audio. */ } }
  private syncBgm() {
    const next = !this.disposed && this.state.ready && this.state.bgm && this.active ? this.desiredBgm : null;
    if (next === this.currentBgm) return;
    if (this.currentBgm) {
      const old = this.players.get(this.currentBgm);
      if (old) this.safely(() => old.pause());
    }
    this.currentBgm = next;
    const player = next ? this.players.get(next) : null;
    // Resume cached players; never replace/reload/rewind music on a render or menu navigation.
    if (player) this.safely(() => player.play());
  }

  async playSe(type: SeType) {
    if (this.disposed || !this.state.ready || !this.state.se || !this.active) return;
    const player = this.players.get(type);
    if (!player) return;
    const generation = this.generation;
    const request = (this.seRequests.get(type) ?? 0) + 1;
    this.seRequests.set(type, request);
    try {
      player.pause();
      await player.seekTo(0);
      // OFF/background/dispose during native seek must not allow late playback.
      if (this.disposed || !this.active || !this.state.se || generation !== this.generation ||
          this.seRequests.get(type) !== request) return;
      player.play();
    } catch { /* Playback/seek rejection must not become an unhandled promise. */ }
  }

  setActive(active: boolean) {
    this.active = active;
    if (!active) this.pauseSe();
    this.syncBgm();
  }

  private pauseSe() {
    this.generation++;
    for (const type of SE_TYPES) {
      const player = this.players.get(type);
      if (player) this.safely(() => player.pause());
    }
  }

  async setSettings(settings: SoundSettings) {
    if (!this.state.ready || this.disposed) return;
    this.state = { ...settings, ready: true, saveError: false };
    if (!settings.se) this.pauseSe();
    this.syncBgm();
    this.changed(this.state);
    const snapshot = JSON.stringify(settings);
    const revision = ++this.settingsRevision;
    // Preserve ordering when switches are toggled rapidly, including after a failed write.
    this.pendingSave = this.pendingSave.then(async () => {
      try { await this.storage.setItem(SOUND_STORAGE_KEY, snapshot); }
      catch {
        if (!this.disposed && revision === this.settingsRevision) {
          this.state = { ...this.state, saveError: true }; this.changed(this.state);
        }
      }
    });
    await this.pendingSave;
  }

  dispose() {
    this.disposed = true;
    this.pauseSe();
    this.stopBgm();
    for (const player of this.players.values()) this.safely(() => player.remove());
    this.players.clear();
  }
}
