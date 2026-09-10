import React from 'react';
import { Player, PlayerAnswer } from '../types/game';
import { RecipeDisplay } from './RecipeDisplay';
export function PlayerResult({ player, answer, solo, stackSlots }: { player: Player; answer: PlayerAnswer; solo: boolean; stackSlots: number }) {
  return <RecipeDisplay title={solo ? 'あなた' : player.name} recipe={answer.recipe} color={answer.color}
    score={answer.score} timedOut={answer.timedOut} stackSlots={stackSlots}
    testID={`player-answer-${player.id}`} recipeTestID={`player-recipe-${player.id}`} />;
}
