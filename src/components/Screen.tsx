import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { QuitButton } from './GameExit';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <SafeAreaView style={ui.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={ui.brand}>かさねいろ</Text><QuitButton /></View><Text accessibilityRole="header" style={ui.title}>{title}</Text>
      {subtitle && <Text style={ui.note}>{subtitle}</Text>}{children}
    </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function Button({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondary, pressed && { opacity: 0.7 }]}>
    <Text style={[ui.buttonText, secondary && { color: '#355746' }]}>{label}</Text></Pressable>;
}
export function Choices<T extends string | number | null>({ title, value, options, onChange }: {
  title: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <View style={ui.panel}><Text style={ui.label}>{title}</Text><View style={ui.options}>
    {options.map(option => <Pressable key={String(option.value)} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }}
      onPress={() => onChange(option.value)} style={[ui.option, value === option.value && ui.selected]}>
      <Text style={{ color: value === option.value ? '#FFFFFF' : '#355746' }}>{option.label}</Text></Pressable>)}
  </View></View>;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F4EC' },
  container: { flexGrow: 1, padding: 24, gap: 20, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { color: '#7F8774', letterSpacing: 4, fontSize: 13 },
  title: { color: '#2C483C', fontSize: 29, fontWeight: '600', marginTop: 14 },
  note: { color: '#7D8372', fontSize: 13, lineHeight: 22 },
  panel: { gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#E3DFD2' },
  label: { color: '#334735', fontSize: 17, lineHeight: 26 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#CBD0C1', minHeight: 48 },
  selected: { backgroundColor: '#355746', borderColor: '#355746' },
  button: { backgroundColor: '#355746', minHeight: 52, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#CBD0C1' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  input: { backgroundColor: '#FFFEFA', borderWidth: 1, borderColor: '#CBD0C1', borderRadius: 12, padding: 16, fontSize: 17, color: '#334735' },
});
