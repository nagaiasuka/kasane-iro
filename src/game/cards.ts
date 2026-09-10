import { CardDefinition, CardId } from '../types/game';

export const CARD_IDS: readonly CardId[] = ['C70', 'C50', 'M70', 'M50', 'Y70', 'Y50', 'K25'];

export const CARD_LABELS: Readonly<Record<CardId, string>> = {
  C70: '青・濃', C50: '青・淡', M70: '赤・濃', M50: '赤・淡',
  Y70: '黄・濃', Y50: '黄・淡', K25: '黒',
};

// 仮の表示用キャリブレーション。印刷濃度とalphaは別物。
// 実物を白背景で測定後、colorとopacityをここで調整する。
export const CARDS: Readonly<Record<CardId, CardDefinition>> = {
  C70: { id: 'C70', color: { r: 0, g: 154, b: 199 }, opacity: 0.56 },
  C50: { id: 'C50', color: { r: 0, g: 170, b: 210 }, opacity: 0.34 },
  M70: { id: 'M70', color: { r: 212, g: 40, b: 115 }, opacity: 0.55 },
  M50: { id: 'M50', color: { r: 222, g: 73, b: 139 }, opacity: 0.32 },
  Y70: { id: 'Y70', color: { r: 244, g: 214, b: 0 }, opacity: 0.61 },
  Y50: { id: 'Y50', color: { r: 248, g: 221, b: 27 }, opacity: 0.37 },
  K25: { id: 'K25', color: { r: 40, g: 43, b: 43 }, opacity: 0.23 },
};
