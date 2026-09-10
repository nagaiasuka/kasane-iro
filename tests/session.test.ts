import assert from 'node:assert/strict';
import test from 'node:test';
import { createSession, DEFAULT_SETTINGS, nextQuestion, ranking, ready, remainingSeconds, saveAnswer } from '../src/game/session';
import { GameSession } from '../src/types/game';

function answer(session: GameSession, empty = false) {
  return saveAnswer(session, session.players[session.currentPlayerIndex].id, session.currentQuestion.id,
    empty ? [] : session.currentQuestion.recipe, empty);
}

test('人数1〜4・問題数3/5/10・デフォルト名・1人は受け渡し不要', () => {
  for (const playerCount of [1, 2, 3, 4] as const) for (const questionCount of [3, 5, 10] as const) {
    const s = createSession({ ...DEFAULT_SETTINGS, playerCount, questionCount }, [' 飛鳥 ', '   ']);
    assert.equal(s.players.length, playerCount);
    assert.equal(s.players[0].name, '飛鳥');
    if (playerCount > 1) assert.equal(s.players[1].name, 'プレイヤー2');
    assert.equal(s.questions.length, questionCount);
    assert.equal(new Set(s.questions.map(q => q.id)).size, questionCount);
    assert.equal(s.gameStatus, playerCount === 1 ? 'playing' : 'handoff');
  }
});

test('回答保存はスナップショット、二重回答・別プレイヤー・別問題を拒否', () => {
  const s = createSession(DEFAULT_SETTINGS, []);
  const recipe = [...s.currentQuestion.recipe];
  const saved = saveAnswer(s, s.players[0].id, s.currentQuestion.id, recipe);
  recipe.pop();
  assert.equal(saved.answers[0].score, 100);
  assert.deepEqual(saved.answers[0].recipe, s.currentQuestion.recipe);
  assert.equal(answer(saved), saved);
  assert.equal(saveAnswer(s, 'unknown', s.currentQuestion.id, []), s);
  assert.equal(saveAnswer(s, s.players[0].id, 'unknown', []), s);
  const next = nextQuestion(saved);
  assert.equal(saveAnswer(next, s.players[0].id, s.currentQuestion.id, []), next);
});

test('同じ問題の次プレイヤーを経て全員回答後のみ問題結果', () => {
  let s = createSession({ ...DEFAULT_SETTINGS, playerCount: 2 }, []);
  assert.equal(answer(s), s);
  s = answer(ready(s));
  assert.equal(s.gameStatus, 'handoff');
  assert.equal(s.currentPlayerIndex, 1);
  assert.equal(s.currentQuestionIndex, 0);
  assert.equal(saveAnswer(ready(s), s.players[0].id, s.currentQuestion.id, [] ).answers.length, 1);
  s = answer(ready(s));
  assert.equal(s.gameStatus, 'questionResult');
  s = nextQuestion(s);
  assert.equal(s.currentQuestionIndex, 1);
  assert.equal(s.currentQuestion, s.questions[1]);
  assert.equal(s.currentPlayerIndex, 0);
  assert.equal(s.gameStatus, 'handoff');
});

test('全設定の組合せで全問完了・resultTimingによる遷移差・再プレイ', () => {
  for (const playerCount of [1, 2, 3, 4] as const) for (const questionCount of [3, 5, 10] as const)
    for (const resultTiming of ['question', 'final'] as const) {
      let s = createSession({ ...DEFAULT_SETTINGS, playerCount, questionCount, resultTiming }, []);
      for (let q = 0; q < questionCount; q++) {
        for (let p = 0; p < playerCount; p++) {
          assert.equal(s.gameStatus, playerCount === 1 ? 'playing' : 'handoff');
          s = ready(s);
          assert.equal(s.currentPlayerIndex, p);
          assert.equal(s.currentQuestionIndex, q);
          s = answer(s);
        }
        if (resultTiming === 'question') {
          assert.equal(s.gameStatus, 'questionResult');
          s = nextQuestion(s);
        } else assert.notEqual(s.gameStatus, 'questionResult');
      }
      assert.equal(s.gameStatus, 'finished');
      assert.equal(s.answers.length, playerCount * questionCount);
      assert.equal(answer(s), s);
      assert.equal(nextQuestion(s), s);
      assert.equal(ready(s), s);
      const replay = createSession(s.settings, s.players.map(p => p.name));
      assert.equal(replay.answers.length, 0);
      assert.equal(replay.currentQuestionIndex, 0);
      assert.deepEqual(replay.players, s.players);
    }
});

test('時間切れは現在のカードで採点し空回答は白・0%、残り時間は実時刻で算出', () => {
  const s = createSession({ ...DEFAULT_SETTINGS, timeLimit: 15 }, []);
  const empty = answer(s, true).answers[0];
  assert.equal(empty.score, 0);
  assert.equal(empty.timedOut, true);
  assert.deepEqual(empty.color, { r: 255, g: 255, b: 255 });
  const full = saveAnswer(s, s.players[0].id, s.currentQuestion.id, s.currentQuestion.recipe, true).answers[0];
  assert.equal(full.score, 100);
  assert.equal(full.timedOut, true);
  assert.equal(remainingSeconds(15000, 0), 15);
  assert.equal(remainingSeconds(15000, 12001), 3);
  assert.equal(remainingSeconds(15000, 15000), 0);
  assert.equal(remainingSeconds(15000, 30000), 0);
});

test('平均は全問題を分母に算出・降順ランキング・同点1/1/3位', () => {
  let s = createSession({ ...DEFAULT_SETTINGS, playerCount: 3, resultTiming: 'final' }, []);
  while (s.gameStatus !== 'finished') s = answer(ready(s), s.currentPlayerIndex === 2 && s.currentQuestionIndex !== 0);
  const result = ranking(s);
  assert.deepEqual(result.map(r => r.rank), [1, 1, 3]);
  assert.deepEqual(result.map(r => r.average), [100, 100, 100 / 3]);
  assert.deepEqual(result.map(r => r.player.id), s.players.map(p => p.id));
  const inverted = { ...s, answers: s.answers.map(a => ({ ...a, score: a.playerId === 'player-3' ? 99 : 25 })) };
  assert.deepEqual(ranking(inverted).map(r => r.player.id), ['player-3', 'player-1', 'player-2']);
  assert.deepEqual(ranking(inverted).map(r => r.rank), [1, 2, 2]);
});
