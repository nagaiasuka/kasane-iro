import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayScreen } from './src/screens/PlayScreen';
import { TitleScreen } from './src/screens/TitleScreen';
import { GameSettingsScreen } from './src/screens/GameSettingsScreen';
import { PlayerSetupScreen } from './src/screens/PlayerSetupScreen';
import { HandoffScreen } from './src/screens/HandoffScreen';
import { QuestionResultScreen } from './src/screens/QuestionResultScreen';
import { FinalResultScreen } from './src/screens/FinalResultScreen';
import { createSession, DEFAULT_SETTINGS, nextQuestion, ready, saveAnswer, startQuestion, continueAfterAnswer } from './src/game/session';
import { clearAllProgress, loadAllProgress, saveAllProgress, SavedAllProgress } from './src/game/progressStorage';
import { GameSession, GameSettings, Stage } from './src/types/game';

import { GameExit } from './src/components/GameExit';
import { STAGES } from './src/data/stages';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { StageSelectScreen } from './src/screens/StageSelectScreen';
import { QuestionIntroScreen } from './src/screens/QuestionIntroScreen';
import { AnswerSavedScreen } from './src/screens/AnswerSavedScreen';
import { ResultDetailScreen } from './src/screens/ResultDetailScreen';

export default function App() {
  const [screen, setScreen] = useState<'title' | 'howTo' | 'stages' | 'settings' | 'players' | 'game'>('title');
  const [stage, setStage] = useState<Stage>(STAGES[0]);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<GameSession | null>(null);
  const [savedProgress, setSavedProgress] = useState<SavedAllProgress | null>(null);

  useEffect(() => {
    let active = true;
    void loadAllProgress().then(progress => {
      if (active) setSavedProgress(progress);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (screen !== 'game' || !session || session.settings.questionCount !== 'all') return;
    if (session.gameStatus === 'finished') {
      void clearAllProgress().then(() => setSavedProgress(null)).catch(() => undefined);
      return;
    }
    void saveAllProgress(stage.id, session).catch(() => undefined);
  }, [screen, session, stage.id]);

  async function exitGame() {
    if (session?.settings.questionCount === 'all') {
      try { await clearAllProgress(); } catch { /* 終了自体は妨げない */ }
      setSavedProgress(null);
    }
    setSession(null);
    setDetailIndex(null);
    setScreen('title');
  }

  function start(names: readonly string[]) {
    setSession(createSession(settings, names, stage.questionIds));
    setScreen('game');
  }

  function resumeAllQuestions() {
    if (!savedProgress) return;
    const savedStage = STAGES.find(candidate => candidate.id === savedProgress.stageId) || STAGES[0];
    setStage(savedStage);
    setSettings(savedProgress.session.settings);
    setSession(savedProgress.session);
    setDetailIndex(null);
    setScreen('game');
  }

  function game() {
    if (!session) return null;
    const player = session.players[session.currentPlayerIndex];
    switch (session.gameStatus) {
      case 'handoff': return <HandoffScreen name={player.name} questionNumber={session.currentQuestionIndex + 1} total={session.questions.length}
        onReady={() => setSession(current => current && ready(current))} />;
      case 'questionIntro': return <QuestionIntroScreen question={session.currentQuestion} number={session.currentQuestionIndex + 1}
        total={session.questions.length} playerName={player.name} onStart={() => setSession(current => current && startQuestion(current))} />;
      case 'answerSaved': return <AnswerSavedScreen playerName={player.name} multiplayer={session.players.length > 1}
        nextPlayer={session.currentPlayerIndex + 1 < session.players.length} showQuestionResult={session.settings.resultTiming === 'question'}
        lastQuestion={session.currentQuestionIndex + 1 === session.questions.length} onNext={() => setSession(current => current && continueAfterAnswer(current))} />;
      case 'playing': return <PlayScreen key={`${session.currentQuestion.id}:${player.id}`}
        question={session.currentQuestion} playerName={player.name} questionNumber={session.currentQuestionIndex + 1}
        questionCount={session.questions.length} timeLimit={session.settings.timeLimit}
        onAnswer={(recipe, timedOut) => setSession(current => current && saveAnswer(current, player.id, session.currentQuestion.id, recipe, timedOut))} />;
      case 'questionResult': return <QuestionResultScreen session={session} onNext={() => setSession(current => current && nextQuestion(current))} />;
      case 'finished': return detailIndex !== null ? <ResultDetailScreen session={session} questionIndex={detailIndex} onBack={() => setDetailIndex(null)} /> : <FinalResultScreen onDetail={setDetailIndex} session={session} onReplay={() => setSession(createSession(session.settings, session.players.map(p => p.name), stage.questionIds))}
        onTitle={exitGame} />;
    }
  }

  const resumeLabel = savedProgress
    ? `全問のつづきから（${savedProgress.session.currentQuestionIndex + 1}/${savedProgress.session.questions.length}問）`
    : undefined;

  return <SafeAreaProvider><StatusBar barStyle="dark-content" backgroundColor="#F7F4EC" />
    {screen === 'title' && <TitleScreen onStart={() => setScreen('stages')} onHowTo={() => setScreen('howTo')}
      onResume={savedProgress ? resumeAllQuestions : undefined} resumeLabel={resumeLabel} />}
    {screen === 'howTo' && <HowToPlayScreen onBack={() => setScreen('title')} />}
    {screen === 'stages' && <StageSelectScreen onSelect={selected => { setStage(selected); setScreen('settings'); }} onBack={() => setScreen('title')} />}
    {screen === 'settings' && <GameSettingsScreen onBack={() => setScreen('stages')} stageName={stage.name} settings={settings} onChange={setSettings} onNext={() => setScreen('players')} />}
    {screen === 'players' && <PlayerSetupScreen count={settings.playerCount} onStart={start} onBack={() => setScreen('settings')} />}
    {screen === 'game' && <GameExit enabled={session?.gameStatus !== 'finished'} onExit={exitGame}>{game()}</GameExit>}
  </SafeAreaProvider>;
}
