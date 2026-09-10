import { Stage } from '../types/game';
import { QUESTIONS } from './questions';

export const STAGES: readonly Stage[] = [{
  id: 'traditional-japan', name: '日本の伝統色',
  description: '日本に古くから伝わる色を、7枚のカードで再現しよう。',
  questionIds: QUESTIONS.map(question => question.id),
}];
