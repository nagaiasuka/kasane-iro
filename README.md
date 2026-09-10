# かさねいろ

半透明の7枚のカードを重ね、お題の色に近づけるスマートフォン向けプロトタイプ。
Expo Managed Workflow / React Native / TypeScript。縦画面・日本語・ローカル完結。

## 起動

Node.js 22 LTS以上を推奨します。

```sh
npm ci
npm start
```

Expo CLIのQRコードを対応するExpo Goで読み込みます。iOSシミュレーターは
`npm run ios`（macOS / Xcodeが必要）、Androidエミュレーターは
`npm run android`（Android SDKが必要）。同じWi-Fi環境で接続してください。
SDK 55対応のExpo Goまたは開発ビルドを使用してください。
ブラウザーでの補助確認には `npm run web` を使用できます。

## 操作

- 手札のカードを中央へドラッグ。カードの中心が点線内に入ると追加されます。
- 場では後から置いたカードが上になります。上端を少しずらし、下のカードもつかめます。
- 場のカードを下部の手札エリアへドラッグすると戻ります。再追加すると最上段になります。
- どちらのエリアにも入らない場合やジェスチャー中断時は元の位置へ戻ります。
- 場の中で移動するだけでは順序は変わりません。
- リセットですべて手札に戻ります。回答するとその時点の配列・生成色・再現率をメモリー内に保存します。
- 回答後も操作でき、変更すると前の再現率表示を消します。場にカードがない状態では回答できません。

## 構成

| ファイル | 役割 |
| --- | --- |
| `App.tsx`, `index.ts`, `app.json` | Expoエントリー・縦画面設定・Safe Area |
| `src/screens/PlayScreen.tsx` | ゲーム画面、順序配列、回答スナップショット |
| `src/components/ColorCard.tsx` | PanResponderとAnimatedによるドラッグ、スナップ |
| `src/components/PlayField.tsx` | 白地のプレイフィールド |
| `src/game/cards.ts` | 7種類のカードの調整可能なRGB・透明度 |
| `src/game/colorEngine.ts` | 白地への順序付き合成、色の表示形式 |
| `src/game/scoring.ts` | 完全一致100%、その他は簡易RGB距離 |
| `src/game/stack.ts` | 配列の追加・削除、ドロップ判定 |
| `src/data/questions.ts` | 仮問題「萌黄」と正解レシピ |
| `src/types/game.ts` | ゲーム共通型 |
| `tests/game.test.ts` | 色生成・採点・順序・判定のテスト |

## 色と採点

カードの濃度名をalphaとしては使いません。`cards.ts` のRGBとopacityは仮設定です。
手札・ドラッグ中・場で同じRGBAを使用し、カード本体のopacityは変更しません。
中央のカードが重なった無地部分と「いまの色」は白背景での同じsource-over合成です。
端の線やラベルは装飾で、採点に含めません。

お題もプレイヤーの色も同じ `generateColor` で計算します。
仮問題は **C70 → Y70** で必ず **100.0%**。
他の配列はRGBユークリッド距離を最大距離で正規化し、表示上の誤認を防ぐため99.9%を上限にしています。
これは物理的な減法混色や正式な伝統色の再現モデルではありません。
実物との校正やLab / Delta Eの導入は、独立したエンジンと採点関数で対応できます。

## 検証

```sh
npm run typecheck
npm test
npx expo install --check
npx expo export --platform all
```

テストでは空集合を除く全13,699レシピで自己一致100%を確認します。
実機では7枚の追加、中段・最下段の返却、無効ドロップ、リセット、正解回答、
ジェスチャー中のバックグラウンド移行、小画面や文字拡大時の操作を確認してください。

実施済みの検証:

- TypeScript型検査、6件のロジックテスト、Expo依存関係チェック: 成功。
- iOS / Android / Webのプロダクションバンドル生成: 成功（ネイティブアプリの起動確認とは別）。
- Chromiumでドラッグ追加、7枚の順序、下段・中段の返却、100.0%回答、リセットを確認。
- 幅320 / 375 / 390 / 412pxで画面内の回答ボタンを確認。ブラウザー実行時エラーなし。
- iOS / Android実機での起動とタッチ操作は未確認。

実装の参照: [Expo SDK 55](https://expo.dev/changelog/sdk-55)、
[React Native PanResponder](https://reactnative.dev/docs/panresponder)。

## 今後

実機の触り心地・つかみやすさと小画面レイアウトを確認し、実物カードに合わせて色を校正します。
その後、必要に応じてアプリと独立したレシピ探索スクリプトと問題データを追加します。
設定画面、複数人プレイ、バックエンド、オンライン機能は未実装です。
