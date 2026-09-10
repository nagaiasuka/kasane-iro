# Optional browser regression check: run Expo on port 8087; requires Python Playwright + Chromium.
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(os.environ.get('KASANE_WEB_URL', 'http://localhost:8087'), wait_until='networkidle')
    labels = {'C70':'青・濃', 'C50':'青・淡', 'M70':'赤・濃', 'M50':'赤・淡', 'Y70':'黄・濃', 'Y50':'黄・淡', 'K25':'黒'}
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
    click('遊び方')
    page.get_by_text('遊び方 1/3',exact=True).wait_for()
    click('次へ'); page.get_by_text('遊び方 2/3',exact=True).wait_for()
    assert 'C70' not in page.locator('body').inner_text()
    click('戻る'); page.get_by_text('遊び方 1/3',exact=True).wait_for()
    click('次へ'); click('次へ'); page.get_by_text('遊び方 3/3',exact=True).wait_for()
    click('わかった')
    def hidden_answer():
        assert page.get_by_test_id('canonical-answer').count()==0
        assert page.get_by_test_id('answer-recipe').count()==0
    def cancel_quit():
        click('ゲームをやめる')
        page.get_by_text('ゲームをやめますか？',exact=True).wait_for()
        click('ゲームを続ける')
    # Discard a session at intro, then verify a new game starts fresh.
    setup(); cancel_quit()
    page.get_by_role('button',name='はじめる',exact=True).wait_for()
    click('ゲームをやめる'); click('タイトルへ戻る')
    def intro():
        hidden_answer()
        assert page.get_by_test_id('card-C70').count()==0
        click('はじめる'); empty_board()
    def saved(next_label):
        page.get_by_role('heading',name='回答しました',exact=True).or_(page.get_by_role('heading',name='回答を保存しました',exact=True)).wait_for()
        assert page.get_by_test_id('current-color').count()==0
        assert page.get_by_test_id('stack-order').count()==0
        hidden_answer()
        cancel_quit()
        body=page.locator('body').inner_text()
        assert '%' not in body and 'C70' not in body and 'Y70' not in body
        click(next_label)
    setup()
    intro()
    drag('C70'); cancel_quit()
    assert '青・濃' in page.get_by_test_id('stack-order').inner_text()
    click('リセット')
    for card in ['C70','C50','M70','M50','Y70','Y50','K25']:
        drag(card)
    assert '青・濃 → 青・淡 → 赤・濃 → 赤・淡 → 黄・濃 → 黄・淡 → 黒' in page.get_by_test_id('stack-order').inner_text()
    drag('M50','hand-area',True)
    drag('C70','hand-area',True)
    assert '青・淡 → 赤・濃 → 黄・濃 → 黄・淡 → 黒' in page.get_by_test_id('stack-order').inner_text()
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
        saved('結果を見る')
        page.get_by_text('再現率 100.0%',exact=True).first.wait_for()
        page.get_by_test_id('canonical-answer').wait_for()
        assert page.get_by_test_id('answer-recipe').get_by_text(labels[recipe[0]],exact=True).count()==1
        cancel_quit()
        assert page.get_by_test_id('card-C70').count()==0
        click('最終結果を見る' if i==2 else '次の問題へ')
        if i<2: intro()
    page.get_by_text('最終結果',exact=True).wait_for()
    assert page.get_by_text('100.0%',exact=True).count()==1
    click('第2問 藤　詳細を見る')
    page.get_by_text('第2問の詳細',exact=True).wait_for()
    assert page.get_by_text('再現率 100.0%',exact=True).count()==2
    assert '赤・淡' in page.get_by_test_id('answer-recipe').inner_text()
    assert '青・淡' in page.get_by_test_id('answer-recipe').inner_text()
    click('最終結果へ戻る')
    page.screenshot(path='/tmp/kasane-iro-phase4-final.png',full_page=True)
    click('もう一度遊ぶ'); intro()
    page.reload(wait_until='networkidle')
    setup(2)
    for q in range(3):
        for player in range(2):
            page.get_by_text(('飛鳥' if player==0 else 'プレイヤー2')+'さんに\nスマホを渡してください',exact=True).wait_for()
            assert page.get_by_test_id('current-color').count()==0
            assert page.get_by_test_id('stack-order').count()==0
            hidden_answer(); cancel_quit()
            click('準備OK'); intro(); drag('C70'); click('この色で回答する')
            saved('次へ' if player==0 else '結果を見る')
        page.get_by_text(f'第{q+1}問の結果',exact=True).wait_for()
        click('最終結果を見る' if q==2 else '次の問題へ')
    page.get_by_text('1位　飛鳥',exact=True).wait_for()
    page.get_by_text('1位　プレイヤー2',exact=True).wait_for()
    click('もう一度遊ぶ'); click('準備OK'); intro()
    page.reload(wait_until='networkidle')
    setup(final=True,timer=True)
    # Intro must remain untimed, even beyond the configured 15 seconds.
    page.wait_for_timeout(16000)
    assert page.get_by_role('button',name='はじめる',exact=True).count()==1
    assert page.get_by_text('残り',exact=False).count()==0
    for q in range(3):
        intro()
        page.get_by_text('残り 15秒',exact=True).wait_for()
        if q==1: drag('M50')
        page.wait_for_timeout(16000)
        # Saved is also an explicit boundary; it never advances automatically.
        page.wait_for_timeout(1000)
        saved('最終結果を見る' if q==2 else '次の問題へ')
    page.get_by_text('最終結果',exact=True).wait_for()
    for q,name in enumerate(['萌黄','藤','紅梅']):
        click(f'第{q+1}問 {name}　詳細を見る')
        assert page.get_by_text('時間切れ',exact=False).count()==1
        if q!=1: assert page.get_by_text('空回答 ・ 時間切れ',exact=True).count()==1
        click('最終結果へ戻る')
    click('タイトルへ戻る')
    page.get_by_role('button',name='ゲームをはじめる').wait_for()
    page.reload(wait_until='networkidle'); setup(final=True,ten=True)
    for q in range(10):
        page.get_by_text(f'第{q+1}問 / 10問',exact=True).wait_for(); intro()
        drag('C50'); click('この色で回答する'); saved('最終結果を見る' if q==9 else '次の問題へ')
    page.get_by_text('最終結果',exact=True).wait_for()
    button_names=page.get_by_role('button').all_text_contents()
    assert button_names.index('第10問 鼠　詳細を見る') < button_names.index('もう一度遊ぶ')
    assert not errors,errors
    print('PASS: how-to/stage, intro/saved boundaries, result details, solo, 2-player privacy/tie/replay, 10 questions, final-only, empty/nonempty timeout, card regressions, small viewports, no browser errors')
    browser.close()
