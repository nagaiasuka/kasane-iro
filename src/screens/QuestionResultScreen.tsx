import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
import { PlayerResult } from '../components/PlayerResult';
import { RecipeDisplay } from '../components/RecipeDisplay';
import { canRevealAnswer } from '../game/session';
import { generateColor } from '../game/colorEngine';
import { GameSession, Question } from '../types/game';
export function QuestionResults({ session, question }: { session: GameSession; question: Question }) {
  const [width, setWidth] = useState(0);
  if (!canRevealAnswer(session, question.id)) return null;
  const solo = session.players.length === 1;
  const sideBySide = solo && width >= 360;
  const stackSlots = Math.max(question.recipe.length, ...session.answers.filter(a => a.questionId === question.id).map(a => a.recipe.length));
  return <View style={ui.panel} onLayout={event => setWidth(event.nativeEvent.layout.width)}><Text style={ui.label}>{question.name} ・ {question.reading}</Text>
    <View style={{ flexDirection: sideBySide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
    <View style={sideBySide ? { flex: 1, minWidth: 0 } : { width: '100%' }}>
      <RecipeDisplay title="正解" recipe={question.recipe} color={generateColor(question.recipe)} score={100}
        testID="canonical-answer" recipeTestID="answer-recipe" stackSlots={stackSlots} />
    </View>
    {[...session.players].sort((a, b) => (session.answers.find(x => x.playerId === b.id && x.questionId === question.id)?.score ?? 0) - (session.answers.find(x => x.playerId === a.id && x.questionId === question.id)?.score ?? 0)).map(player => {
      const answer = session.answers.find(a => a.questionId === question.id && a.playerId === player.id);
      return answer ? <View key={player.id} style={sideBySide ? { flex: 1, minWidth: 0 } : { width: '100%' }}>
        <PlayerResult player={player} answer={answer} solo={solo} stackSlots={stackSlots} />
      </View> : null;
    })}</View></View>;
}
export function QuestionResultScreen({ session, onNext }: { session: GameSession; onNext: () => void }) {
  const last = session.currentQuestionIndex === session.questions.length - 1;
  return <Screen title={`第${session.currentQuestionIndex + 1}問の結果`} subtitle="みんなの色を、見くらべてみましょう。">
    <QuestionResults session={session} question={session.currentQuestion} />
    <Button label={last ? '最終結果を見る' : '次の問題へ'} onPress={onNext} />
  </Screen>;
}
