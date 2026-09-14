import assert from 'node:assert/strict';
import test from 'node:test';
import { AudioManager, BGM_VOLUME, SOUND_STORAGE_KEY, SoundPlayer, SoundStorage } from '../src/audio/AudioManager';
import { cardDropSound, resultSound, sessionSound } from '../src/audio/events';
import { moveCard } from '../src/game/stack';
import { createSession, DEFAULT_SETTINGS, startQuestion, saveAnswer, continueAfterAnswer, nextQuestion } from '../src/game/session';

class MockPlayer implements SoundPlayer {
  volume = 1; loop = false; plays = 0; pauses = 0; seeks = 0; removals = 0;
  seekWait = Promise.resolve();
  play() { this.plays++; }
  pause() { this.pauses++; }
  async seekTo(seconds: number) { assert.equal(seconds, 0); this.seeks++; await this.seekWait; }
  remove() { this.removals++; }
}
function fixture(raw: string | null = null) {
  const players = new Map<string, MockPlayer>();
  const writes: string[] = [];
  const storage: SoundStorage = {
    async getItem(key) { assert.equal(key, SOUND_STORAGE_KEY); return raw; },
    async setItem(key, value) { assert.equal(key, SOUND_STORAGE_KEY); writes.push(value); raw = value; },
  };
  let configured = 0;
  const backend = {
    async configure() { configured++; },
    create(type: string) { const p = new MockPlayer(); players.set(type, p); return p; },
  };
  const manager = new AudioManager(backend, storage);
  return { manager, players, storage, writes, backend, configured: () => configured };
}

test('保存したBGM OFFは初回復元前も復元後も鳴らず、ONで現在画面の曲を再生', async () => {
  const f = fixture('{"bgm":false,"se":true}');
  f.manager.playBgm('play');
  assert.equal(f.players.size, 0);
  await f.manager.initialize();
  assert.equal(f.players.get('play')!.plays, 0);
  await f.manager.setSettings({ bgm: true, se: true });
  assert.equal(f.players.get('play')!.plays, 1);
  await f.manager.setSettings({ bgm: false, se: true });
  assert.equal(f.players.get('play')!.pauses, 1);
});

test('SE OFFならseekも再生も要求しない', async () => {
  const f = fixture('{"bgm":true,"se":false}');
  await f.manager.initialize();
  await f.manager.playSe('card-place');
  assert.equal(f.players.get('card-place')!.plays, 0);
  assert.equal(f.players.get('card-place')!.seeks, 0);
});

test('有効ドロップでのみ配置/除去SEを要求（無効・キャンセル・同じ場所は無音）', async () => {
  const f = fixture(); await f.manager.initialize();
  const placed = moveCard([], 'C70', 'field');
  const placeSound = cardDropSound([], placed);
  assert.equal(placeSound, 'card-place');
  await f.manager.playSe(placeSound!);
  const removed = moveCard(placed, 'C70', 'hand');
  assert.equal(cardDropSound(placed, removed), 'card-remove');
  assert.equal(cardDropSound(placed, moveCard(placed, 'C70', null)), null);
  assert.equal(cardDropSound(placed, moveCard(placed, 'C70', 'field')), null);
  assert.equal(cardDropSound([], moveCard([], 'C70', 'hand')), null);
  assert.equal(cardDropSound([], moveCard([], 'C70', null)), null);
  assert.equal(f.players.get('card-place')!.plays, 1);
});

test('100.0だけperfect、99.9以下や表示丸め相当では通常result', () => {
  assert.equal(resultSound([100]), 'perfect');
  assert.equal(resultSound([99.9]), 'result');
  assert.equal(resultSound([99.99]), 'result');
  assert.equal(resultSound([0, 53.1]), 'result');
});

