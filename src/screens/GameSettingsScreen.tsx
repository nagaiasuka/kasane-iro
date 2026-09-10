import React from 'react';
import { Button, Choices, Screen } from '../components/Screen';
import { GameSettings } from '../types/game';
export function GameSettingsScreen({ settings, onChange, onNext }: {
  settings: GameSettings; onChange: (settings: GameSettings) => void; onNext: () => void;
}) {
  return <Screen title="遊び方を選ぶ" subtitle="ひとりでも、みんなでも。">
    <Choices title="プレイヤー人数" value={settings.playerCount} options={([1, 2, 3, 4] as const).map(value => ({ value, label: `${value}人` }))} onChange={playerCount => onChange({ ...settings, playerCount })} />
    <Choices title="問題数" value={settings.questionCount} options={([3, 5, 10] as const).map(value => ({ value, label: `${value}問` }))} onChange={questionCount => onChange({ ...settings, questionCount })} />
    <Choices title="制限時間" value={settings.timeLimit} options={([15, 30, 60, null] as const).map(value => ({ value, label: value === null ? '無制限' : `${value}秒` }))} onChange={timeLimit => onChange({ ...settings, timeLimit })} />
    <Choices title="結果表示タイミング" value={settings.resultTiming} options={[{ value: 'question', label: '1問ごとに表示' }, { value: 'final', label: '最後にまとめて表示' }]} onChange={resultTiming => onChange({ ...settings, resultTiming })} />
    <Button label="次へ" onPress={onNext} />
  </Screen>;
}
