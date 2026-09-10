import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stage } from '../types/game';
import { QUESTIONS } from '../data/questions';
import { generateColor } from '../game/colorEngine';
import { ColorSwatch } from './ColorSwatch';
import { ui } from './Screen';
export function StageCard({ stage, onSelect }: { stage: Stage; onSelect: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${stage.name}を選ぶ`} onPress={onSelect}
    style={({ pressed }) => [{ padding: 22, gap: 18, borderWidth: 1, borderColor: '#CBD0C1', borderRadius: 18, backgroundColor: '#FFFEFA' }, pressed && { opacity: 0.7 }]}>
    <View style={{ flexDirection: 'row', gap: 10 }}>{stage.questionIds.slice(0, 3).map(id => {
      const question = QUESTIONS.find(q => q.id === id);
      return question ? <ColorSwatch key={id} color={generateColor(question.recipe)} /> : null;
    })}</View><Text style={ui.label}>{stage.name}</Text><Text style={ui.note}>{stage.description}</Text>
    <Text style={ui.note}>3 / 5 / 10問</Text><Text style={ui.label}>このステージで遊ぶ →</Text>
  </Pressable>;
}
