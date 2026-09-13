# かさねいろ 初期リリース追加ステージ問題データ

- 四季の色: 40問
- 自然の色: 40問
- 色彩を学ぶ: 30問
- 追加合計: 110問
- 既存の日本の伝統色119問と合わせると: 229問

## 重要
- 現在の `CARDS` / `generateColor()` と同じ source-over 合成モデルで生成。
- recipe は左から右 = 下から上。
- 新規3ステージは「桜」「海」などに唯一の公式RGBが存在しないため、外部の色値を正解として偽装せず、アプリで実際に生成可能な `generatedHex` をそのまま `sourceHex` に採用。
- そのため canonical recipe は必ず表示ターゲットと完全一致し、ゲーム上100.0%を出せる。
- 「色彩を学ぶ」の30問には `explanation` を付与。
- `色彩検定` は商標・公式問題を想起させるため、ステージ名は初期案として **色彩を学ぶ** を推奨。

## 実装時の型変更案
既存 `Question` に以下を optional 追加:
```ts
stageId?: 'traditional' | 'seasons' | 'nature' | 'color-learning';
explanation?: string;
```

あるいは stageId は stage.questionIds だけで管理し、Question には `explanation?: string` のみ追加でもよいです。
