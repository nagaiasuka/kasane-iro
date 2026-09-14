import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Screen } from '../components/Screen';

export function TitleScreen({ onStart, onHowTo, onResume, resumeLabel, onSettings }: {
  onSettings: () => void;
  onStart: () => void;
  onHowTo: () => void;
  onResume?: () => void;
  resumeLabel?: string;
}) {
  return <Screen title="かさねいろ" subtitle="重ねて色をつくるゲーム">
    <View style={{ flex: 1, minHeight: 150, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
      {['rgba(0,150,200,0.4)', 'rgba(220,60,120,0.4)', 'rgba(245,215,0,0.5)'].map((color, i) =>
        <View key={color} style={{ width: 95, height: 145, backgroundColor: color, borderRadius: 12, marginLeft: i ? -40 : 0, transform: [{ rotate: `${(i - 1) * 12}deg` }] }} />)}
    </View>
    {onResume && <Button label={resumeLabel || '全問のつづきから'} onPress={onResume} />}
    <Button label="ゲームをはじめる" onPress={onStart} />
    <Button label="遊び方" secondary onPress={onHowTo} />
    <Pressable accessibilityRole="button" accessibilityLabel="設定" onPress={onSettings}
      style={({ pressed }) => ({ alignSelf: 'center', minHeight: 44, minWidth: 80, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ color: '#7D8372', fontSize: 13 }}>設定</Text>
    </Pressable>
  </Screen>;
}
