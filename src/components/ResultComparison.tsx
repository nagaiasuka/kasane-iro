import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { canRevealAnswer } from '../game/session';
import { generateColor } from '../game/colorEngine';
import { GameSession, Question } from '../types/game';
import { RecipeDisplay } from './RecipeDisplay';
import { PlayerResult } from './PlayerResult';
import { StackSize } from './CompactRecipeStack';

export function ResultComparison({ session, question, detailed = false }: {
  session: GameSession; question: Question; detailed?: boolean;
}) {
  const { fontScale } = useWindowDimensions();
  if (!canRevealAnswer(session, question.id)) return null;
  const count = session.players.length;
  // Large accessibility text may use extra rows; the surrounding screen can scroll.
  const columns = fontScale > 1.4 ? 1 : count === 2 && !detailed ? 3 : 2;
  const size: StackSize = detailed || count === 1 ? 'large' : count === 2 ? 'medium' : 'small';
  const answers = session.players.flatMap(player => {
    const answer = session.answers.find(a => a.questionId === question.id && a.playerId === player.id);
    return answer ? [{ player, answer }] : [];
  }).sort((a, b) => b.answer.score - a.answer.score);
  const stackSlots = Math.max(question.recipe.length, ...answers.map(({ answer }) => answer.recipe.length));
  const canonical = <RecipeDisplay title="正解" recipe={question.recipe} color={generateColor(question.recipe)} score={100}
    testID="canonical-answer" recipeTestID="answer-recipe" stackSlots={stackSlots} size={size}
    banner={count === 4 && !detailed && columns > 1} />;
  const players = answers.map(({ player, answer }) => <PlayerResult key={player.id} player={player} answer={answer}
    stackSlots={stackSlots} size={size} />);
  const banner = count === 4 && !detailed;
  const cells = banner ? players : [canonical, ...players];
  const rows = Array.from({ length: Math.ceil(cells.length / columns) }, (_, i) => cells.slice(i * columns, (i + 1) * columns));

  return <View testID="result-comparison" style={styles.comparison}>
    <Text style={styles.question}>{question.name}<Text style={styles.reading}>　{question.reading}</Text></Text>
    {banner && canonical}
    {rows.map((row, i) => <View key={i} testID={`result-row-${i}`} style={styles.row}>
      {row.map((cell, j) => <View key={j} style={styles.cell}>{cell}</View>)}
      {row.length < columns && <View style={styles.cell} />}
    </View>)}
    <Text style={styles.hint}>完成色と重ね方を比較 · 奥が下、手前が上</Text>
  </View>;
}

const styles = StyleSheet.create({
  comparison: { gap: 8 },
  question: { color: '#334735', fontSize: 16 },
  reading: { color: '#7D8372', fontSize: 11 },
  row: { flexDirection: 'row', gap: 6, alignItems: 'stretch' },
  cell: { flex: 1, minWidth: 0 },
  hint: { color: '#7D8372', fontSize: 10, textAlign: 'center' },
});
