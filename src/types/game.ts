export type CardId = 'C70' | 'C50' | 'M70' | 'M50' | 'Y70' | 'Y50' | 'K25';
export type RGB = Readonly<{ r: number; g: number; b: number }>;
export type CardDefinition = Readonly<{ id: CardId; color: RGB; opacity: number }>;
export type Question = Readonly<{ name: string; reading: string; recipe: readonly CardId[] }>;
export type Answer = Readonly<{ recipe: readonly CardId[]; color: RGB; score: number }>;
