import { CardId, GameSession } from '../types/game';
import { ranking } from '../game/session';
import { SeType } from './AudioManager';

// Observe the committed output of moveCard. Drag start, cancellation, and no-op drops are silent.
export function cardDropSound(before: readonly CardId[], after: readonly CardId[]): SeType | null {
  if (after.length > before.length) return 'card-place';
  if (after.length < before.length) return 'card-remove';
  return null;
}

export function resultSound(scores: readonly number[]): SeType {
  // Use the existing score directly: never round 99.9 or recalculate an answer.
  return scores.some(score => score === 100) ? 'perfect' : 'result';
}

export function sessionSound(before: GameSession, after: GameSession): SeType | null {
  if (before === after) return null;
  if (after.answers.length > before.answers.length) {
    return after.answers[after.answers.length - 1].timedOut ? null : 'confirm';
  }
  if (after.gameStatus === 'questionResult' && before.gameStatus !== 'questionResult') {
    return resultSound(after.answers.filter(a => a.questionId === after.currentQuestion.id).map(a => a.score));
  }
  if (after.gameStatus === 'finished' && before.gameStatus !== 'finished') {
    return resultSound(ranking(after).map(entry => entry.average));
  }
  return null;
}
