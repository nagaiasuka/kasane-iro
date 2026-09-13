import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardId, GameSession } from '../types/game';
import { QUESTIONS } from '../data/questions';
import { findStage } from '../data/stages';
import { CARD_IDS } from './cards';
import { scoreAnswer } from './scoring';
import { questionColor } from './questionColor';

const STORAGE_KEY = 'kasane-iro:all-progress:v1';

export type SavedAllProgress = Readonly<{
  version: 1;
  stageId: string;
  savedAt: string;
  session: GameSession;
}>;

function isValidProgress(value: unknown): value is SavedAllProgress {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Partial<SavedAllProgress>;
  const session = progress.session as GameSession | undefined;
  if (progress.version !== 1 || typeof progress.stageId !== 'string' || typeof progress.savedAt !== 'string' || !session) return false;
  const settings = session.settings;
  const stage = findStage(progress.stageId);
  if (!stage || !Number.isFinite(Date.parse(progress.savedAt))) return false;
  if (settings?.questionCount !== 'all' || ![1, 2, 3, 4].includes(settings.playerCount) ||
      ![null, 15, 30, 60].includes(settings.timeLimit) || !['question', 'final'].includes(settings.resultTiming)) return false;
  if (!['handoff', 'questionIntro', 'playing', 'answerSaved', 'questionResult'].includes(session.gameStatus)) return false;
  if (!Array.isArray(session.players) || session.players.length !== settings.playerCount ||
      session.players.some((p, i) => !p || p.id !== `player-${i + 1}` || typeof p.name !== 'string')) return false;
  if (!Array.isArray(session.questions) || session.questions.length !== stage.questionIds.length ||
      new Set(session.questions.map(q => q?.id)).size !== stage.questionIds.length) return false;
  // Saved questions must still match the master; never accept unknown cards or targets.
  const sameQuestion = (q: GameSession['currentQuestion'], expected: GameSession['currentQuestion'] | undefined) =>
    q && expected && q.id === expected.id && q.name === expected.name && q.romanized === expected.romanized &&
    q.sourceHex === expected.sourceHex && q.generatedHex === expected.generatedHex && q.sourceSimilarity === expected.sourceSimilarity && q.explanation === expected.explanation &&
    Array.isArray(q.recipe) && q.recipe.join(',') === expected.recipe.join(',');
  if (session.questions.some(q => !stage.questionIds.includes(q?.id) || !sameQuestion(q, QUESTIONS.find(master => master.id === q?.id)))) return false;
  const qi = session.currentQuestionIndex;
  const pi = session.currentPlayerIndex;
  if (!Number.isInteger(qi) || qi < 0 || qi >= session.questions.length ||
      !Number.isInteger(pi) || pi < 0 || pi >= session.players.length ||
      !sameQuestion(session.currentQuestion, session.questions[qi])) return false;
  if (session.gameStatus === 'handoff' && settings.playerCount === 1) return false;
  if (session.gameStatus === 'questionResult' && (settings.resultTiming !== 'question' || pi !== settings.playerCount - 1)) return false;
  const answerCount = qi * settings.playerCount + pi +
    (['answerSaved', 'questionResult'].includes(session.gameStatus) ? 1 : 0);
  if (!Array.isArray(session.answers) || session.answers.length !== answerCount) return false;
  return session.answers.every((answer, i) => {
    const question = session.questions[Math.floor(i / settings.playerCount)];
    if (!answer || answer.questionId !== question.id || answer.playerId !== session.players[i % settings.playerCount].id ||
        typeof answer.timedOut !== 'boolean' || !Array.isArray(answer.recipe) ||
        new Set(answer.recipe).size !== answer.recipe.length || !answer.recipe.every((id: CardId) => CARD_IDS.includes(id)) ||
        (!answer.recipe.length && !answer.timedOut)) return false;
    const expected = scoreAnswer(answer.recipe, question.recipe, questionColor(question));
    return answer.score === (answer.recipe.length ? expected.score : 0) &&
      answer.color?.r === expected.color.r && answer.color?.g === expected.color.g && answer.color?.b === expected.color.b;
  });
}

// PlayScreen内の未確定カード配置はSessionに入っていないため、プレイ中にアプリを閉じた場合は
// 同じ問題の開始前へ戻す。回答済みデータや問題のシャッフル順はそのまま保持する。
function normalizeForResume(session: GameSession): GameSession {
  return session.gameStatus === 'playing'
    ? { ...session, gameStatus: 'questionIntro' }
    : session;
}

// Serialize writes, reads and deletion so a late save cannot resurrect cleared progress.
let pending: Promise<unknown> = Promise.resolve();
function inOrder<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.catch(() => undefined);
  return result;
}

export async function saveAllProgress(stageId: string, session: GameSession): Promise<void> {
  if (session.settings.questionCount !== 'all' || session.gameStatus === 'finished') return;
  const progress: SavedAllProgress = { version: 1, stageId, savedAt: new Date().toISOString(), session };
  const raw = JSON.stringify(progress);
  await inOrder(() => AsyncStorage.setItem(STORAGE_KEY, raw));
}

export async function loadAllProgress(): Promise<SavedAllProgress | null> {
  return inOrder(async () => {
    // A read failure is not proof of corruption; preserve data for a later retry.
    let raw: string | null;
    try { raw = await AsyncStorage.getItem(STORAGE_KEY); } catch { return null; }
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValidProgress(parsed)) return { ...parsed, stageId: findStage(parsed.stageId)!.id, session: normalizeForResume(parsed.session) };
    } catch { /* Malformed JSON or shape is not resumable. */ }
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch { /* Ignore unusable data even if removal fails. */ }
    return null;
  });
}

export async function clearAllProgress(): Promise<void> {
  await inOrder(() => AsyncStorage.removeItem(STORAGE_KEY));
}
