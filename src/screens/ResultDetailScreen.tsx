import React from 'react';
import { Button, Screen } from '../components/Screen';
import { GameSession } from '../types/game';
import { ResultComparison } from '../components/ResultComparison';
export function ResultDetailScreen({ session, questionIndex, onBack }: { session: GameSession; questionIndex: number; onBack: () => void }) {
  return <Screen compact title={`第${questionIndex + 1}問の詳細`}>
    <ResultComparison session={session} question={session.questions[questionIndex]} detailed />
    <Button label="最終結果へ戻る" onPress={onBack} />
  </Screen>;
}
