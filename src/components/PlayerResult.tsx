import React from 'react';
import { Player, PlayerAnswer } from '../types/game';
import { RecipeDisplay } from './RecipeDisplay';
import { StackSize } from './CompactRecipeStack';
export function PlayerResult({ player, answer, stackSlots, size }: { player: Player; answer: PlayerAnswer; stackSlots: number; size: StackSize }) {
  return <RecipeDisplay title={player.name} recipe={answer.recipe} color={answer.color} size={size}
    score={answer.score} timedOut={answer.timedOut} stackSlots={stackSlots}
    testID={`player-answer-${player.id}`} recipeTestID={`player-recipe-${player.id}`} />;
}
