import React from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
import { ColorSwatch } from '../components/ColorSwatch';
import { cardStyle, generateColor } from '../game/colorEngine';
import { CardId } from '../types/game';
export function HowToPlayScreen({ onBack }: { onBack: () => void }) {
  return <Screen title="遊び方" subtitle="7枚のカードで、お題の色に近づけましょう。">
    <View style={ui.panel}><Text style={ui.label}>1　お題の色を見よう</Text>
      <ColorSwatch color={generateColor(['C70', 'Y70'])} size={80} /><Text style={ui.note}>画面に表示されたお題の色を目指します。</Text></View>
    <View style={ui.panel}><Text style={ui.label}>2　カードを重ねよう</Text>
      <View style={{ height: 110, marginVertical: 8 }}>{(['C70', 'M70', 'Y70'] as CardId[]).map((id, i) =>
        <View key={id} style={{ position: 'absolute', left: i * 48, top: i * 12, width: 90, height: 80, borderRadius: 9, backgroundColor: cardStyle(id), borderWidth: 1, borderColor: '#CBD0C1', padding: 10 }}><Text>{id[0]}</Text></View>)}</View>
      <Text style={ui.note}>7枚の半透明カードをドラッグして重ねます。手札へ戻すと、そのカードを外せます。</Text></View>
    <View style={ui.panel}><Text style={ui.label}>3　重ねる順番も大切</Text><Text style={ui.note}>下 → 上の順番で色が変わります。</Text>
      <View style={{ flexDirection: 'row', gap: 24 }}>{[ ['C70', 'Y70'], ['Y70', 'C70'] ].map(recipe => <View key={recipe.join()} style={{ gap: 8 }}>
        <ColorSwatch color={generateColor(recipe as CardId[])} /><Text style={ui.note}>{recipe.join(' → ')}</Text></View>)}</View></View>
    <View style={ui.panel}><Text style={ui.label}>4　お題に近づけて回答</Text><Text style={ui.title}>100.0%</Text>
      <Text style={ui.note}>お題に近いほど再現率が高くなります。できたら「この色で回答する」を押しましょう。</Text></View>
    <Text style={ui.note}>2〜4人では、1台のスマホを順番に渡して遊びます。前の人の回答は、全員の回答が終わるまで見えません。</Text>
    <Button label="わかった" onPress={onBack} />
  </Screen>;
}
