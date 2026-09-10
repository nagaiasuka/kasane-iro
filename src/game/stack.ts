import { CardId } from '../types/game';

export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
export const contains = (rect: Rect, point: Point) =>
  point.x >= rect.x && point.x <= rect.x + rect.width &&
  point.y >= rect.y && point.y <= rect.y + rect.height;

export function moveCard(stack: readonly CardId[], id: CardId, destination: 'field' | 'hand' | null): CardId[] {
  if (destination === 'hand') return stack.filter(card => card !== id);
  if (destination === 'field' && !stack.includes(id)) return [...stack, id];
  return [...stack];
}
