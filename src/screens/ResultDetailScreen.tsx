import React from 'react';
import { Button, Screen } from '../components/Screen';
import { GameSession } from '../types/game';
import { QuestionResults } from './QuestionResultScreen';
export function ResultDetailScreen({ session, questionIndex, onBack }: { session: GameSession; questionIndex: number; onBack: () => void }) {
  return <Screen title={`第${questionIndex + 1}問の詳細`} subtitle="お題と、みんなの色を見くらべましょう。">
    <QuestionResults session={session} question={session.questions[questionIndex]} />
    <Button label="最終結果へ戻る" onPress={onBack} />
  </Screen>;
}
