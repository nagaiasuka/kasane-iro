export type CardId = 'C70' | 'C50' | 'M70' | 'M50' | 'Y70' | 'Y50' | 'K25';
export type RGB = Readonly<{ r: number; g: number; b: number }>;
export type CardDefinition = Readonly<{ id: CardId; color: RGB; opacity: number }>;
export type Question = Readonly<{ id: string; name: string; reading: string; recipe: readonly CardId[] }>;
export type Answer = Readonly<{ recipe: readonly CardId[]; color: RGB; score: number }>;

export type GameSettings = Readonly<{
  playerCount: 1 | 2 | 3 | 4;
  questionCount: 3 | 5 | 10;
  timeLimit: 15 | 30 | 60 | null;
  resultTiming: 'question' | 'final';
}>;
export type Player = Readonly<{ id: string; name: string }>;
export type PlayerAnswer = Answer & Readonly<{ playerId: string; questionId: string; timedOut: boolean }>;
export type GameSession = Readonly<{
  settings: GameSettings;
  players: readonly Player[];
  questions: readonly Question[];
  currentQuestionIndex: number;
  currentPlayerIndex: number;
  currentQuestion: Question;
  answers: readonly PlayerAnswer[];
  gameStatus: 'handoff' | 'questionIntro' | 'answerSaved' | 'playing' | 'questionResult' | 'finished';
}>;

export type Stage = Readonly<{ id: string; name: string; description: string; questionIds: readonly string[] }>;
