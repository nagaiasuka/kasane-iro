import React from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
import { ranking } from '../game/session';
import { GameSession } from '../types/game';
export function FinalResultScreen({ session, onReplay, onTitle, onDetail }: { session: GameSession; onDetail: (index: number) => void; onReplay: () => void; onTitle: () => void }) {
  return <Screen title="最終結果" subtitle={`${session.questions.length}問の平均再現率。おつかれさまでした。`}>
    {ranking(session).map(({ player, average, rank }) => <View key={player.id} style={ui.panel}>
      <Text style={ui.label}>{session.players.length === 1 ? 'あなたの平均再現率' : `${rank}位　${player.name}`}</Text><Text style={[ui.title, { marginTop: 0 }]}>{average.toFixed(1)}%</Text>
    </View>)}
    <Text style={ui.label}>問題ごとの振り返り（全{session.questions.length}問）</Text>
    {session.questions.map((question, index) => <Button key={question.id} secondary label={`第${index + 1}問 ${question.name}　詳細を見る`} onPress={() => onDetail(index)} />)}
    <Button label="もう一度遊ぶ" onPress={onReplay} /><Button label="タイトルへ戻る" secondary onPress={onTitle} />
  </Screen>;
}
