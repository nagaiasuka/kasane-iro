import React from 'react';
import { Button, Screen } from '../components/Screen';
export function HandoffScreen({ name, questionNumber, total, onReady }: { name: string; questionNumber: number; total: number; onReady: () => void }) {
  return <Screen title={`${name}さんに\nスマホを渡してください`} subtitle={`第${questionNumber}問 / ${total}問 ・ 準備ができたら「準備OK」を押してください。`}>
    <Button label="準備OK" onPress={onReady} />
  </Screen>;
}
