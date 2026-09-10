import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

const ExitContext = createContext<(() => void) | undefined>(undefined);
export function QuitButton() {
  const onQuit = useContext(ExitContext);
  return onQuit ? <Pressable accessibilityRole="button" accessibilityLabel="ゲームをやめる" onPress={onQuit}
    style={({ pressed }) => [{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }, pressed && { opacity: 0.6 }]}>
    <Text style={{ fontSize: 12, color: '#687563' }}>× やめる</Text></Pressable> : null;
}
export function GameExit({ children, onExit, enabled }: { children: ReactNode; onExit: () => void; enabled: boolean }) {
  const [visible, setVisible] = useState(false);
  return <ExitContext.Provider value={enabled ? () => setVisible(true) : undefined}>
    {children}
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(25,40,30,0.4)', justifyContent: 'center', padding: 24 }}>
        <View accessibilityViewIsModal style={{ backgroundColor: '#F7F4EC', borderRadius: 18, padding: 24, gap: 20, maxWidth: 420, width: '100%', alignSelf: 'center' }}>
          <Text accessibilityRole="header" style={{ fontSize: 23, color: '#2C483C' }}>ゲームをやめますか？</Text>
          <Text style={{ color: '#687563', lineHeight: 23 }}>ここまでの結果は失われます。制限時間は確認中も進みます。</Text>
          <Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={{ backgroundColor: '#355746', borderRadius: 14, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15 }}>ゲームを続ける</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onExit} style={{ borderWidth: 1, borderColor: '#CBD0C1', borderRadius: 14, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#355746', fontSize: 15 }}>タイトルへ戻る</Text></Pressable>
        </View>
      </View>
    </Modal>
  </ExitContext.Provider>;
}
