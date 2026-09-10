import React from 'react';
import { Text, View } from 'react-native';
import { Player, PlayerAnswer } from '../types/game';
import { ColorSwatch } from './ColorSwatch';
import { ui } from './Screen';
export function PlayerResult({ player, answer }: { player: Player; answer: PlayerAnswer }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
    <ColorSwatch color={answer.color} /><View style={{ flex: 1 }}><Text style={ui.label}>{player.name}</Text>
      <Text style={ui.note}>{answer.score.toFixed(1)}%{!answer.recipe.length ? ' ・ 空回答' : ''}{answer.timedOut ? ' ・ 時間切れ' : ''}</Text></View>
  </View>;
}
