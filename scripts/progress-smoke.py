# Real App + real AsyncStorage web implementation; requires Python Playwright/Chromium.
import re
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

with tempfile.TemporaryDirectory(prefix='kasane-progress-') as directory:
    subprocess.run(['node', '-e', r'''
const dir = process.argv[1];
require('esbuild').buildSync({entryPoints:['scripts/progress-fixture.jsx'],bundle:true,outfile:dir+'/app.js',platform:'browser',alias:{'react-native':'react-native-web'},resolveExtensions:['.web.tsx','.tsx','.web.ts','.ts','.web.js','.js','.json'],loader:{'.js':'jsx'},define:{global:'globalThis',__DEV__:'false','process.env.NODE_ENV':'"production"'}});
require('fs').writeFileSync(dir+'/index.html','<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}</style><div id="root"></div><script src="app.js"></script>');
''', directory], check=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(Path(directory, 'index.html').as_uri(), wait_until='networkidle')
        def click(name): page.get_by_role('button', name=name, exact=True).click()
        def title(): page.get_by_role('button', name='ゲームをはじめる', exact=True).wait_for()
        def resume(): page.get_by_role('button', name=re.compile('全問のつづきから')).click()
        def quit_game():
            click('ゲームをやめる')
            click('タイトルへ戻る')
            title()
        def setup(players=1, count='全問', timing='1問ごとに表示', limit='無制限'):
            click('ゲームをはじめる'); click('日本の伝統色を選ぶ')
            for label in [f'{players}人', count, timing, limit]:
                page.get_by_role('radio', name=label, exact=True).click()
            click('次へ'); click('ゲームをはじめる')
        title()
        setup()
        page.get_by_text('第1問 / 119問', exact=True).wait_for()
        click('はじめる')
        page.get_by_test_id('target-color').wait_for()
        click('ゲームをやめる')
        page.get_by_text(re.compile('全問モードの進捗は保存され')).wait_for()
        click('ゲームを続ける')
        before = page.evaluate('() => window.progressTest.load()')
        page.reload(wait_until='networkidle'); title(); resume()
        page.get_by_text('第1問 / 119問', exact=True).wait_for()
        assert page.get_by_test_id('target-color').count() == 0
        after = page.evaluate('() => window.progressTest.load()')
        assert after['session'] == before['session']
        quit_game()
        print('PASS: 全問設定・保存案内・プレイ中リロードからquestionIntroに復元', flush=True)
        saved = page.evaluate('() => window.progressTest.seed({index:5, players:2})')
        page.reload(wait_until='networkidle'); title(); resume()
        page.get_by_text('第6問 / 119問', exact=True).wait_for()
        loaded = page.evaluate('() => window.progressTest.load()')['session']
        for key in ['questions', 'answers', 'currentQuestionIndex', 'currentPlayerIndex']:
            assert loaded[key] == saved[key], key
        quit_game()
        setup(players=2, count='3問')
        page.get_by_role('button', name='準備OK', exact=True).wait_for()
        click('準備OK')
        page.get_by_text('第1問 / 3問', exact=True).wait_for()
        quit_game()
        assert page.get_by_role('button', name=re.compile('全問のつづきから')).count() == 1
        print('PASS: 2人の6問目・問題順/回答/位置保持、新規通常ゲームは1問目', flush=True)
        for timing in ['question', 'final']:
            page.evaluate('(timing) => window.progressTest.seed({index:118, status:"answerSaved", resultTiming:timing})', timing)
            page.reload(wait_until='networkidle'); title(); resume()
            click('結果を見る' if timing == 'question' else '最終結果を見る')
            if timing == 'question': click('最終結果を見る')
            page.get_by_text('最終結果', exact=True).wait_for()
            assert page.evaluate('() => window.progressTest.load()') is None
            page.get_by_role('button', name=re.compile('第1問 .*詳細を見る')).click()
            page.get_by_test_id('canonical-answer').wait_for()
            click('最終結果へ戻る'); click('タイトルへ戻る'); title()
            assert page.get_by_role('button', name=re.compile('全問のつづきから')).count() == 0
            page.reload(wait_until='networkidle'); title()
            assert page.get_by_role('button', name=re.compile('全問のつづきから')).count() == 0
        print('PASS: 両結果表示で119問完走後に保存削除、結果詳細・再起動後もつづきなし', flush=True)
        # Exercise the real timer, handoff, result and replay screens for 1–4 players.
        page.clock.install()
        for players in [1, 2, 3, 4]:
            timing = '1問ごとに表示' if players % 2 else '最後にまとめて表示'
            setup(players=players, count='3問', timing=timing, limit='15秒')
            for q in range(3):
                for player in range(players):
                    if players > 1: click('準備OK')
                    click('はじめる')
                    page.get_by_test_id('target-color').wait_for()
                    page.clock.fast_forward(16000)
                    page.get_by_role('heading', name='回答しました' if players == 1 else '回答を保存しました', exact=True).wait_for()
                    if player < players - 1: click('次へ')
                    elif timing == '1問ごとに表示':
                        click('結果を見る'); page.get_by_test_id('canonical-answer').wait_for()
                        click('最終結果を見る' if q == 2 else '次の問題へ')
                    else: click('最終結果を見る' if q == 2 else '次の問題へ')
            page.get_by_text('最終結果', exact=True).wait_for()
            click('もう一度遊ぶ')
            if players > 1: click('準備OK')
            page.get_by_text('第1問 / 3問', exact=True).wait_for()
            quit_game()
            print(f'PASS: {players}人・3問・15秒タイマー・{timing}・リプレイ・終了', flush=True)
        assert not errors, errors
        browser.close()
