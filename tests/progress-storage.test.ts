import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSync } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { createSession, DEFAULT_SETTINGS, ready, startQuestion, saveAnswer, continueAfterAnswer, nextQuestion } from '../src/game/session';
import { GameSession } from '../src/types/game';

// Bundle the real persistence module with only its AsyncStorage dependency replaced.
const directory = mkdtempSync(join(tmpdir(), 'kasane-storage-test-'));
const bundle = join(directory, 'storage.cjs');
buildSync({ stdin: { contents: `export * from './src/game/progressStorage'; export {default as storage, control} from './tests/fixtures/asyncStorage';`, resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'cjs', outfile: bundle,
  alias: { '@react-native-async-storage/async-storage': resolve('tests/fixtures/asyncStorage.ts') } });
const api = createRequire(import.meta.url)(bundle) as typeof import('../src/game/progressStorage') & {
  storage: typeof import('./fixtures/asyncStorage').default;
  control: typeof import('./fixtures/asyncStorage').control;
};
process.on('exit', () => rmSync(directory, { recursive: true, force: true }));
const key = 'kasane-iro:all-progress:v1';
const stage = 'traditional-japan';
function step(s: GameSession): GameSession {
  switch (s.gameStatus) {
    case 'handoff': return ready(s);
    case 'questionIntro': return startQuestion(s);
    case 'playing': return saveAnswer(s, s.players[s.currentPlayerIndex].id, s.currentQuestion.id, s.currentQuestion.recipe);
    case 'answerSaved': return continueAfterAnswer(s);
    case 'questionResult': return nextQuestion(s);
    default: return s;
  }
}

test('全問保存・再読込で問題順、回答、現在位置を保持しplayingだけ開始前へ戻す', async () => {
  for (const playerCount of [1, 2, 3, 4] as const) for (const resultTiming of ['question', 'final'] as const) {
    let s = createSession({ ...DEFAULT_SETTINGS, questionCount: 'all', playerCount, resultTiming }, []);
    while (s.currentQuestionIndex < 2) {
      await api.saveAllProgress(stage, s);
      const loaded = await api.loadAllProgress();
      assert.ok(loaded);
      assert.deepEqual(loaded.session, { ...s, gameStatus: s.gameStatus === 'playing' ? 'questionIntro' : s.gameStatus });
      s = step(s);
    }
    assert.equal(s.questions.length, 119);
  }
});

test('119問完走は復元しない・通常モードは保存しない・clearAllProgressで削除', async () => {
  let s = createSession({ ...DEFAULT_SETTINGS, questionCount: 'all' }, []);
  await api.saveAllProgress(stage, s);
  const before = await api.storage.getItem(key);
  await api.saveAllProgress(stage, createSession(DEFAULT_SETTINGS, []));
  assert.equal(await api.storage.getItem(key), before);
  while (s.gameStatus !== 'finished') s = step(s);
  assert.equal(s.answers.length, 119);
  await api.saveAllProgress(stage, s);
  await api.clearAllProgress();
  assert.equal(await api.loadAllProgress(), null);
  assert.equal(await api.storage.getItem(key), null);
  await api.storage.setItem(key, JSON.stringify({ version: 1, stageId: stage, savedAt: new Date().toISOString(), session: s }));
  assert.equal(await api.loadAllProgress(), null);
  assert.equal(await api.storage.getItem(key), null);
});

test('破損した構造・状態・問題・回答の保存データを復元しない', async () => {
  const s = createSession({ ...DEFAULT_SETTINGS, questionCount: 'all' }, []);
  const invalid = [
    { ...s, players: undefined }, { ...s, answers: undefined },
    { ...s, gameStatus: 'unknown' }, { ...s, settings: { ...s.settings, timeLimit: 2 } },
    { ...s, questions: [s.currentQuestion] },
    { ...s, currentQuestionIndex: -1 }, { ...s, currentPlayerIndex: 20 },
    { ...s, questions: s.questions.map(() => s.currentQuestion) },
    { ...s, currentQuestion: { ...s.currentQuestion, recipe: ['unknown'] } },
    { ...s, answers: [{ playerId: 'unknown', questionId: 'unknown' }] },
    { ...s, currentQuestionIndex: 1, currentQuestion: s.questions[1] },
    { ...s, gameStatus: 'answerSaved' },
  ];
  for (const session of invalid) {
    await api.storage.setItem(key, JSON.stringify({ version: 1, stageId: stage, savedAt: new Date().toISOString(), session }));
    assert.equal(await api.loadAllProgress(), null, JSON.stringify(session).slice(0, 150));
  }
  for (const raw of ['{', 'null', '{}']) {
    await api.storage.setItem(key, raw);
    assert.equal(await api.loadAllProgress(), null);
  }
});

test('遅い古い保存が新しい進捗や完走後の削除を上書きしない', async () => {
  const s = createSession({ ...DEFAULT_SETTINGS, questionCount: 'all' }, []);
  api.control.delayNextWrite = 30;
  await Promise.all([api.saveAllProgress(stage, s), api.saveAllProgress(stage, step(step(s)))]);
  assert.equal((await api.loadAllProgress())?.session.gameStatus, 'answerSaved');
  api.control.delayNextWrite = 30;
  await Promise.all([api.saveAllProgress(stage, s), api.clearAllProgress()]);
  assert.equal(await api.loadAllProgress(), null);
});

test('一度保存に失敗しても次の保存を実行できる', async () => {
  const s = createSession({ ...DEFAULT_SETTINGS, questionCount: 'all' }, []);
  api.control.failNextWrite = true;
  await assert.rejects(api.saveAllProgress(stage, s));
  await api.saveAllProgress(stage, s);
  assert.ok(await api.loadAllProgress());
});
