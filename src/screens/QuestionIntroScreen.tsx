import React from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
import { ColorSwatch } from '../components/ColorSwatch';
import { questionColor } from '../game/questionColor';
import { Question } from '../types/game';
export function QuestionIntroScreen({ question, number, total, playerName, onStart }: {
  question: Question; number: number; total: number; playerName: string; onStart: () => void;
}) {
  return <Screen title={`第${number}問 / ${total}問`} subtitle={`${playerName}さんの番です`}>
    <View style={[ui.panel, { alignItems: 'center', gap: 16 }]}><Text style={ui.title}>{question.name}</Text>
      <Text style={ui.note}>{question.romanized}</Text><ColorSwatch color={questionColor(question)} size={140} />
      <Text style={ui.label}>この色をつくってください</Text></View>
    <Text style={ui.note}>「はじめる」を押すと問題が始まります。</Text><Button label="はじめる" onPress={onStart} />
  </Screen>;
}
