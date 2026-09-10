import React from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
import { ranking } from '../game/session';
import { GameSession } from '../types/game';
import { QuestionResults } from './QuestionResultScreen';
export function FinalResultScreen({ session, onReplay, onTitle }: { session: GameSession; onReplay: () => void; onTitle: () => void }) {
  return <Screen title="最終結果" subtitle={`${session.questions.length}問の平均再現率。おつかれさまでした。`}>
    {ranking(session).map(({ player, average, rank }) => <View key={player.id} style={ui.panel}>
      <Text style={ui.label}>{rank}位　{player.name}</Text><Text style={[ui.title, { marginTop: 0 }]}>{average.toFixed(1)}%</Text>
    </View>)}
    <Button label="もう一度遊ぶ" onPress={onReplay} /><Button label="タイトルへ戻る" secondary onPress={onTitle} />
    <Text style={ui.label}>各問題の振り返り</Text>
    {session.questions.map(question => <QuestionResults key={question.id} session={session} question={question} />)}
  </Screen>;
}
