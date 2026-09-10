import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
export function PlayerSetupScreen({ count, onStart, onBack }: { count: number; onStart: (names: string[]) => void; onBack: () => void }) {
  const [names, setNames] = useState(Array.from({ length: count }, (_, i) => `プレイヤー${i + 1}`));
  return <Screen title="お名前を教えてください" subtitle="空欄の場合は、元のプレイヤー名を使います。">
    {names.map((name, i) => <View key={i} style={{ gap: 8 }}><Text style={ui.label}>プレイヤー{i + 1}</Text>
      <TextInput accessibilityLabel={`プレイヤー${i + 1}の名前`} style={ui.input} value={name} maxLength={24} onChangeText={text => setNames(current => current.map((n, j) => j === i ? text : n))} />
    </View>)}<Button label="ゲームをはじめる" onPress={() => onStart(names)} /><Button label="設定へ戻る" secondary onPress={onBack} />
  </Screen>;
}
