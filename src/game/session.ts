import { selectQuestions } from '../data/questions';
import { CardId, GameSession, GameSettings } from '../types/game';
import { scoreAnswer } from './scoring';

export const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 1, questionCount: 3, timeLimit: null, resultTiming: 'question',
};

export function createSession(settings: GameSettings, names: readonly string[]): GameSession {
  const questions = selectQuestions(settings.questionCount);
  return {
    settings: { ...settings },
    players: Array.from({ length: settings.playerCount }, (_, i) => ({ id: `player-${i + 1}`, name: names[i]?.trim() || `プレイヤー${i + 1}` })),
    questions, currentQuestion: questions[0], currentQuestionIndex: 0, currentPlayerIndex: 0,
    answers: [], gameStatus: settings.playerCount === 1 ? 'playing' : 'handoff',
  };
}

export function ready(session: GameSession): GameSession {
  return session.gameStatus === 'handoff' ? { ...session, gameStatus: 'playing' } : session;
}

function advanceQuestion(session: GameSession): GameSession {
  const index = session.currentQuestionIndex + 1;
  if (index === session.questions.length) return { ...session, gameStatus: 'finished' };
  return { ...session, currentQuestionIndex: index, currentQuestion: session.questions[index],
    currentPlayerIndex: 0, gameStatus: session.players.length === 1 ? 'playing' : 'handoff' };
}

export function nextQuestion(session: GameSession): GameSession {
  return session.gameStatus === 'questionResult' ? advanceQuestion(session) : session;
}

export function saveAnswer(session: GameSession, playerId: string, questionId: string, recipe: readonly CardId[], timedOut = false): GameSession {
  if (session.gameStatus !== 'playing' || session.players[session.currentPlayerIndex].id !== playerId ||
      session.currentQuestion.id !== questionId || session.answers.some(a => a.playerId === playerId && a.questionId === questionId)) return session;
  const scored = scoreAnswer(recipe, session.currentQuestion.recipe);
  const answered: GameSession = { ...session, answers: [...session.answers,
    { ...scored, score: recipe.length ? scored.score : 0, playerId, questionId, timedOut }] };
  if (session.currentPlayerIndex + 1 < session.players.length) {
    return { ...answered, currentPlayerIndex: session.currentPlayerIndex + 1, gameStatus: 'handoff' };
  }
  return session.settings.resultTiming === 'question'
    ? { ...answered, gameStatus: 'questionResult' } : advanceQuestion(answered);
}

export function ranking(session: GameSession) {
  const sorted = session.players.map(player => ({ player,
    average: session.answers.filter(a => a.playerId === player.id).reduce((sum, a) => sum + a.score, 0) / session.questions.length,
  })).sort((a, b) => b.average - a.average);
  let rank = 1;
  return sorted.map((entry, i) => {
    if (i > 0 && Math.abs(entry.average - sorted[i - 1].average) > 1e-9) rank = i + 1;
    return { ...entry, rank };
  });
}

export function remainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
