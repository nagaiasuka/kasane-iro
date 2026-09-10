import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CARD_LABELS } from '../game/cards';
import { CardId, RGB } from '../types/game';
import { ColorCard } from './ColorCard';
import { ColorSwatch } from './ColorSwatch';
import { PlayField } from './PlayField';
import { ui } from './Screen';

const ignoreDrag = () => {};

type Props = {
  title: string; recipe: readonly CardId[]; color: RGB; score: number;
  testID: string; recipeTestID: string; stackSlots: number; timedOut?: boolean;
};

export function RecipeDisplay({ title, recipe, color, score, testID, recipeTestID, stackSlots, timedOut }: Props) {
  const [width, setWidth] = useState(0);
  const cardWidth = Math.min(160, Math.max(0, width - 48));
  const cardHeight = 130;
  const step = 18;
  const height = 32 + cardHeight + Math.max(0, stackSlots - 1) * step + 32;

  return <View testID={testID} style={[ui.panel, styles.result]}>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.score}>再現率 {score.toFixed(1)}%</Text>
    <View testID={`${testID}-color`} style={styles.finished}>
      <ColorSwatch color={color} size={64} />
      <Text style={styles.order}>完成色</Text>
    </View>
    <View testID={recipeTestID} style={styles.recipe}>
      <View
        style={{ height, width: '100%' }}
        onLayout={event => setWidth(event.nativeEvent.layout.width)}
        pointerEvents="none"
        accessible
        accessibilityLabel={recipe.length ? `${title}のカード、下から上へ：${recipe.map(id => CARD_LABELS[id]).join('、')}` : `${title}：使用したカードはありません`}
      >
        {width > 0 && <>
          <PlayField rect={{ x: 0, y: 0, width, height }} count={recipe.length} active={false} emptyMessage="使用したカードはありません" />
          {recipe.map((id, index) => <ColorCard
            key={`${index}:${id}`}
            testID={`${recipeTestID}-card-${index}`}
            id={id}
            position={{ x: (width - cardWidth) / 2, y: 32 + index * step }}
            width={cardWidth}
            height={cardHeight}
            zIndex={index + 10}
            placed
            locked
            onStart={ignoreDrag}
            onDrop={ignoreDrag}
          />)}
        </>}
      </View>
      {recipe.length > 0 && <Text style={styles.order}>奥が下・手前が上</Text>}
    </View>
    {(!recipe.length || timedOut) && <Text style={ui.note}>{[!recipe.length && '空回答', timedOut && '時間切れ'].filter(Boolean).join(' ・ ')}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  result: { width: '100%' },
  title: { color: '#334735', fontSize: 20, fontWeight: '600' },
  score: { color: '#334735', fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
  recipe: { gap: 6 },
  order: { color: '#7B8272', fontSize: 10, textAlign: 'center' },
  finished: { alignItems: 'center', gap: 6 },
});
