import assert from 'node:assert/strict';
import test from 'node:test';
import { backAction } from '../src/navigation/backAction';

test('Android戻るは準備画面の親へ戻りタイトルだけOSに委ねる', () => {
  assert.equal(backAction('title'), 'system');
  assert.equal(backAction('howTo'), 'title');
  assert.equal(backAction('stages'), 'title');
  assert.equal(backAction('settings'), 'stages');
  assert.equal(backAction('players'), 'settings');
});

test('ゲーム中は終了確認、終了後の詳細は結果へ、結果はタイトルへ戻る', () => {
  for (const status of ['handoff','questionIntro','playing','answerSaved','questionResult'] as const) {
    assert.equal(backAction('game', status), 'confirmExit');
  }
  assert.equal(backAction('game', 'finished', true), 'result');
  assert.equal(backAction('game', 'finished'), 'title');
});
