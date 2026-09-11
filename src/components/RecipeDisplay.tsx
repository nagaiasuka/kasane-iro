import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CardId, RGB } from '../types/game';
import { ColorSwatch } from './ColorSwatch';
import { CompactRecipeStack, StackSize } from './CompactRecipeStack';

type Props = {
  title: string; recipe: readonly CardId[]; color: RGB; score: number;
  testID: string; recipeTestID: string; stackSlots: number; timedOut?: boolean;
  size?: StackSize; banner?: boolean;
};

export function RecipeDisplay({ title, recipe, color, score, testID, recipeTestID, stackSlots, timedOut, size = 'large', banner = false }: Props) {
  const small = size === 'small';
  const canonical = testID === 'canonical-answer';
  return <View testID={testID} style={[styles.result, canonical && styles.canonical, banner && styles.banner]}>
    <View style={banner && styles.bannerHeading}>
      <Text accessibilityRole="header" accessibilityLabel={title} numberOfLines={2} style={[styles.title, small && { minHeight: 16 }]}>{title}</Text>
      <Text accessibilityLabel={`再現率 ${score.toFixed(1)}%`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
        style={[styles.score, size !== 'large' && { fontSize: 21 }]}>{score.toFixed(1)}<Text style={{ fontSize: size === 'large' ? 16 : 12 }}>%</Text></Text>
    </View>
    <View style={[styles.visuals, (small || banner) && styles.inlineVisuals, banner && { flex: 1 }]}>
      <View testID={`${testID}-color`} accessible accessibilityLabel={`${title}の完成色`}>
        <ColorSwatch color={color} size={size === 'large' ? 52 : 40} />
      </View>
      <View style={(small || banner) ? styles.inlineStack : styles.stack}>
        <CompactRecipeStack recipe={recipe} size={size} stackSlots={stackSlots} testID={recipeTestID} />
      </View>
    </View>
    {(!recipe.length || timedOut) && <Text style={styles.note}>{[!recipe.length && '空回答', timedOut && '時間切れ'].filter(Boolean).join(' ・ ')}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  result: { width: '100%', padding: 8, gap: 6, backgroundColor: '#FDFCF8', borderRadius: 12, borderWidth: 1, borderColor: '#E3DFD2' },
  canonical: { borderColor: '#9DAF96', backgroundColor: '#EFF2E8' },
  title: { color: '#53634F', fontSize: 12, lineHeight: 16, minHeight: 32 },
  score: { color: '#334735', fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
  visuals: { alignItems: 'center', gap: 8 },
  inlineVisuals: { flexDirection: 'row', gap: 6 },
  stack: { width: '100%' },
  inlineStack: { flex: 1, minWidth: 0 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerHeading: { width: 86 },
  note: { color: '#7D8372', fontSize: 10 },
});
