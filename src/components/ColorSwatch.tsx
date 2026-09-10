import React from 'react';
import { View } from 'react-native';
import { rgbStyle } from '../game/colorEngine';
import { RGB } from '../types/game';
export function ColorSwatch({ color }: { color: RGB }) {
  return <View style={{ width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: rgbStyle(color) }} />;
}
