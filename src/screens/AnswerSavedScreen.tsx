import React from 'react';
import { Text } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
// 回答内容をpropsに渡さず、受け渡し前の画面に色やスコアを出さない。
export function AnswerSavedScreen({ playerName, multiplayer, nextPlayer, showQuestionResult, lastQuestion, onNext }: {
  playerName: string; multiplayer: boolean; nextPlayer: boolean; showQuestionResult: boolean; lastQuestion: boolean; onNext: () => void;
}) {
  const label = nextPlayer ? '次へ' : showQuestionResult ? '結果を見る' : lastQuestion ? '最終結果を見る' : '次の問題へ';
  return <Screen title={multiplayer ? '回答を保存しました' : '回答しました'} subtitle={`${playerName}さん、おつかれさまでした。`}>
    {nextPlayer ? <Text style={ui.note}>次のプレイヤーへ進みます。</Text>
      : <Text style={ui.note}>{multiplayer ? '全員の回答がそろいました。' : '回答を保存しました。'}{showQuestionResult ? '結果を見てみましょう。' : lastQuestion ? '最終結果へ進みましょう。' : '次の問題へ進みましょう。'}</Text>}
    <Button label={label} onPress={onNext} />
  </Screen>;
}
