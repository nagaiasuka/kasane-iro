import React from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
import { ColorSwatch } from '../components/ColorSwatch';
import { PlayerResult } from '../components/PlayerResult';
import { RecipeDisplay } from '../components/RecipeDisplay';
import { canRevealAnswer } from '../game/session';
import { generateColor } from '../game/colorEngine';
import { GameSession, Question } from '../types/game';
export function QuestionResults({ session, question }: { session: GameSession; question: Question }) {
  if (!canRevealAnswer(session, question.id)) return null;
  return <View style={ui.panel}><Text style={ui.label}>{question.name} ・ {question.reading}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><ColorSwatch color={generateColor(question.recipe)} size={100} /><Text style={ui.note}>お題</Text></View>
    <View testID="canonical-answer" style={ui.panel}>
      <Text style={ui.label}>正解　100.0%</Text>
      <ColorSwatch color={generateColor(question.recipe)} />
      <RecipeDisplay recipe={question.recipe} />
    </View>
    {[...session.players].sort((a, b) => (session.answers.find(x => x.playerId === b.id && x.questionId === question.id)?.score ?? 0) - (session.answers.find(x => x.playerId === a.id && x.questionId === question.id)?.score ?? 0)).map(player => {
      const answer = session.answers.find(a => a.questionId === question.id && a.playerId === player.id);
      return answer ? <PlayerResult key={player.id} player={player} answer={answer} /> : null;
    })}</View>;
}
export function QuestionResultScreen({ session, onNext }: { session: GameSession; onNext: () => void }) {
  const last = session.currentQuestionIndex === session.questions.length - 1;
  return <Screen title={`第${session.currentQuestionIndex + 1}問の結果`} subtitle="みんなの色を、見くらべてみましょう。">
    <QuestionResults session={session} question={session.currentQuestion} />
    <Button label={last ? '最終結果を見る' : '次の問題へ'} onPress={onNext} />
  </Screen>;
}
