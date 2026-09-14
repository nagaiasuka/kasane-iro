# オリジナル効果音

このプロジェクトのために `scripts/generate-sound-effects.py` で数式から生成。
外部音源、録音、サンプル、既存楽曲は使用していません。

| ファイル | 長さ | 意図 |
| --- | --- | --- |
| card-place.wav | 0.19秒 | 小さな木・紙の「コトッ」 |
| card-remove.wav | 0.14秒 | 紙を戻す「サッ」 |
| reset.wav | 0.28秒 | 軽い二つの接触音 |
| confirm.wav | 0.60秒 | 柔らかい決定音 |
| result.wav | 1.10秒 | 短い澄んだ余韻 |
| perfect.wav | 1.50秒 | 控えめな三音の余韻 |
| button.wav | 0.09秒 | 小さなクリック |

形式: 44.1kHz / 16bit / mono PCM WAV。低域寄りの減衰振動とフィルタ済みノイズを合成し、頭尾を滑らかに減衰。
生成時のピークはフルスケールの18〜32%、再生側のSE音量は通常0.60（button 0.28 / perfect 0.65）。
再生成: `python3 scripts/generate-sound-effects.py`（Python標準ライブラリのみ、実行時依存なし）。

## ライセンス

このディレクトリの7つの生成WAVを **CC0-1.0** として提供します。
適用可能な範囲で権利を放棄し、商用利用・改変・再配布を認めます。クレジット表記は不要です。
ライセンス本文: https://creativecommons.org/publicdomain/zero/1.0/legalcode
他のアプリコードや画像のライセンスを変更するものではありません。
