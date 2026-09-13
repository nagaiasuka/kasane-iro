# Browser regression for all release stages; real App and AsyncStorage web implementation.
import re
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

STAGES = [('traditional', '日本の伝統色', 119), ('seasons', '四季の色', 40), ('nature', '自然の色', 40), ('color-learning', '色彩を学ぶ', 30)]
with tempfile.TemporaryDirectory(prefix='kasane-stages-') as directory:
    subprocess.run(['node', '-e', r'''
const dir = process.argv[1];
require('esbuild').buildSync({entryPoints:['scripts/progress-fixture.jsx'],bundle:true,outfile:dir+'/app.js',platform:'browser',alias:{'react-native':'react-native-web'},resolveExtensions:['.web.tsx','.tsx','.web.ts','.ts','.web.js','.js','.json'],loader:{'.js':'jsx'},define:{global:'globalThis',__DEV__:'false','process.env.NODE_ENV':'"production"'}});
require('fs').writeFileSync(dir+'/index.html','<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}</style><div id="root"></div><script src="app.js"></script>');
''', directory], check=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width':390, 'height':844})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(Path(directory, 'index.html').as_uri(), wait_until='networkidle')
        def click(name): page.get_by_role('button', name=name, exact=True).click()
        def title(): page.get_by_role('button', name='ゲームをはじめる', exact=True).wait_for()
        def quit_game():
            click('ゲームをやめる'); click('タイトルへ戻る'); title()
        def resume(): page.get_by_role('button', name=re.compile('のつづきから')).click()
        # Stage list remains scrollable on small phones; each card stays within its width.
        for width, height in [(320,568), (375,667), (390,844), (412,915)]:
            page.set_viewport_size({'width':width, 'height':height})
            click('ゲームをはじめる')
            assert page.get_by_role('button', name=re.compile('を選ぶ$')).count() == 4
            palettes = []
            for stage_id, name, total in STAGES:
                card = page.get_by_role('button', name=name+'を選ぶ', exact=True)
                card.scroll_into_view_if_needed()
                card.get_by_text(f'全{total}問', exact=True).wait_for()
                count = card.get_by_text(f'出題数：3 / 5 / 10 / 全{total}問', exact=True)
                assert count.bounding_box()['height'] == 22
                palettes.append(card.locator('*').evaluate_all('(els) => els.filter(e => e.getBoundingClientRect().width === 44 && e.getBoundingClientRect().height === 44).map(e => getComputedStyle(e).backgroundColor)'))
                assert len(palettes[-1]) == 4
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                if width == 320: card.screenshot(path=f'/tmp/kasane-stage-{stage_id}.png')
            assert len(set(tuple(colors) for colors in palettes)) == 4
            click('タイトルへ戻る')
        print('PASS: 4 stages, per-stage totals and distinct palettes, 320/375/390/412px', flush=True)
        page.set_viewport_size({'width':390, 'height':844})
        for stage_id, name, total in STAGES:
            # All setting counts start at question 1 and stay in the selected stage.
            for count in [3,5,10,total]:
                click('ゲームをはじめる'); click(name+'を選ぶ')
                for label in ['3問','5問','10問',f'全{total}問']:
                    page.get_by_role('radio', name=label, exact=True).wait_for()
                page.get_by_role('radio', name=f'全{total}問' if count == total else f'{count}問', exact=True).click()
                click('次へ'); click('ゲームをはじめる')
                page.get_by_text(f'第1問 / {count}問', exact=True).wait_for()
                assert page.get_by_test_id('question-explanation').count() == 0
                if count == total:
                    saved = page.evaluate('() => window.progressTest.load()')
                    assert saved['stageId'] == stage_id
                    assert len(saved['session']['questions']) == total
                quit_game()
            # Reload during play and preserve all order/answer/index fields.
            saved = page.evaluate('(stageId) => window.progressTest.seed({stageId,index:16})', stage_id)
            page.reload(wait_until='networkidle'); title()
            page.get_by_role('button', name=f'{name}のつづきから（17/{total}問）', exact=True).wait_for()
            resume(); page.get_by_text(f'第17問 / {total}問', exact=True).wait_for()
            loaded = page.evaluate('() => window.progressTest.load()')['session']
            for key in ['questions','answers','currentQuestionIndex','currentPlayerIndex','settings']:
                assert loaded[key] == saved[key]
            assert loaded['gameStatus'] == 'questionIntro'
            quit_game()
            for timing in ['question','final']:
                page.evaluate('(args) => window.progressTest.seed(args)', {'stageId':stage_id,'index':total-1,'status':'answerSaved','resultTiming':timing})
                page.reload(wait_until='networkidle'); title(); resume()
                assert page.get_by_test_id('question-explanation').count() == 0
                click('結果を見る' if timing == 'question' else '最終結果を見る')
                if timing == 'question':
                    page.get_by_test_id('canonical-answer').wait_for()
                    assert page.get_by_test_id('question-explanation').count() == (1 if stage_id == 'color-learning' else 0)
                    click('最終結果を見る')
                page.get_by_text('最終結果', exact=True).wait_for()
                assert page.evaluate('() => window.progressTest.load()') is None
                page.get_by_role('button', name=re.compile('第1問 .*詳細を見る')).click()
                page.get_by_test_id('canonical-answer').wait_for()
                assert page.get_by_test_id('question-explanation').count() == (1 if stage_id == 'color-learning' else 0)
                click('最終結果へ戻る'); click('もう一度遊ぶ')
                page.get_by_text(f'第1問 / {total}問', exact=True).wait_for()
                replay = page.evaluate('() => window.progressTest.load()')
                assert replay['stageId'] == stage_id
                assert len(replay['session']['questions']) == total
                quit_game()
                # Finish once more and ensure the resume button stays absent after restart.
                page.evaluate('(args) => window.progressTest.seed(args)', {'stageId':stage_id,'index':total-1,'status':'answerSaved','resultTiming':'final'})
                page.reload(wait_until='networkidle'); title(); resume(); click('最終結果を見る')
                click('タイトルへ戻る'); title()
                assert page.get_by_role('button', name=re.compile('のつづきから')).count() == 0
                page.reload(wait_until='networkidle'); title()
                assert page.get_by_role('button', name=re.compile('のつづきから')).count() == 0
            print(f'PASS: {name} 3/5/10/all, resume 17/{total}, explanation visibility, completion cleanup and replay', flush=True)
        assert not errors, errors
        browser.close()
