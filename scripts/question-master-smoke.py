# Optional UI check: Python Playwright + Chromium; no server or network required.
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

with tempfile.TemporaryDirectory(prefix='kasane-question-master-') as directory:
    subprocess.run(['node', '-e', r'''
const fs = require('fs');
const dir = process.argv[1];
require('esbuild').buildSync({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameExit } from './src/components/GameExit';
import { PlayScreen } from './src/screens/PlayScreen';
import { QuestionIntroScreen } from './src/screens/QuestionIntroScreen';
import { QuestionResultScreen } from './src/screens/QuestionResultScreen';
import { createSession, DEFAULT_SETTINGS, ready, startQuestion, saveAnswer, continueAfterAnswer } from './src/game/session';
import { QUESTIONS } from './src/data/questions';
const params = new URLSearchParams(location.search);
const mode = params.get('mode');
const count = Number(params.get('players') || 1);
// A distinct test target proves the screens read generatedHex, not sourceHex or recipe.
const question = {...QUESTIONS[0], generatedHex:'#123456'};
let session = createSession({...DEFAULT_SETTINGS, playerCount:count}, []);
session = {...session, currentQuestion:question, questions:[question, ...session.questions.slice(1)]};
for (let i=0; i<count; i++) {
  session = startQuestion(ready(session));
  session = continueAfterAnswer(saveAnswer(session, session.players[i].id, question.id, question.recipe));
}
const screen = mode === 'play'
  ? <PlayScreen question={question} playerName="プレイヤー1" questionNumber={1} questionCount={3} timeLimit={null} onAnswer={()=>{}} />
  : mode === 'intro'
  ? <QuestionIntroScreen question={question} playerName="プレイヤー1" number={1} total={3} onStart={()=>{}} />
  : <QuestionResultScreen session={session} onNext={()=>{}} />;
createRoot(document.getElementById('root')).render(<SafeAreaProvider><GameExit enabled onExit={()=>{}}>{screen}</GameExit></SafeAreaProvider>);
`},bundle:true,outfile:dir+'/app.js',platform:'browser',alias:{'react-native':'react-native-web'},resolveExtensions:['.web.tsx','.tsx','.web.ts','.ts','.web.js','.js','.json'],loader:{'.js':'jsx'},define:{global:'globalThis',__DEV__:'false','process.env.NODE_ENV':'"production"'}});
fs.writeFileSync(dir+'/index.html','<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}</style><div id="root"></div><script src="app.js"></script>');
''', directory], check=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        base = Path(directory, 'index.html').as_uri()
        for mode in ['intro', 'play', 'result']:
            for count in ([1, 2, 3, 4] if mode == 'result' else [1]):
                page.goto(f'{base}?mode={mode}&players={count}', wait_until='networkidle')
                page.get_by_text('撫子', exact=(mode == 'intro')).first.wait_for()
                assert page.locator('*').evaluate_all('(els) => els.some(e => getComputedStyle(e).backgroundColor === "rgb(18, 52, 86)")')
                if mode == 'play':
                    assert page.get_by_test_id('target-color').evaluate('(e) => getComputedStyle(e).backgroundColor') == 'rgb(18, 52, 86)'
                if mode == 'result':
                    canonical = page.get_by_test_id('canonical-answer-color')
                    assert canonical.evaluate('(e) => [e, ...e.querySelectorAll("*")].some(x => getComputedStyle(x).backgroundColor === "rgb(18, 52, 86)")')
                    assert '下から上へ' in page.get_by_test_id('answer-recipe').get_attribute('aria-label')
                    assert page.get_by_text('100.0%', exact=True).count() == count + 1
                    positions = []
                    for i in range(count):
                        player = page.get_by_test_id(f'player-answer-player-{i + 1}')
                        player.wait_for()
                        positions.append(player.bounding_box())
                    if count == 3:
                        assert positions[0]['x'] < positions[1]['x'] < positions[2]['x']
                        assert max(b['y'] for b in positions) - min(b['y'] for b in positions) < 1
                    if count == 4:
                        assert positions[0]['x'] < positions[1]['x'] and positions[2]['x'] < positions[3]['x']
                        assert positions[0]['y'] == positions[1]['y'] < positions[2]['y'] == positions[3]['y']
                print(f'PASS: {mode}, {count} players, generatedHex target', flush=True)
        assert not errors, errors
        browser.close()
