import { Answer, CardId, RGB } from '../types/game';
import { generateColor } from './colorEngine';

export function colorSimilarity(a: RGB, b: RGB): number {
  const distance = Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
  return Math.max(0, 100 * (1 - distance / (255 * Math.sqrt(3))));
}

export function scoreAnswer(recipe: readonly CardId[], correct: readonly CardId[]): Answer {
  const color = generateColor(recipe);
  const exact = recipe.length === correct.length && recipe.every((id, i) => id === correct[i]);
  // 表示の丸めによる誤った100.0%を避け、完全一致だけに100%を予約。
  const score = exact ? 100 : Math.min(99.9, colorSimilarity(color, generateColor(correct)));
  return { recipe: [...recipe], color, score };
}
