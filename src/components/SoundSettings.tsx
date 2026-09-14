import React from 'react';
import { Modal, Pressable, Switch, Text, View } from 'react-native';
import { useSound } from '../audio/SoundProvider';
import { Button, ui } from './Screen';

export function SoundSettings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, setSettings } = useSound();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(30,40,30,0.25)' }}>
      <Pressable accessibilityLabel="設定を閉じる" accessibilityRole="button" onPress={onClose}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <View accessibilityViewIsModal style={{ backgroundColor: '#F7F4EC', padding: 24, borderRadius: 18, gap: 16, width: '100%', maxWidth: 420, alignSelf: 'center' }}>
        <Text accessibilityRole="header" style={[ui.title, { marginTop: 0, fontSize: 23 }]}>サウンド</Text>
        {(['bgm', 'se'] as const).map(key => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
          <Text style={ui.label}>{key === 'bgm' ? 'BGM' : '効果音'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={ui.note}>{state[key] ? 'ON' : 'OFF'}</Text>
            <Switch accessibilityLabel={key === 'bgm' ? 'BGM' : '効果音'} value={state[key]} disabled={!state.ready}
              trackColor={{ false: '#CBD0C1', true: '#6F8B77' }} thumbColor="#FFFEFA"
              onValueChange={value => setSettings({ bgm: state.bgm, se: state.se, [key]: value })} />
          </View>
        </View>)}
        {state.saveError && <Text accessibilityLiveRegion="polite" style={ui.note}>設定を保存できませんでした。もう一度切り替えてください。</Text>}
        <Button label="閉じる" secondary onPress={onClose} />
      </View>
    </View>
  </Modal>;
}
