import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayScreen } from './src/screens/PlayScreen';
import { TitleScreen } from './src/screens/TitleScreen';
import { GameSettingsScreen } from './src/screens/GameSettingsScreen';
import { PlayerSetupScreen } from './src/screens/PlayerSetupScreen';
import { HandoffScreen } from './src/screens/HandoffScreen';
import { QuestionResultScreen } from './src/screens/QuestionResultScreen';
import { FinalResultScreen } from './src/screens/FinalResultScreen';
import { createSession, DEFAULT_SETTINGS, nextQuestion, ready, saveAnswer } from './src/game/session';
import { GameSession, GameSettings } from './src/types/game';

export default function App() {
  const [screen, setScreen] = useState<'title' | 'settings' | 'players' | 'game'>('title');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<GameSession | null>(null);
  function start(names: readonly string[]) {
    setSession(createSession(settings, names));
    setScreen('game');
  }
  function game() {
    if (!session) return null;
    const player = session.players[session.currentPlayerIndex];
    switch (session.gameStatus) {
      case 'handoff': return <HandoffScreen name={player.name} questionNumber={session.currentQuestionIndex + 1} total={session.questions.length}
        onReady={() => setSession(current => current && ready(current))} />;
      case 'playing': return <PlayScreen key={`${session.currentQuestion.id}:${player.id}`}
        question={session.currentQuestion} playerName={player.name} questionNumber={session.currentQuestionIndex + 1}
        questionCount={session.questions.length} timeLimit={session.settings.timeLimit}
        onAnswer={(recipe, timedOut) => setSession(current => current && saveAnswer(current, player.id, session.currentQuestion.id, recipe, timedOut))} />;
      case 'questionResult': return <QuestionResultScreen session={session} onNext={() => setSession(current => current && nextQuestion(current))} />;
      case 'finished': return <FinalResultScreen session={session} onReplay={() => setSession(createSession(session.settings, session.players.map(p => p.name)))}
        onTitle={() => { setSession(null); setScreen('title'); }} />;
    }
  }
  return <SafeAreaProvider><StatusBar barStyle="dark-content" backgroundColor="#F7F4EC" />
    {screen === 'title' && <TitleScreen onStart={() => setScreen('settings')} />}
    {screen === 'settings' && <GameSettingsScreen settings={settings} onChange={setSettings} onNext={() => setScreen('players')} />}
    {screen === 'players' && <PlayerSetupScreen count={settings.playerCount} onStart={start} onBack={() => setScreen('settings')} />}
    {screen === 'game' && game()}
  </SafeAreaProvider>;
}
