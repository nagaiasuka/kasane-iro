import { Stage } from '../types/game';
import { TRADITIONAL_COLOR_QUESTIONS } from './questions.generated';
import { SEASON_QUESTIONS, NATURE_QUESTIONS, COLOR_LEARNING_QUESTIONS } from './stage-questions.generated';

export const STAGES: readonly Stage[] = [
  {
    id: 'color-learning', name: '色彩を学ぶ',
    description: 'カードを重ねながら、色の混ざり方を学ぼう。',
    questionIds: COLOR_LEARNING_QUESTIONS.map(question => question.id),
    previewQuestionIds: ['color-02', 'color-04', 'color-06', 'color-07'],
  },
  {
    id: 'traditional', name: '日本の伝統色',
    description: `日本に古くから伝わる${TRADITIONAL_COLOR_QUESTIONS.length}色を、7枚のカードで再現しよう。`,
    questionIds: TRADITIONAL_COLOR_QUESTIONS.map(question => question.id),
    previewQuestionIds: ['chigusa', 'kariyasu', 'seiji', 'imayoh'],
  },
  {
    id: 'seasons', name: '四季の色',
    description: '春・夏・秋・冬を感じる色を重ねてみよう。',
    questionIds: SEASON_QUESTIONS.map(question => question.id),
    previewQuestionIds: ['season-01', 'season-03', 'season-14', 'season-21'],
  },
  {
    id: 'nature', name: '自然の色',
    description: '空・海・森・大地など、自然の色を再現しよう。',
    questionIds: NATURE_QUESTIONS.map(question => question.id),
    previewQuestionIds: ['nature-01', 'nature-07', 'nature-12', 'nature-23'],
  },
];

// Preserve v1 progress saved before the traditional stage ID was standardized.
export function findStage(id: string): Stage | undefined {
  return STAGES.find(stage => stage.id === (id === 'traditional-japan' ? 'traditional' : id));
}
