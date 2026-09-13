import assert from 'node:assert/strict';
import test from 'node:test';
import { QUESTIONS as ALL_QUESTIONS, selectQuestions } from '../src/data/questions';
import { TRADITIONAL_COLOR_QUESTIONS } from '../src/data/questions.generated';
import { STAGES } from '../src/data/stages';
import { CARD_IDS } from '../src/game/cards';
import { generateColor } from '../src/game/colorEngine';
import { questionColor } from '../src/game/questionColor';
import { colorSimilarity, scoreAnswer } from '../src/game/scoring';
import { createSession, DEFAULT_SETTINGS, saveAnswer, startQuestion } from '../src/game/session';

const QUESTIONS = TRADITIONAL_COLOR_QUESTIONS;

function seededRandom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('119問と全メタデータを保持し、generatedHexが既存エンジンの正解色と一致', () => {
  assert.equal(QUESTIONS.length, 119);
  assert.deepEqual(ALL_QUESTIONS.slice(0, QUESTIONS.length), TRADITIONAL_COLOR_QUESTIONS);
  assert.equal(new Set(QUESTIONS.map(q => q.id)).size, 119);
  assert.deepEqual(STAGES.find(stage => stage.id === 'traditional')!.questionIds, QUESTIONS.map(q => q.id));
  for (const q of QUESTIONS) {
    assert.ok(q.name && q.romanized && q.id);
    assert.match(q.sourceHex, /^#[0-9A-F]{6}$/);
    assert.match(q.generatedHex, /^#[0-9A-F]{6}$/);
    assert.ok(q.sourceSimilarity >= 95 && q.sourceSimilarity <= 100);
    assert.ok(q.recipe.length >= 1 && q.recipe.length <= 7);
    assert.equal(new Set(q.recipe).size, q.recipe.length);
    assert.ok(q.recipe.every(id => CARD_IDS.includes(id)));
    assert.deepEqual(questionColor(q), generateColor(q.recipe), q.id);
  }
});

test('全正解は100.0%、同じカードでも順番違いは100.0%にならない', () => {
  for (const q of QUESTIONS) {
    assert.equal(scoreAnswer(q.recipe, q.recipe).score.toFixed(1), '100.0');
    if (q.recipe.length > 1) {
      const reversed = [...q.recipe].reverse();
      const scored = scoreAnswer(reversed, q.recipe);
      assert.equal(scored.score, Math.min(99.9, colorSimilarity(generateColor(reversed), questionColor(q))));
      assert.notEqual(scored.score.toFixed(1), '100.0');
    }
  }
});

test('3/5/10問をランダムに選び、同一ゲーム内のrecipeとgeneratedHexを重複させない', () => {
  const originalIds = QUESTIONS.map(q => q.id);
  for (const count of [3, 5, 10]) {
    const draws = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const selected = selectQuestions(count, originalIds, seededRandom(seed));
      assert.equal(selected.length, count);
      assert.equal(new Set(selected.map(q => q.recipe.join(','))).size, count);
      assert.equal(new Set(selected.map(q => q.generatedHex.toUpperCase())).size, count);
      draws.add(selected.map(q => q.id).join(','));
    }
    assert.ok(draws.size > 1);
  }
  assert.deepEqual(QUESTIONS.map(q => q.id), originalIds);
});

test('全問モードは119問すべてをランダム順で出題する', () => {
  const ids = QUESTIONS.map(q => q.id);
  const first = selectQuestions('all', ids, seededRandom(1));
  const second = selectQuestions('all', ids, seededRandom(2));
  assert.equal(first.length, 119);
  assert.equal(new Set(first.map(q => q.id)).size, 119);
  assert.deepEqual([...first.map(q => q.id)].sort(), [...ids].sort());
  assert.notDeepEqual(first.map(q => q.id), second.map(q => q.id));
});

test('重複色も候補として残し、119問のどれも抽選で先頭になれる', () => {
  const ids = QUESTIONS.map(q => q.id);
  assert.ok(new Set(QUESTIONS.map(q => q.generatedHex)).size < 119);
  for (const q of QUESTIONS) {
    const candidates = [q.id, ...ids.filter(id => id !== q.id)];
    assert.equal(selectQuestions(10, candidates, () => 0.999999)[0].id, q.id);
  }
  const duplicate = QUESTIONS.find(q => q.id !== QUESTIONS[6].id && q.generatedHex === QUESTIONS[6].generatedHex)!;
  assert.ok(duplicate);
  assert.throws(() => selectQuestions(2, [QUESTIONS[6].id, duplicate.id]), /重複/);
  assert.throws(() => selectQuestions(3, ['missing']), /不明/);
  for (const count of [0, -1, 1.5, NaN, 120]) assert.throws(() => selectQuestions(count));
});

test('お題はgeneratedHexを参照し、sourceHexとsourceSimilarityは表示色・得点に影響しない', () => {
  const s = startQuestion(createSession(DEFAULT_SETTINGS, []));
  const changed = { ...s.currentQuestion, sourceHex: '#000000' as const, sourceSimilarity: 0 };
  assert.deepEqual(questionColor(changed), questionColor(s.currentQuestion));
  assert.deepEqual(questionColor({ ...changed, generatedHex: '#123456' }), { r: 18, g: 52, b: 86 });
  for (const recipe of [s.currentQuestion.recipe, [...s.currentQuestion.recipe].reverse(), [CARD_IDS[0]]]) {
    const original = saveAnswer(s, s.players[0].id, s.currentQuestion.id, recipe);
    const updated = saveAnswer({ ...s, currentQuestion: changed }, s.players[0].id, changed.id, recipe);
    assert.deepEqual(updated.answers, original.answers);
  }
});


test('採点もgeneratedHexをtargetに使い、別recipeは同色でも99.9%まで', () => {
  const s = startQuestion(createSession(DEFAULT_SETTINGS, []));
  const q = { ...s.currentQuestion, recipe: ['M50'] as const, generatedHex: '#70C6E0' as const };
  const changed = { ...s, currentQuestion: q };
  const answer = saveAnswer(changed, s.players[0].id, q.id, ['C70']).answers[0];
  assert.equal(answer.score, 99.9);
  assert.equal(saveAnswer(changed, s.players[0].id, q.id, q.recipe).answers[0].score, 100);
});
