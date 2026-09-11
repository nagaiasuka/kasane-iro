import React from 'react';
import { Button, Screen } from '../components/Screen';
import { ResultComparison } from '../components/ResultComparison';
import { GameSession } from '../types/game';

export function QuestionResultScreen({ session, onNext }: { session: GameSession; onNext: () => void }) {
  const last = session.currentQuestionIndex === session.questions.length - 1;
  return <Screen compact title={`第${session.currentQuestionIndex + 1}問の結果`}>
    <ResultComparison session={session} question={session.currentQuestion} />
    <Button label={last ? '最終結果を見る' : '次の問題へ'} onPress={onNext} />
  </Screen>;
}
