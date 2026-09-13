import { Question, RGB } from '../types/game';

// The master supplies the playable target; sourceHex is retained only as metadata.
export function questionColor(question: Pick<Question, 'generatedHex'>): RGB {
  const hex = question.generatedHex;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}