test('回答確定と結果公開の実イベントに一度だけSE・タイムアウトはconfirmなし', () => {
  const playing = startQuestion(createSession(DEFAULT_SETTINGS, []));
  const saved = saveAnswer(playing, 'player-1', playing.currentQuestion.id, playing.currentQuestion.recipe);
  assert.equal(sessionSound(playing, saved), 'confirm');
  const duplicate = saveAnswer(saved, 'player-1', playing.currentQuestion.id, playing.currentQuestion.recipe);
  assert.equal(sessionSound(saved, duplicate), null);
  const result = continueAfterAnswer(saved);
  assert.equal(sessionSound(saved, result), 'perfect');
  assert.equal(sessionSound(result, { ...result }), null);
  assert.equal(sessionSound(result, continueAfterAnswer(result)), null);
  const timeout = saveAnswer(playing, 'player-1', playing.currentQuestion.id, [], true);
  assert.equal(sessionSound(playing, timeout), null);
  assert.equal(sessionSound(timeout, continueAfterAnswer(timeout)), 'result');
});

test('複数人は全員回答後までperfectを漏らさない・final設定では最後に結果音', () => {
  const initial = createSession({ ...DEFAULT_SETTINGS, playerCount: 2 }, []);
  const playing = { ...initial, gameStatus: 'playing' as const };
  const saved = saveAnswer(playing, 'player-1', playing.currentQuestion.id, playing.currentQuestion.recipe);
  assert.equal(sessionSound(saved, continueAfterAnswer(saved)), null);
  for (const resultTiming of ['question', 'final'] as const) {
    let current = createSession({ ...DEFAULT_SETTINGS, resultTiming }, []);
    while (current.gameStatus !== 'finished') {
      let next = current;
      if (current.gameStatus === 'questionIntro') next = startQuestion(current);
      if (current.gameStatus === 'playing') next = saveAnswer(current, 'player-1', current.currentQuestion.id, current.currentQuestion.recipe);
      if (current.gameStatus === 'answerSaved') next = continueAfterAnswer(current);
      if (current.gameStatus === 'questionResult') next = nextQuestion(current);
      if (next.gameStatus === 'finished') assert.equal(sessionSound(current, next), 'perfect');
      current = next;
    }
  }
});

test('BGMはループ・画面切替でもキャッシュを利用し同じ曲は再起動しない', async () => {
  const f = fixture(); await f.manager.initialize(); await f.manager.initialize();
  f.manager.playBgm('menu'); f.manager.playBgm('menu');
  assert.equal(f.players.get('menu')!.plays, 1);
  assert.equal(f.players.get('menu')!.loop, true);
  assert.equal(f.players.get('play')!.loop, true);
  assert.equal(f.players.get('play')!.volume, BGM_VOLUME.play);
  f.manager.playBgm('play');
  assert.equal(f.players.get('menu')!.pauses, 1);
  assert.equal(f.players.get('play')!.plays, 1);
  assert.equal(f.players.get('menu')!.seeks, 0);
  assert.equal(f.configured(), 1);
  const cached = f.players.get('card-place');
  await f.manager.playSe('card-place'); await f.manager.playSe('card-place');
  assert.equal(f.players.get('card-place'), cached);
  assert.equal(cached!.plays, 2);
});

test('backgroundでBGM/SE停止・foregroundは最新画面へ復帰、OFFなら復帰しない', async () => {
  const f = fixture(); await f.manager.initialize();
  f.manager.playBgm('menu');
  f.manager.setActive(false);
  assert.equal(f.players.get('menu')!.pauses, 1);
  await f.manager.playSe('result');
  assert.equal(f.players.get('result')!.plays, 0);
  f.manager.playBgm('play');
  assert.equal(f.players.get('play')!.plays, 0);
  f.manager.setActive(true);
  assert.equal(f.players.get('play')!.plays, 1);
  assert.equal(f.players.get('play')!.seeks, 0);
  await f.manager.setSettings({ bgm: false, se: true });
  f.manager.setActive(false); f.manager.setActive(true);
  assert.equal(f.players.get('play')!.plays, 1);
});

