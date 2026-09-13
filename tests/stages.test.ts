import assert from 'node:assert/strict';
import test from 'node:test';
import { QUESTIONS, selectQuestions } from '../src/data/questions';
import { STAGES, findStage } from '../src/data/stages';
import { INITIAL_RELEASE_EXTRA_QUESTIONS, COLOR_LEARNING_QUESTIONS } from '../src/data/stage-questions.generated';
import { CARD_IDS } from '../src/game/cards';
import { generateColor } from '../src/game/colorEngine';
import { questionColor } from '../src/game/questionColor';
import { scoreAnswer } from '../src/game/scoring';
import { createSession, DEFAULT_SETTINGS } from '../src/game/session';

function seededRandom(seed: number) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

test('4ステージ119/40/40/30問・計229問を重複IDなく収録し見本は各ステージ所属', () => {
  assert.deepEqual(STAGES.map(s => [s.id, s.questionIds.length]), [
    ['traditional', 119], ['seasons', 40], ['nature', 40], ['color-learning', 30],
  ]);
  assert.equal(QUESTIONS.length, 229);
  assert.equal(new Set(QUESTIONS.map(q => q.id)).size, 229);
  assert.deepEqual(STAGES.flatMap(s => s.questionIds).sort(), QUESTIONS.map(q => q.id).sort());
  for (const stage of STAGES) {
    assert.equal(stage.previewQuestionIds.length, 4);
    assert.ok(stage.previewQuestionIds.every(id => stage.questionIds.includes(id)));
  }
  assert.equal(findStage('traditional-japan'), STAGES[0]);
});

test('追加110問の合成色がgeneratedHexと完全一致・正解100%・学習30問すべて解説あり', () => {
  assert.equal(INITIAL_RELEASE_EXTRA_QUESTIONS.length, 110);
  for (const question of INITIAL_RELEASE_EXTRA_QUESTIONS) {
    assert.deepEqual(generateColor(question.recipe), questionColor(question), question.id);
    assert.equal(scoreAnswer(question.recipe, question.recipe).score, 100, question.id);
    assert.equal(new Set(question.recipe).size, question.recipe.length);
    assert.ok(question.recipe.every(id => CARD_IDS.includes(id)));
    if (question.recipe.length > 1) assert.ok(scoreAnswer([...question.recipe].reverse(), question.recipe).score <= 99.9);
  }
  assert.equal(COLOR_LEARNING_QUESTIONS.length, 30);
  assert.ok(COLOR_LEARNING_QUESTIONS.every(q => q.explanation?.trim()));
});

test('全ステージで3/5/10問はステージ内からランダム抽選しrecipe/色を重複させない', () => {
  for (const stage of STAGES) for (const count of [3, 5, 10] as const) {
    const draws = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const selected = selectQuestions(count, stage.questionIds, seededRandom(seed));
      assert.equal(selected.length, count);
      assert.ok(selected.every(q => stage.questionIds.includes(q.id)));
      assert.equal(new Set(selected.map(q => q.recipe.join(','))).size, count);
      assert.equal(new Set(selected.map(q => q.generatedHex)).size, count);
      draws.add(selected.map(q => q.id).join(','));
    }
    assert.ok(draws.size > 1);
  }
});

test('全問は各ステージの全IDを一度ずつシャッフル、同じrecipe/色でも除外しない', () => {
  for (const stage of STAGES) {
    const first = selectQuestions('all', stage.questionIds, seededRandom(1));
    const second = selectQuestions('all', stage.questionIds, seededRandom(2));
    assert.equal(first.length, stage.questionIds.length);
    assert.deepEqual(first.map(q => q.id).sort(), [...stage.questionIds].sort());
    assert.notDeepEqual(first, second);
    const session = createSession({ ...DEFAULT_SETTINGS, questionCount: 'all' }, [], stage.questionIds);
    assert.deepEqual(session.questions.map(q => q.id).sort(), [...stage.questionIds].sort());
  }
  // Calls without a stage retain the original traditional-stage default.
  assert.equal(createSession({ ...DEFAULT_SETTINGS, questionCount: 'all' }, []).questions.length, 119);
});
