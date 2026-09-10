import React from 'react';
import { Text, View } from 'react-native';
import { CardId } from '../types/game';
import { MiniCard } from './MiniCard';
import { ui } from './Screen';
export function RecipeDisplay({ recipe }: { recipe: readonly CardId[] }) {
  return <View testID="answer-recipe" style={{ gap: 12 }}><Text style={ui.note}>重ねる順番　下 → 上</Text>
    {recipe.map((id, i) => <View key={`${i}:${id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
      <View style={{ width: 80, gap: 4 }}><Text style={ui.label}>{i + 1}枚目</Text>
        <Text style={ui.note}>{recipe.length === 1 ? 'この1枚' : i === 0 ? 'いちばん下' : i === recipe.length - 1 ? 'いちばん上' : '↓'}</Text></View>
      <MiniCard id={id} />
    </View>)}
  </View>;
}
