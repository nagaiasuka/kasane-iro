// Browser-only fixture: bundle with esbuild; never imported by the app entry.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QuestionResultScreen } from '../src/screens/QuestionResultScreen';
import { GameExit } from '../src/components/GameExit';
import { createSession, DEFAULT_SETTINGS, ready, startQuestion, saveAnswer, continueAfterAnswer } from '../src/game/session';
import { CARD_IDS } from '../src/game/cards';

const count = Number(new URLSearchParams(location.search).get('players') || 1);
let session = createSession({ ...DEFAULT_SETTINGS, playerCount: count }, []);
for (let n = 0; n < count; n++) {
  session = startQuestion(ready(session));
  session = saveAnswer(session, session.players[n].id, session.currentQuestion.id, [...CARD_IDS].reverse());
  session = continueAfterAnswer(session);
}
createRoot(document.getElementById('root')).render(<SafeAreaProvider>
  <GameExit enabled onExit={() => {}}><QuestionResultScreen session={session} onNext={() => {}} /></GameExit>
</SafeAreaProvider>);
