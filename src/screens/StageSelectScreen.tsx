import React from 'react';
import { Button, Screen } from '../components/Screen';
import { StageCard } from '../components/StageCard';
import { STAGES } from '../data/stages';
import { Stage } from '../types/game';
export function StageSelectScreen({ onSelect, onBack }: { onSelect: (stage: Stage) => void; onBack: () => void }) {
  return <Screen title="ステージを選ぶ" subtitle="今日は、どんな色を重ねましょう。">
    {STAGES.map(stage => <StageCard key={stage.id} stage={stage} onSelect={() => onSelect(stage)} />)}
    <Button label="タイトルへ戻る" secondary onPress={onBack} />
  </Screen>;
}
