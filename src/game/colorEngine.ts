import { CardId, RGB } from '../types/game';
import { CARDS } from './cards';

export const PAPER: RGB = { r: 255, g: 255, b: 255 };

// UIの半透明レイヤーと同じ、白地への順序付きsource-over合成。
// 物理的な減法混色の測定モデルに置き換える場合も入口を共通に保つ。
export function generateColor(recipe: readonly CardId[]): RGB {
  const mixed = recipe.reduce<RGB>((base, id) => {
    const { color, opacity } = CARDS[id];
    return {
      r: color.r * opacity + base.r * (1 - opacity),
      g: color.g * opacity + base.g * (1 - opacity),
      b: color.b * opacity + base.b * (1 - opacity),
    };
  }, PAPER);
  return { r: Math.round(mixed.r), g: Math.round(mixed.g), b: Math.round(mixed.b) };
}

export const rgbStyle = ({ r, g, b }: RGB) => `rgb(${r}, ${g}, ${b})`;
export function cardStyle(id: CardId): string {
  const { color: { r, g, b }, opacity } = CARDS[id];
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
