import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StatusBar } from 'react-native';
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
import { STAGES, findStage } from './src/data/stages';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { StageSelectScreen } from './src/screens/StageSelectScreen';
import { QuestionIntroScreen } from './src/screens/QuestionIntroScreen';
import { AnswerSavedScreen } from './src/screens/AnswerSavedScreen';
import { ResultDetailScreen } from './src/screens/ResultDetailScreen';
import { backAction, ScreenName } from './src/navigation/backAction';

import { SoundProvider, useSound } from './src/audio/SoundProvider';
import { SoundSettings } from './src/components/SoundSettings';
import { sessionSound, resultSound } from './src/audio/events';

export default function App() {
  return <SoundProvider><AppContent /></SoundProvider>;
}

function AppContent() {
  const [screen, setScreen] = useState<ScreenName>('title');
  const { playBgm, stopBgm, playSe } = useSound();
  const [soundSettingsVisible, setSoundSettingsVisible] = useState(false);
  const [stage, setStage] = useState<Stage>(STAGES[0]);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<GameSession | null>(null);
  const [savedProgress, setSavedProgress] = useState<SavedAllProgress | null>(null);
  const sessionRef = useRef<GameSession | null>(null);

  function replaceSession(next: GameSession | null) {
    sessionRef.current = next;
    setSession(next);
  }
  // Commit the existing session transition once, then request audio outside React's updater.
  function transitionSession(transition: (current: GameSession) => GameSession) {
    const current = sessionRef.current;
    if (!current) return;
    const next = transition(current);
    if (next === current) return;
    replaceSession(next);
    const sound = sessionSound(current, next);
    if (sound) playSe(sound);
  }
  function navigate(next: ScreenName) {
    if (next !== screen) playSe('button');
    setScreen(next);
  }
  function revealDetail(index: number) {
    if (!session || index === detailIndex) return;
    setDetailIndex(index);
    playSe(resultSound(session.answers.filter(a => a.questionId === session.questions[index].id).map(a => a.score)));
  }

  useEffect(() => {
    if (screen !== 'game') playBgm('menu');
    else if (session?.gameStatus === 'questionResult' || session?.gameStatus === 'finished') stopBgm();
    else playBgm('play');
  }, [screen, session?.gameStatus, playBgm, stopBgm]);


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
      if (session.gameStatus === 'finished') {
        try { await clearAllProgress(); } catch { /* 終了自体は妨げない */ }
        setSavedProgress(null);
      } else {
        try {
          await saveAllProgress(stage.id, session);
          setSavedProgress(await loadAllProgress());
        } catch { /* タイトルへ戻る操作は妨げない */ }
      }
    }
    replaceSession(null);
    setDetailIndex(null);
    navigate('title');
  }

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const action = backAction(screen, session?.gameStatus, detailIndex !== null);
    // Active games use GameExit's listener and its existing confirmation modal.
    if (action === 'confirmExit') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (action === 'system') return false;
      if (action === 'result') setDetailIndex(null);
      else if (screen === 'game') void exitGame();
      else navigate(action);
      return true;
    });
    return () => subscription.remove();
  }, [screen, session, detailIndex]);

  function start(names: readonly string[]) {
    replaceSession(createSession(settings, names, stage.questionIds));
    navigate('game');
  }

  function resumeAllQuestions() {
    if (!savedProgress) return;
    const savedStage = findStage(savedProgress.stageId) || STAGES[0];
    setStage(savedStage);
    setSettings(savedProgress.session.settings);
    replaceSession(savedProgress.session);
    setDetailIndex(null);
    navigate('game');
  }

  function game() {
    if (!session) return null;
    const player = session.players[session.currentPlayerIndex];
    switch (session.gameStatus) {
      case 'handoff': return <HandoffScreen name={player.name} questionNumber={session.currentQuestionIndex + 1} total={session.questions.length}
        onReady={() => transitionSession(current => ready(current))} />;
      case 'questionIntro': return <QuestionIntroScreen question={session.currentQuestion} number={session.currentQuestionIndex + 1}
        total={session.questions.length} playerName={player.name} onStart={() => transitionSession(current => startQuestion(current))} />;
      case 'answerSaved': return <AnswerSavedScreen playerName={player.name} multiplayer={session.players.length > 1}
        nextPlayer={session.currentPlayerIndex + 1 < session.players.length} showQuestionResult={session.settings.resultTiming === 'question'}
        lastQuestion={session.currentQuestionIndex + 1 === session.questions.length} onNext={() => transitionSession(current => continueAfterAnswer(current))} />;
      case 'playing': return <PlayScreen key={`${session.currentQuestion.id}:${player.id}`}
        question={session.currentQuestion} playerName={player.name} questionNumber={session.currentQuestionIndex + 1}
        questionCount={session.questions.length} timeLimit={session.settings.timeLimit}
        onAnswer={(recipe, timedOut) => transitionSession(current => saveAnswer(current, player.id, session.currentQuestion.id, recipe, timedOut))} />;
      case 'questionResult': return <QuestionResultScreen session={session} onNext={() => transitionSession(current => nextQuestion(current))} />;
      case 'finished': return detailIndex !== null ? <ResultDetailScreen session={session} questionIndex={detailIndex} onBack={() => setDetailIndex(null)} /> : <FinalResultScreen onDetail={revealDetail} session={session} onReplay={() => replaceSession(createSession(session.settings, session.players.map(p => p.name), stage.questionIds))}
        onTitle={exitGame} />;
    }
  }

  const resumeLabel = savedProgress
    ? `${findStage(savedProgress.stageId)?.name ?? '全問'}のつづきから（${savedProgress.session.currentQuestionIndex + 1}/${savedProgress.session.questions.length}問）`
    : undefined;

  return <SafeAreaProvider><StatusBar barStyle="dark-content" backgroundColor="#F7F4EC" />
    {screen === 'title' && <TitleScreen onStart={() => navigate('stages')} onHowTo={() => navigate('howTo')}
      onResume={savedProgress ? resumeAllQuestions : undefined} resumeLabel={resumeLabel}
      onSettings={() => { playSe('button'); setSoundSettingsVisible(true); }} />}
    {screen === 'howTo' && <HowToPlayScreen onBack={() => navigate('title')} />}
    {screen === 'stages' && <StageSelectScreen onSelect={selected => { setStage(selected); navigate('settings'); }} onBack={() => navigate('title')} />}
    {screen === 'settings' && <GameSettingsScreen onBack={() => navigate('stages')} stageName={stage.name} questionTotal={stage.questionIds.length} settings={settings} onChange={setSettings} onNext={() => navigate('players')} />}
    {screen === 'players' && <PlayerSetupScreen count={settings.playerCount} onStart={start} onBack={() => navigate('settings')} />}
    {screen === 'game' && <GameExit enabled={session?.gameStatus !== 'finished'} preserveProgress={session?.settings.questionCount === 'all'} onExit={exitGame}>{game()}</GameExit>}
    <SoundSettings visible={soundSettingsVisible} onClose={() => setSoundSettingsVisible(false)} />
  </SafeAreaProvider>;
}
