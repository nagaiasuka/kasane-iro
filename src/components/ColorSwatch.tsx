import React from 'react';
import { View } from 'react-native';
import { rgbStyle } from '../game/colorEngine';
import { RGB } from '../types/game';
export function ColorSwatch({ color, size = 52 }: { color: RGB; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: rgbStyle(color) }} />;
}
