import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Rect } from '../game/stack';

export function PlayField({ rect, count, active }: { rect: Rect; count: number; active: boolean }) {
  return (
    <View testID="play-field" pointerEvents="none" style={[styles.field, {
      left: rect.x, top: rect.y, width: rect.width, height: rect.height,
      borderColor: active ? '#688B75' : '#D6DCD2',
    }]}>
      <Text style={styles.heading}>色をかさねる場所</Text>
      {count === 0 && <View style={styles.empty}><Text style={styles.plus}>＋</Text><Text style={styles.hint}>手札から、ここへ</Text></View>}
      <Text style={styles.count}>{count} / 7 枚</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  heading: { color: '#758379', fontSize: 10, letterSpacing: 2, marginTop: 10 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  plus: { color: '#C0CCBF', fontSize: 38, fontWeight: '200' },
  hint: { color: '#939C91', fontSize: 12, marginTop: 5 },
  count: { position: 'absolute', bottom: 9, right: 14, color: '#849180', fontSize: 10 },
});
