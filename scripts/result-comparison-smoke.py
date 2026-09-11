# Optional browser regression check: run Expo on port 8094; requires Python Playwright + Chromium.
import os
import sys
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

fixture_dir = tempfile.TemporaryDirectory(prefix='kasane-result-layout-')
subprocess.run(['node', '-e', """
const dir = process.argv[1];
require('esbuild').buildSync({entryPoints:['scripts/result-layout-fixture.jsx'],bundle:true,outfile:dir+'/app.js',platform:'browser',alias:{'react-native':'react-native-web'},resolveExtensions:['.web.tsx','.tsx','.web.ts','.ts','.web.js','.js','.json'],loader:{'.js':'jsx'},define:{global:'globalThis',__DEV__:'false','process.env.NODE_ENV':'\"production\"'}});
require('fs').writeFileSync(dir+'/index.html','<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}</style><div id="root"></div><script src="app.js"></script>');
""", fixture_dir.name], check=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    def click(name): page.get_by_role('button', name=name, exact=True).click()
    def drag(card, destination='play-field', top=False):
        page.wait_for_timeout(700)
        source = page.get_by_test_id('card-' + card).bounding_box()
        target = page.get_by_test_id(destination).bounding_box()
        x = source['x'] + source['width'] / 2
        y = source['y'] + (5 if top else source['height'] / 2)
        # Use a clear diagonal gesture, avoiding a near-vertical drag in the web responder.
        destination_x = target['x'] + target['width'] * (0.85 if x < target['x'] + target['width']/2 else 0.15)
        dx = destination_x - x
        dy = target['y'] + target['height']/2 - (source['y'] + source['height']/2)
        page.mouse.move(x,y); page.mouse.down(); page.mouse.move(x+dx,y+dy,steps=15); page.mouse.up()
        page.wait_for_timeout(600)
    def empty_board():
        page.get_by_test_id('stack-order').wait_for()
        assert 'まだ重ねていません' in page.get_by_test_id('stack-order').inner_text()
    def setup(players=1, final=False, timer=False, ten=False):
        click('ゲームをはじめる')
        click('日本の伝統色を選ぶ')
        page.get_by_text('日本の伝統色', exact=True).wait_for()
        page.get_by_role('radio',name=f'{players}人',exact=True).click()
        if final: page.get_by_role('radio',name='最後にまとめて表示',exact=True).click()
        if timer: page.get_by_role('radio',name='15秒',exact=True).click()
        if ten: page.get_by_role('radio',name='10問',exact=True).click()
        click('次へ')
        assert page.get_by_role('textbox').count() == players
        page.get_by_role('textbox').first.fill('飛鳥')
        if players>1: page.get_by_role('textbox').nth(1).fill(' ')
        click('ゲームをはじめる')
    labels = {'C70':'青・濃', 'C50':'青・淡', 'M70':'赤・濃', 'M50':'赤・淡', 'Y70':'黄・濃', 'Y50':'黄・淡', 'K25':'黒'}
    def hidden():
        assert page.get_by_test_id('canonical-answer').count() == 0
        assert page.locator('[data-testid^="player-recipe-"]').count() == 0
    def verify_stack(test_id, recipe):
        stack = page.get_by_test_id(test_id)
        cards = stack.locator('[data-testid*="-card-"]')
        if recipe: cards.nth(len(recipe) - 1).wait_for()
        assert cards.count() == len(recipe)
        previous = None
        for i, id in enumerate(recipe):
            card = cards.nth(i)
            assert card.get_attribute('aria-label').startswith(labels[id])
            box = card.bounding_box()
            if previous:
                assert previous['y'] < box['y'] < previous['y'] + previous['height']
            previous = box
            assert int(card.evaluate('(el) => getComputedStyle(el).zIndex')) == i + 10
        assert not any(id in page.locator('body').inner_text() for id in labels)
    viewports = [(320,568), (375,667), (390,844), (412,915)]
    def verify_layout(count):
        for width, height in viewports:
            page.set_viewport_size({'width':width, 'height':height}); page.wait_for_timeout(700)
            blocks = [page.get_by_test_id('canonical-answer').bounding_box()] + [page.get_by_test_id(f'player-answer-player-{n+1}').bounding_box() for n in range(count)]
            next_button = page.get_by_role('button',name='次の問題へ',exact=True).bounding_box()
            assert next_button['y'] + next_button['height'] <= height, (count,width,next_button)
            assert all(b['x'] >= 0 and b['x']+b['width'] <= width and b['y']+b['height'] <= height for b in blocks), (count,width,blocks)
            if count <= 2: assert max(b['y'] for b in blocks) - min(b['y'] for b in blocks) < 1
            if count == 3: assert len(set(round(b['y']) for b in blocks)) == 2
            if count == 4: assert len(set(round(b['y']) for b in blocks)) == 3 and blocks[0]['y'] == min(b['y'] for b in blocks)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            scrolls = page.locator('*').evaluate_all('(els) => els.filter(e => getComputedStyle(e).overflowY === "auto" || getComputedStyle(e).overflowY === "scroll").map(e => e.scrollHeight-e.clientHeight)')
            assert all(delta <= 1 for delta in scrolls), (count, width, scrolls)
            page.screenshot(path=f'/tmp/kasane-phase42-{count}p-{width}.png',full_page=True)
    for count in [1,2,3,4]:
        page.goto(Path(fixture_dir.name, 'index.html').as_uri() + f'?players={count}', wait_until='networkidle')
        page.get_by_test_id('canonical-answer').wait_for()
        for n in range(count): verify_stack(f'player-recipe-player-{n+1}', list(reversed(list(labels))))
        verify_layout(count)
        print(f'PASS: seven-card fixture, {count} players, all four sizes, no scroll', flush=True)
    if '--layout-only' in sys.argv:
        assert not errors, errors
        browser.close()
        fixture_dir.cleanup()
        sys.exit(0)
    page.goto(os.environ.get('KASANE_WEB_URL', 'http://localhost:8094'), wait_until='networkidle')
    for count in [1,2,3,4]:
        page.set_viewport_size({'width':390, 'height':844})
        if count > 1: page.reload(wait_until='networkidle')
        setup(players=count)
        recipes = [['Y70','C70'], ['C50'], ['M70'], ['M50','K25']]
        for n in range(count):
            hidden()
            if count > 1: click('準備OK')
            click('はじめる'); hidden()
            for id in recipes[n]:
                drag(id)
                assert labels[id] in page.get_by_test_id('stack-order').inner_text(), id
            click('この色で回答する'); hidden(); click('次へ' if n < count - 1 else '結果を見る')
        page.get_by_test_id('canonical-answer').wait_for()
        verify_stack('answer-recipe', ['C70','Y70'])
        for n in range(count): verify_stack(f'player-recipe-player-{n+1}', recipes[n])
        verify_layout(count)
        print(f'PASS: {count} players, all four viewport sizes, no scroll', flush=True)
        if count == 1:
            for q in [1,2]:
                click('次の問題へ'); click('はじめる'); drag('C50'); click('この色で回答する'); click('結果を見る')
            click('最終結果を見る'); click('第1問 萌黄　詳細を見る')
            verify_stack('answer-recipe', ['C70','Y70']); verify_stack('player-recipe-player-1', recipes[0])
    page.reload(wait_until='networkidle'); setup(final=True,timer=True)
    for q in range(3):
        hidden(); click('はじめる'); page.wait_for_timeout(16000); hidden()
        click('最終結果を見る' if q == 2 else '次の問題へ'); hidden()
    click('第1問 萌黄　詳細を見る')
    verify_stack('answer-recipe', ['C70','Y70']); verify_stack('player-recipe-player-1', [])
    assert '空回答 ・ 時間切れ' in page.get_by_test_id('player-answer-player-1').inner_text()
    assert not errors, errors
    print('PASS: canonical/actual recipes, seven-card order, labels, detailed view, multiplayer/final-only privacy, empty timeout, no browser errors')
    browser.close()
fixture_dir.cleanup()
