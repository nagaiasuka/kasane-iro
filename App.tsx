import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayScreen } from './src/screens/PlayScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F4EC" />
      <PlayScreen />
    </SafeAreaProvider>
  );
}
