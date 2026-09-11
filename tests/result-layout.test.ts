import assert from 'node:assert/strict';
import test from 'node:test';
import { resultLayout } from '../src/components/resultLayout';

test('人数別の配置が比較領域の幅・高さを使い切り、7枚もブロック内に収まる', () => {
  for (const [width, height] of [[296, 370], [351, 490], [364, 650], [384, 720]]) {
    for (const count of [1, 2, 3, 4]) {
      const l = resultLayout(count, width, height, 7);
      assert.equal(l.columns, count === 1 || count === 4 ? 2 : 3);
      assert.equal(l.rows, count === 4 ? 2 : 1);
      assert.equal(l.bannerHeight > 0, count >= 3);
      assert.ok(Math.abs(l.player.width * l.columns + l.gap * (l.columns - 1) - width) < 0.001);
      const usedHeight = l.rowHeight * l.rows + l.gap * (l.rows - 1) + (l.bannerHeight ? l.bannerHeight + l.gap : 0);
      assert.ok(Math.abs(usedHeight - height) < 0.001);
      for (const tile of [l.canonical, l.player]) {
        assert.ok(tile.cardWidth > 0 && tile.cardHeight > 0);
        assert.ok(tile.cardWidth <= tile.stackWidth);
        assert.ok(tile.cardHeight + 6 * tile.step + 8 <= tile.stackHeight + 0.001);
        assert.ok(tile.swatchSize <= tile.height - 2 * tile.padding);
        if (tile.banner) assert.ok(tile.headingHeight <= tile.height - 2 * tile.padding);
      }
      assert.equal(l.canonical.swatchSize, l.player.swatchSize);
    }
  }
});

test('人数が少ないほど色見本とカードを大きくし、広い画面では再拡大する', () => {
  const layouts = [1, 2, 3, 4].map(n => resultLayout(n, 364, 650, 7));
  for (let i = 1; i < layouts.length; i++) {
    assert.ok(layouts[i - 1].player.swatchSize > layouts[i].player.swatchSize);
    assert.ok(layouts[i - 1].player.cardWidth > layouts[i].player.cardWidth);
    assert.ok(layouts[i - 1].player.scoreFont >= layouts[i].player.scoreFont);
  }
  for (const count of [1, 2, 3, 4]) {
    const small = resultLayout(count, 296, 370, 7).player;
    const large = resultLayout(count, 384, 720, 7).player;
    assert.ok(large.swatchSize > small.swatchSize);
    assert.ok(large.cardWidth > small.cardWidth);
    assert.ok(large.cardHeight > small.cardHeight);
  }
});
