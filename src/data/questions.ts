import { Question } from '../types/game';
import { TRADITIONAL_COLOR_QUESTIONS } from './questions.generated';

export const QUESTIONS: readonly Question[] = TRADITIONAL_COLOR_QUESTIONS;
export const QUESTION = QUESTIONS[0];

// Shuffle before filtering so all traditional colors, including duplicates, remain eligible.
export function selectQuestions(
  count: number,
  questionIds: readonly string[] = QUESTIONS.map(q => q.id),
  random: () => number = Math.random,
): readonly Question[] {
  const available = questionIds.map(id => {
    const question = QUESTIONS.find(q => q.id === id);
    if (!question) throw new Error(`不明な問題: ${id}`);
    return question;
  });
  if (!Number.isInteger(count) || count < 1 || count > available.length) throw new Error('問題数が不正です');
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const recipes = new Set<string>();
  const colors = new Set<string>();
  const selected: Question[] = [];
  for (const question of available) {
    const recipe = question.recipe.join(',');
    const color = question.generatedHex.toUpperCase();
    if (recipes.has(recipe) || colors.has(color)) continue;
    selected.push(question);
    recipes.add(recipe);
    colors.add(color);
    if (selected.length === count) return selected;
  }
  throw new Error('重複しない問題が不足しています');
}
