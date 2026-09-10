import React from 'react';
import { Text, View } from 'react-native';
import { cardStyle } from '../game/colorEngine';
import { CardId } from '../types/game';
// 同じ色定義・枠線・角丸・ラベルを使う、操作しないカード見本。
export function MiniCard({ id, showLabel = true }: { id: CardId; showLabel?: boolean }) {
  return <View accessibilityLabel={showLabel ? `${id}のカード` : '半透明のカラーカード'} style={{ width: 76, height: 94,
    backgroundColor: cardStyle(id), borderRadius: 9, borderWidth: 1, borderColor: 'rgba(38, 56, 48, 0.24)' }}>
    {showLabel && <Text style={{ fontSize: 11, fontWeight: '700', color: '#253E37', marginLeft: 9, marginTop: 2 }}>{id}</Text>}
    <Text style={{ position: 'absolute', bottom: 9, alignSelf: 'center', fontSize: 8, color: '#354A42', letterSpacing: 1 }}>かさねいろ</Text>
  </View>;
}
