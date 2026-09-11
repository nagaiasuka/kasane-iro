import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CardId, RGB } from '../types/game';
import { ColorSwatch } from './ColorSwatch';
import { CompactRecipeStack } from './CompactRecipeStack';
import { ResultTileLayout } from './resultLayout';

export type AdaptiveRecipeProps = {
  title: string; recipe: readonly CardId[]; color: RGB; score: number;
  testID: string; recipeTestID: string; stackSlots: number; timedOut?: boolean;
  layout: ResultTileLayout;
};

export function AdaptiveRecipeDisplay({ title, recipe, color, score, testID, recipeTestID, stackSlots, timedOut, layout: l }: AdaptiveRecipeProps) {
  const canonical = testID === 'canonical-answer';
  return <View testID={testID} style={[styles.tile, canonical && styles.canonical, {
    height: l.height, padding: l.padding, gap: l.gap, flexDirection: l.banner ? 'row' : 'column',
  }]}>
    <View style={{ width: l.headingWidth, height: l.banner ? undefined : l.headingHeight, justifyContent: 'center' }}>
      <Text accessibilityRole="header" accessibilityLabel={title} numberOfLines={2}
        style={[styles.name, { fontSize: l.nameFont, lineHeight: l.nameFont * 1.25, minHeight: l.nameHeight }]}>{title}</Text>
      <Text testID={`${testID}-score`} accessibilityLabel={`再現率 ${score.toFixed(1)}%`} numberOfLines={1}
        style={[styles.score, { fontSize: l.scoreFont, lineHeight: l.scoreFont * 1.2 }]}>{score.toFixed(1)}<Text style={{ fontSize: l.scoreFont * 0.55 }}>%</Text></Text>
    </View>
    <View style={{ flex: 1, minWidth: 0, alignItems: 'center', flexDirection: l.inline ? 'row' : 'column', gap: l.gap }}>
      <View testID={`${testID}-color`} accessible accessibilityLabel={`${title}の完成色`}>
        <ColorSwatch color={color} size={l.swatchSize} />
      </View>
      <View style={{ width: l.stackWidth, height: l.stackHeight }}>
        <CompactRecipeStack recipe={recipe} size="large" stackSlots={stackSlots} testID={recipeTestID} layout={l} />
      </View>
    </View>
    {(!recipe.length || timedOut) && <View pointerEvents="none" style={styles.status}>
      <Text style={styles.note}>{[!recipe.length && '空回答', timedOut && '時間切れ'].filter(Boolean).join(' ・ ')}</Text>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  tile: { width: '100%', borderRadius: 14, borderWidth: 1, borderColor: '#E3DFD2', backgroundColor: '#FDFCF8' },
  canonical: { borderColor: '#9DAF96', backgroundColor: '#EFF2E8' },
  name: { color: '#53634F' },
  score: { color: '#334735', fontWeight: '600', fontVariant: ['tabular-nums'] },
  status: { position: 'absolute', bottom: 4, left: 4, right: 4, alignItems: 'center' },
  note: { color: '#53634F', backgroundColor: '#FDFCF8', fontSize: 10, paddingHorizontal: 4 },
});
