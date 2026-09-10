# Optional browser regression check: run Expo on port 8087; requires Python Playwright + Chromium.
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://localhost:8087', wait_until='networkidle')
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
        page.get_by_role('radio',name=f'{players}人',exact=True).click()
        if final: page.get_by_role('radio',name='最後にまとめて表示',exact=True).click()
        if timer: page.get_by_role('radio',name='15秒',exact=True).click()
        if ten: page.get_by_role('radio',name='10問',exact=True).click()
        click('次へ')
        assert page.get_by_role('textbox').count() == players
        page.get_by_role('textbox').first.fill('飛鳥')
        if players>1: page.get_by_role('textbox').nth(1).fill(' ')
        click('ゲームをはじめる')
    setup()
    empty_board()
    for card in ['C70','C50','M70','M50','Y70','Y50','K25']:
        drag(card)
    assert 'C70 → C50 → M70 → M50 → Y70 → Y50 → K25' in page.get_by_test_id('stack-order').inner_text()
    drag('M50','hand-area',True)
    drag('C70','hand-area',True)
    assert 'C50 → M70 → Y70 → Y50 → K25' in page.get_by_test_id('stack-order').inner_text()
    click('リセット'); empty_board()
    for width,height in [(320,568),(375,667),(412,915)]:
        page.set_viewport_size({'width':width,'height':height}); page.wait_for_timeout(600)
        box=page.get_by_role('button',name='この色で回答する').bounding_box()
        assert box['y']+box['height']<=height,(width,box)
    page.set_viewport_size({'width':390,'height':844})
    for i,recipe in enumerate([['C70','Y70'],['M50','C50'],['Y50','M50']]):
        empty_board()
        for card in recipe: drag(card)
        click('この色で回答する')
        page.get_by_text('100.0%',exact=True).wait_for()
        assert page.get_by_test_id('card-C70').count()==0
        click('最終結果を見る' if i==2 else '次の問題へ')
    page.get_by_text('最終結果',exact=True).wait_for()
    assert page.get_by_text('100.0%',exact=True).count()==4
    page.screenshot(path='/tmp/kasane-iro-phase3-final.png',full_page=True)
    click('もう一度遊ぶ'); empty_board()
    page.reload(wait_until='networkidle')
    setup(2)
    for q in range(3):
        for player in range(2):
            page.get_by_text(('飛鳥' if player==0 else 'プレイヤー2')+'さんに\nスマホを渡してください',exact=True).wait_for()
            assert page.get_by_test_id('current-color').count()==0
            assert page.get_by_test_id('stack-order').count()==0
            click('準備OK'); empty_board(); drag('C70'); click('この色で回答する')
        page.get_by_text(f'第{q+1}問の結果',exact=True).wait_for()
        click('最終結果を見る' if q==2 else '次の問題へ')
    page.get_by_text('1位　飛鳥',exact=True).wait_for()
    page.get_by_text('1位　プレイヤー2',exact=True).wait_for()
    click('もう一度遊ぶ'); click('準備OK'); empty_board()
    page.reload(wait_until='networkidle')
    setup(final=True,timer=True)
    empty_board()
    page.wait_for_timeout(16000)
    page.get_by_text('第2問 / 3問',exact=True).wait_for(); empty_board()
    drag('M50')
    page.wait_for_timeout(15000)
    page.get_by_text('第3問 / 3問',exact=True).wait_for(); empty_board()
    page.wait_for_timeout(16000)
    page.get_by_text('最終結果',exact=True).wait_for()
    assert page.get_by_text('0.0% ・ 空回答 ・ 時間切れ',exact=True).count()==2
    assert page.get_by_text('時間切れ',exact=False).count()==3
    click('タイトルへ戻る')
    page.get_by_role('button',name='ゲームをはじめる').wait_for()
    page.reload(wait_until='networkidle'); setup(final=True,ten=True)
    for q in range(10):
        page.get_by_text(f'第{q+1}問 / 10問',exact=True).wait_for(); empty_board()
        drag('C50'); click('この色で回答する')
    page.get_by_text('最終結果',exact=True).wait_for()
    assert not errors,errors
    print('PASS: solo, 2-player privacy/tie/replay, 10 questions, final-only, empty/nonempty timeout, card regressions, small viewports, no browser errors')
    browser.close()
