# Optional browser regression check: run Expo on port 8093; requires Python Playwright + Chromium.
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(os.environ.get('KASANE_WEB_URL', 'http://localhost:8093'), wait_until='networkidle')
    def click(name): page.get_by_role('button', name=name, exact=True).click()
    def drag(card, destination='play-field', top=False):
        page.wait_for_timeout(700)
        source = page.get_by_test_id('card-' + card).bounding_box()
        target = page.get_by_test_id(destination).bounding_box()
        x = source['x'] + source['width'] / 2
        y = source['y'] + (5 if top else source['height'] / 2)
        dx = target['x'] + target['width']/2 - (source['x'] + source['width']/2)
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
            assert card.inner_text() == labels[id]
            box = card.bounding_box()
            if previous:
                assert previous['y'] < box['y'] < previous['y'] + previous['height']
            previous = box
            assert int(card.evaluate('(el) => getComputedStyle(el).zIndex')) == i + 10
        assert not any(id in page.locator('body').inner_text() for id in labels)
    setup()
    canonical = [['C70','Y70'], ['M50','C50'], ['Y50','M50']]
    played = ['Y70', 'C70', 'K25']
    for q in range(3):
        hidden(); click('はじめる'); hidden()
        for id in played: drag(id)
        click('この色で回答する'); hidden(); click('結果を見る')
        page.get_by_test_id('canonical-answer').wait_for()
        verify_stack('answer-recipe', canonical[q])
        verify_stack('player-recipe-player-1', played)
        for width in [320, 430, 520]:
            page.set_viewport_size({'width':width, 'height':844}); page.wait_for_timeout(700)
            left = page.get_by_test_id('canonical-answer').bounding_box()
            right = page.get_by_test_id('player-answer-player-1').bounding_box()
            if width == 320: assert right['y'] > left['y'] + left['height']
            else: assert abs(left['y']-right['y']) < 1 and right['x'] > left['x']
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        if q == 0: page.screenshot(path='/tmp/kasane-comparison.png', full_page=True)
        click('最終結果を見る' if q == 2 else '次の問題へ')
    click('第2問 藤　詳細を見る')
    verify_stack('answer-recipe', canonical[1]); verify_stack('player-recipe-player-1', played)
    page.reload(wait_until='networkidle'); setup(players=2)
    for n, recipe in enumerate([['C50'], ['M70']]):
        hidden(); click('準備OK'); hidden(); click('はじめる')
        for id in recipe: drag(id)
        click('この色で回答する'); hidden(); click('次へ' if n == 0 else '結果を見る')
    assert page.get_by_test_id('canonical-answer').count() == 1
    verify_stack('player-recipe-player-1', ['C50']); verify_stack('player-recipe-player-2', ['M70'])
    canonical_box = page.get_by_test_id('canonical-answer').bounding_box()
    for n in [1,2]: assert page.get_by_test_id(f'player-answer-player-{n}').bounding_box()['y'] > canonical_box['y']
    page.reload(wait_until='networkidle'); setup(timer=True)
    click('はじめる'); page.wait_for_timeout(16000); hidden(); click('結果を見る')
    verify_stack('player-recipe-player-1', [])
    assert '空回答 ・ 時間切れ' in page.get_by_test_id('player-answer-player-1').inner_text()
    assert not errors, errors
    print('PASS: canonical/actual recipes, order, labels, responsive comparison, detail, multiplayer privacy, empty timeout, no browser errors')
    browser.close()
