import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, ui } from '../components/Screen';
import { ColorSwatch } from '../components/ColorSwatch';
import { MiniCard } from '../components/MiniCard';
import { generateColor } from '../game/colorEngine';
import { CardId } from '../types/game';

export function HowToPlayScreen({ onBack }: { onBack: () => void }) {
  const [page, setPage] = useState(0);
  const sample = generateColor(['C70', 'Y70']);
  const titles = ['お題の色をつくろう', 'カードを重ねよう', 'どこまで近づける？'];
  return <Screen key={page} title={titles[page]} subtitle={`遊び方 ${page + 1}/3`}>
    <View style={{ flex: 1, justifyContent: 'center', gap: 24, minHeight: 240 }}>
      {page === 0 && <><View style={{ alignItems: 'center' }}><ColorSwatch color={sample} size={150} /></View>
        <Text style={ui.label}>画面に表示された色を、7枚のカードを使って再現します。</Text></>}
      {page === 1 && <><View style={{ alignSelf: 'center', width: 190, height: 150 }}>
        {(['C70', 'M70', 'Y70'] as CardId[]).map((id, i) => <View key={id} style={{ position: 'absolute', left: i * 52, top: i * 22 }}><MiniCard id={id} showLabel={false} /></View>)}
        </View><Text style={ui.note}>カードをドラッグして重ねます。{'\n'}手札へ戻すとカードを外せます。{'\n'}重ねる順番でも色が変わります。</Text></>}
      {page === 2 && <><View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
        {['お題', 'あなたの色'].map(label => <View key={label} style={{ alignItems: 'center', gap: 10 }}><Text style={ui.note}>{label}</Text><ColorSwatch color={sample} size={90} /></View>)}
        </View><Text style={[ui.title, { textAlign: 'center', marginTop: 0 }]}>100.0%</Text>
        <Text style={ui.note}>お題に近いほど再現率が高くなります。{'\n'}ぴったり再現できれば100.0%！</Text>
        <Text style={ui.note}>2〜4人では、1台のスマホを順番に渡して遊べます。</Text></>}
    </View>
    <Text accessibilityLabel={`全3ページ中${page + 1}ページ`} style={[ui.note, { textAlign: 'center', letterSpacing: 8 }]}>{[0, 1, 2].map(i => i === page ? '●' : '○').join(' ')}</Text>
    <Button label={page === 2 ? 'わかった' : '次へ'} onPress={() => page === 2 ? onBack() : setPage(page + 1)} />
    <Button label={page === 0 ? 'タイトルへ戻る' : '戻る'} secondary onPress={() => page === 0 ? onBack() : setPage(page - 1)} />
  </Screen>;
}
