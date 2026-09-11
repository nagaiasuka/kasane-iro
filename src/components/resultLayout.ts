export type ResultTileLayout = {
  width: number; height: number; padding: number; gap: number;
  nameFont: number; scoreFont: number; nameHeight: number; headingHeight: number;
  swatchSize: number; stackWidth: number; stackHeight: number;
  cardWidth: number; cardHeight: number; step: number;
  inline: boolean; banner: boolean; headingWidth: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Width/height are the measured area remaining after Safe Area, header and footer.
export function resultLayout(count: number, width: number, height: number, stackSlots: number) {
  const density = count === 1 ? 1 : count === 2 ? 0.84 : count === 3 ? 0.74 : 0.66;
  const gap = clamp(Math.min(width / 36, height / 50) * density, 4, 14);
  const columns = count === 1 ? 2 : count === 4 ? 2 : 3;
  const bannerHeight = count >= 3 ? (height - gap) * (count === 3 ? 0.27 : 0.23) : 0;
  const rows = count === 4 ? 2 : 1;
  const rowHeight = (height - (bannerHeight ? bannerHeight + gap : 0) - (rows - 1) * gap) / rows;
  const tileWidth = (width - (columns - 1) * gap) / columns;
  const padding = clamp(Math.min(tileWidth / 14, rowHeight / 30), 4, 14);
  const innerWidth = tileWidth - padding * 2 - 2;
  const swatchSize = Math.floor(Math.min(innerWidth * (count === 4 ? 0.4 : 0.9), rowHeight * 0.3, width / (count + 1) * 0.88));
  const cardWidth = Math.max(1, Math.min(innerWidth * (count === 3 ? 0.9 : 0.98), count === 4 ? innerWidth - swatchSize - gap - 8 : innerWidth));
  const nameFont = clamp(width / 23 * density, 11, 20);
  const scoreFont = clamp(Math.min(innerWidth, width / (count + 1)) / 4.15, 18, 40 * density);
  const tile = (tileWidth: number, tileHeight: number, banner: boolean): ResultTileLayout => {
    const headingHeight = nameFont * 2.5 + scoreFont * 1.2;
    const nameHeight = nameFont * 2.5;
    const headingWidth = banner ? Math.max(scoreFont * 3.4, tileWidth * 0.25) : tileWidth - padding * 2 - 2;
    const inline = banner || count === 4;
    const stackWidth = banner
      ? tileWidth - 2 * padding - headingWidth - swatchSize - 2 * gap - 2
      : inline ? innerWidth - swatchSize - gap : innerWidth;
    const stackHeight = Math.max(16, tileHeight - 2 * padding - 2 - (banner ? 0 : headingHeight + gap) - (inline ? 0 : swatchSize + gap));
    const step = Math.max(1, Math.min(stackHeight * 0.09, cardWidth * 0.15, (stackHeight - 12) / Math.max(1, stackSlots)));
    return {
      width: tileWidth, height: tileHeight, padding, gap, nameFont, scoreFont, nameHeight, headingHeight,
      swatchSize, stackWidth, stackHeight, cardWidth: Math.min(cardWidth, stackWidth - 8),
      cardHeight: Math.max(1, stackHeight - 8 - Math.max(0, stackSlots - 1) * step), step,
      inline, banner, headingWidth,
    };
  };
  return { columns, rows, gap, bannerHeight, rowHeight, player: tile(tileWidth, rowHeight, false),
    canonical: count >= 3 ? tile(width, bannerHeight, true) : tile(tileWidth, rowHeight, false) };
}
