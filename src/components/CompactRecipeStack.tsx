import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CARD_LABELS } from '../game/cards';
import { PAPER, rgbStyle } from '../game/colorEngine';
import { CardId } from '../types/game';
import { ColorCard } from './ColorCard';

export type StackSize = 'large' | 'medium' | 'small';
const dimensions = {
  large: { cardHeight: 96, cardWidth: 132, step: 16 },
  medium: { cardHeight: 64, cardWidth: 92, step: 10 },
  small: { cardHeight: 28, cardWidth: 76, step: 4 },
};
const ignoreDrag = () => {};

export function CompactRecipeStack({ recipe, size, stackSlots, testID }: {
  recipe: readonly CardId[]; size: StackSize; stackSlots: number; testID: string;
}) {
  const [width, setWidth] = useState(0);
  const { cardHeight, cardWidth, step } = dimensions[size];
  const height = cardHeight + Math.max(0, stackSlots - 1) * step + 8;
  const actualWidth = Math.min(cardWidth, Math.max(0, width - 12));
  return <View testID={testID} pointerEvents="none" accessible
    accessibilityLabel={recipe.length ? `カードの重ね順、下から上へ：${recipe.map(id => CARD_LABELS[id]).join('、')}` : '使用したカードはありません'}
    onLayout={event => setWidth(event.nativeEvent.layout.width)} style={[styles.paper, { height }]}>
    {width > 0 && recipe.map((id, index) => <ColorCard key={`${index}:${id}`}
      testID={`${testID}-card-${index}`} id={id} placed locked showLabel={size === 'large'}
      position={{ x: (width - actualWidth) / 2, y: 4 + index * step }}
      width={actualWidth} height={cardHeight} zIndex={index + 10} onStart={ignoreDrag} onDrop={ignoreDrag} />)}
    {!recipe.length && <Text style={styles.empty}>カードなし</Text>}
  </View>;
}

const styles = StyleSheet.create({
  paper: { width: '100%', backgroundColor: rgbStyle(PAPER), borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 10, color: '#7D8372' },
});
