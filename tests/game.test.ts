import assert from 'node:assert/strict';
import test from 'node:test';
import { CARD_IDS } from '../src/game/cards';
import { generateColor, PAPER } from '../src/game/colorEngine';
import { colorSimilarity, scoreAnswer } from '../src/game/scoring';
import { contains, moveCard } from '../src/game/stack';
import { QUESTION } from '../src/data/questions';
import { CardId } from '../src/types/game';

test('仮問題の正解レシピは必ず100.0%', () => {
  const answer = scoreAnswer(QUESTION.recipe, QUESTION.recipe);
  assert.equal(answer.score.toFixed(1), '100.0');
  assert.deepEqual(answer.color, generateColor(QUESTION.recipe));
});

test('全13,699レシピについて自己一致100%、RGB範囲、重複なし', () => {
  let count = 0;
  function visit(recipe: CardId[]) {
    if (recipe.length) {
      count++;
      assert.equal(scoreAnswer(recipe, recipe).score, 100);
      for (const value of Object.values(generateColor(recipe))) assert.ok(value >= 0 && value <= 255);
    }
    for (const id of CARD_IDS) if (!recipe.includes(id)) visit([...recipe, id]);
  }
  visit([]);
  assert.equal(count, 13699);
});

test('白地に順番通り合成し、順序の違いを保持する', () => {
  assert.deepEqual(generateColor([]), PAPER);
  assert.deepEqual(generateColor(['C70']), { r: 112, g: 198, b: 224 });
  assert.notDeepEqual(generateColor(['C70', 'Y70']), generateColor(['Y70', 'C70']));
  assert.ok(scoreAnswer(['Y70', 'C70'], QUESTION.recipe).score < 100);
  assert.equal(colorSimilarity(PAPER, { r: 0, g: 0, b: 0 }), 0);
});

test('追加、重複防止、中段の返却、再追加、無効ドロップ', () => {
  let stack: CardId[] = [];
  stack = moveCard(stack, 'C70', 'field');
  stack = moveCard(stack, 'Y50', 'field');
  stack = moveCard(stack, 'M70', 'field');
  assert.deepEqual(moveCard(stack, 'C70', 'field'), stack);
  assert.deepEqual(moveCard(stack, 'C70', null), stack);
  stack = moveCard(stack, 'Y50', 'hand');
  assert.deepEqual(stack, ['C70', 'M70']);
  assert.deepEqual(moveCard(stack, 'Y50', 'field'), ['C70', 'M70', 'Y50']);
});

test('回答スナップショットは以後の操作に影響されない', () => {
  const stack: CardId[] = ['C70', 'Y70'];
  const answer = scoreAnswer(stack, QUESTION.recipe);
  stack.pop();
  assert.deepEqual(answer.recipe, ['C70', 'Y70']);
  assert.equal(answer.score, 100);
});

test('ドロップ先はカード中心で判定する', () => {
  const rect = { x: 12, y: 4, width: 200, height: 160 };
  assert.equal(contains(rect, { x: 100, y: 100 }), true);
  assert.equal(contains(rect, { x: 11, y: 100 }), false);
  assert.equal(contains(rect, { x: 100, y: 165 }), false);
});
