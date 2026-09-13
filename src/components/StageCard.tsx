import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stage } from '../types/game';
import { QUESTIONS } from '../data/questions';
import { questionColor } from '../game/questionColor';
import { ColorSwatch } from './ColorSwatch';
import { ui } from './Screen';
export function StageCard({ stage, onSelect }: { stage: Stage; onSelect: () => void }) {
  const total = stage.questionIds.length;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${stage.name}を選ぶ`} onPress={onSelect}
    style={({ pressed }) => [{ padding: 22, gap: 18, borderWidth: 1, borderColor: '#CBD0C1', borderRadius: 18, backgroundColor: '#FFFEFA' }, pressed && { opacity: 0.7 }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
      <Text style={ui.label}>{stage.name}</Text>
      <Text accessibilityLabel={`収録問題数 ${total}問`} style={{ color: '#53634F', backgroundColor: '#EFF2E8', fontSize: 12, lineHeight: 20, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>全{total}問</Text>
    </View>
    <Text style={ui.note}>{stage.description}</Text>
    <View style={{ flexDirection: 'row', gap: 10 }}>{['chigusa', 'kariyasu', 'seiji', 'imayoh'].map(id => {
      const question = QUESTIONS.find(q => q.id === id);
      return question ? <ColorSwatch key={id} color={questionColor(question)} size={44} /> : null;
    })}</View>
    <Text style={ui.note}>出題数：3 / 5 / 10 / 全{total}問</Text><Text style={ui.label}>このステージで遊ぶ →</Text>
  </Pressable>;
}
