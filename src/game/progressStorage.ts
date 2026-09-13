import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSession } from '../types/game';

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
  if (session.settings?.questionCount !== 'all' || session.gameStatus === 'finished') return false;
  if (!Array.isArray(session.questions) || session.questions.length === 0) return false;
  if (!Number.isInteger(session.currentQuestionIndex) || session.currentQuestionIndex < 0 || session.currentQuestionIndex >= session.questions.length) return false;
  if (!Number.isInteger(session.currentPlayerIndex) || session.currentPlayerIndex < 0 || session.currentPlayerIndex >= session.players.length) return false;
  return session.currentQuestion?.id === session.questions[session.currentQuestionIndex]?.id;
}

// PlayScreen内の未確定カード配置はSessionに入っていないため、プレイ中にアプリを閉じた場合は
// 同じ問題の開始前へ戻す。回答済みデータや問題のシャッフル順はそのまま保持する。
function normalizeForResume(session: GameSession): GameSession {
  return session.gameStatus === 'playing'
    ? { ...session, gameStatus: 'questionIntro' }
    : session;
}

export async function saveAllProgress(stageId: string, session: GameSession): Promise<void> {
  if (session.settings.questionCount !== 'all' || session.gameStatus === 'finished') return;
  const progress: SavedAllProgress = { version: 1, stageId, savedAt: new Date().toISOString(), session };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export async function loadAllProgress(): Promise<SavedAllProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidProgress(parsed)) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { ...parsed, session: normalizeForResume(parsed.session) };
  } catch {
    return null;
  }
}

export async function clearAllProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
