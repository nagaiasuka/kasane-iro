import { Question } from '../types/game';

// ゲーム進行確認用データ。伝統色の標準値を再現した本番レシピではない。
export const QUESTIONS: readonly Question[] = [
  { id: 'moegi', name: '萌黄', reading: 'もえぎ', recipe: ['C70', 'Y70'] },
  { id: 'fuji', name: '藤', reading: 'ふじ', recipe: ['M50', 'C50'] },
  { id: 'koubai', name: '紅梅', reading: 'こうばい', recipe: ['Y50', 'M50'] },
  { id: 'mizu', name: '水', reading: 'みず', recipe: ['C50'] },
  { id: 'koke', name: '苔', reading: 'こけ', recipe: ['C70', 'Y70', 'K25'] },
  { id: 'sakura', name: '桜', reading: 'さくら', recipe: ['M50'] },
  { id: 'yamabuki', name: '山吹', reading: 'やまぶき', recipe: ['M50', 'Y70'] },
  { id: 'sumire', name: '菫', reading: 'すみれ', recipe: ['C70', 'M70'] },
  { id: 'wakaba', name: '若葉', reading: 'わかば', recipe: ['C50', 'Y50'] },
  { id: 'nezumi', name: '鼠', reading: 'ねずみ', recipe: ['K25'] },
];
export const QUESTION = QUESTIONS[0];

// 将来はこの選択関数でシャッフル等に差し替えられる。
export function selectQuestions(count: number, questionIds: readonly string[] = QUESTIONS.map(q => q.id)): readonly Question[] {
  const available = questionIds.map(id => {
    const question = QUESTIONS.find(q => q.id === id);
    if (!question) throw new Error(`不明な問題: ${id}`);
    return question;
  });
  if (count > available.length || count < 1) throw new Error('問題数が不正です');
  return available.slice(0, count);
}
