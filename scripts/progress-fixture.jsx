// Test-only entry: real App and web AsyncStorage, with helpers to prepare saved sessions.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { createSession, DEFAULT_SETTINGS, ready, startQuestion, saveAnswer, continueAfterAnswer, nextQuestion } from '../src/game/session';
import { saveAllProgress, loadAllProgress, clearAllProgress } from '../src/game/progressStorage';
window.progressTest = {
  load: loadAllProgress,
  clear: clearAllProgress,
  async seed({ index = 5, players = 1, status = 'playing', resultTiming = 'question' } = {}) {
    let session = createSession({ ...DEFAULT_SETTINGS, questionCount: 'all', playerCount: players, resultTiming }, []);
    while (session.currentQuestionIndex < index) {
      session = startQuestion(ready(session));
      session = continueAfterAnswer(saveAnswer(session, session.players[session.currentPlayerIndex].id, session.currentQuestion.id, session.currentQuestion.recipe));
      if (session.gameStatus === 'questionResult') session = nextQuestion(session);
    }
    session = startQuestion(ready(session));
    if (status === 'answerSaved') session = saveAnswer(session, session.players[0].id, session.currentQuestion.id, session.currentQuestion.recipe);
    await saveAllProgress('traditional-japan', session);
    return session;
  },
};
createRoot(document.getElementById('root')).render(<App />);