test('結果中にstopBgmした曲はforegroundでも再生しない', async () => {
  const f = fixture(); await f.manager.initialize();
  f.manager.playBgm('play'); f.manager.stopBgm();
  f.manager.setActive(false); f.manager.setActive(true);
  assert.equal(f.players.get('play')!.plays, 1);
});

test('音設定の保存・再起動後復元・初期値ON', async () => {
  const f = fixture(); await f.manager.initialize();
  assert.equal(f.manager.state.bgm, true); assert.equal(f.manager.state.se, true);
  await f.manager.setSettings({ bgm: false, se: false });
  const restored = new AudioManager(f.backend, f.storage);
  await restored.initialize();
  assert.equal(restored.state.bgm, false); assert.equal(restored.state.se, false);
});

test('設定連打は保存順を保ち、保存失敗でも次の変更を保存できる', async () => {
  const f = fixture(); await f.manager.initialize();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const original = f.storage.setItem;
  let first = true;
  f.storage.setItem = async (key, value) => { if (first) { first = false; await gate; throw Error('disk'); } await original(key, value); };
  const a = f.manager.setSettings({ bgm: false, se: true });
  const b = f.manager.setSettings({ bgm: false, se: false });
  release(); await Promise.all([a, b]);
  assert.deepEqual(JSON.parse(f.writes.at(-1)!), { bgm: false, se: false });
  await f.manager.setSettings({ bgm: true, se: false });
  assert.equal(f.manager.state.saveError, false);
});

test('破損保存・ストレージ読取失敗でもゲームを開始できる', async () => {
  for (const raw of ['{', '{"bgm":"false","se":false}', 'null']) {
    const f = fixture(raw); await f.manager.initialize();
    assert.equal(f.manager.state.ready, true); assert.equal(f.manager.state.bgm, true);
  }
  const f = fixture(); f.storage.getItem = async () => { throw Error('unavailable'); };
  await f.manager.initialize(); assert.equal(f.manager.state.ready, true);
});

test('native seek待機中のOFF/background/dispose後に遅れてSEを鳴らさない', async () => {
  for (const stop of ['off', 'background', 'dispose']) {
    const f = fixture(); await f.manager.initialize();
    let release!: () => void;
    const p = f.players.get('confirm')!;
    p.seekWait = new Promise<void>(resolve => { release = resolve; });
    const pending = f.manager.playSe('confirm');
    if (stop === 'off') await f.manager.setSettings({ bgm: true, se: false });
    if (stop === 'background') { f.manager.setActive(false); f.manager.setActive(true); }
    if (stop === 'dispose') f.manager.dispose();
    release(); await pending;
    assert.equal(p.plays, 0, stop);
  }
});

test('連続する同じSEのseekが競合しても古い要求を再生しない', async () => {
  const f = fixture(); await f.manager.initialize();
  let release!: () => void;
  const p = f.players.get('card-place')!;
  p.seekWait = new Promise<void>(resolve => { release = resolve; });
  const a = f.manager.playSe('card-place'); const b = f.manager.playSe('card-place');
  release(); await Promise.all([a, b]); assert.equal(p.plays, 1);
});

test('音源未配置でもBGM操作は安全・全プレイヤーをdisposeで解放', async () => {
  const missing = new AudioManager({ async configure() {}, create() { return null; } }, fixture().storage);
  await missing.initialize(); missing.playBgm('menu'); await missing.playSe('result'); missing.dispose();
  const f = fixture(); await f.manager.initialize(); f.manager.playBgm('menu'); f.manager.dispose();
  for (const p of f.players.values()) assert.equal(p.removals, 1);
  await f.manager.playSe('perfect'); assert.equal(f.players.get('perfect')!.plays, 0);
});

test('初期化中に破棄したAudioManagerはプレイヤーを生成しない', async () => {
  const f = fixture(); let release!: () => void;
  f.backend.configure = () => new Promise<void>(resolve => { release = resolve; });
  const initializing = f.manager.initialize();
  await new Promise(resolve => setImmediate(resolve));
  f.manager.dispose(); release(); await initializing;
  assert.equal(f.players.size, 0);
});
