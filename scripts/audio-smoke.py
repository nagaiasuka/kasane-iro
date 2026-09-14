# Optional UI integration: KASANE_WEB_URL=http://localhost:8095 python scripts/audio-smoke.py
# Requires Python Playwright/Chromium. Records actual HTML audio requests through expo-audio.
import json
import os
import subprocess
from playwright.sync_api import sync_playwright

questions = json.loads(subprocess.check_output(['node', '--import', 'tsx', '-e',
    "console.log(JSON.stringify(require('./src/data/questions').QUESTIONS))"], text=True))
recipes = {q['name']: q['recipe'] for q in questions}
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 375, 'height': 667})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script('''window.soundRequests = [];
      const blobSources = new WeakMap(); const sourceUrls = new Map();
      const realFetch = window.fetch;
      window.fetch = async (...args) => {
        const response = await realFetch(...args);
        const getBlob = response.blob.bind(response);
        response.blob = async () => { const blob = await getBlob(); blobSources.set(blob, response.url); return blob; };
        return response;
      };
      const createUrl = URL.createObjectURL.bind(URL);
      URL.createObjectURL = blob => { const url = createUrl(blob); sourceUrls.set(url, blobSources.get(blob)); return url; };
      const original = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function() {
        window.soundRequests.push(sourceUrls.get(this.src) || this.src);
        return original.call(this);
      };''')
    page.goto(os.environ.get('KASANE_WEB_URL', 'http://localhost:8095'), wait_until='networkidle')
    def click(label): page.get_by_role('button', name=label, exact=True).click()
    def sounds(): return page.evaluate('window.soundRequests')
    def clear(): page.evaluate('window.soundRequests = []')
    def expect_sound(name):
        page.wait_for_timeout(250)
        requests = sounds()
        assert len(requests) == 1 and name in requests[0], (name, requests)
        clear()
    def drag(card, target='play-field'):
        source = page.get_by_test_id('card-' + card).bounding_box()
        destination = page.get_by_test_id(target).bounding_box()
        x, y = source['x'] + source['width']/2, source['y'] + 5
        dx = destination['x'] + destination['width']/2 - (source['x'] + source['width']/2)
        dy = destination['y'] + destination['height']/2 - (source['y'] + source['height']/2)
        page.mouse.move(x, y); page.mouse.down()
        page.wait_for_timeout(80)
        assert sounds() == [], 'drag start must be silent'
        page.mouse.move(x + dx, y + dy, steps=15); page.mouse.up()
        page.wait_for_timeout(300)
    click('設定')
    bgm = page.get_by_role('switch', name='BGM', exact=True)
    se = page.get_by_role('switch', name='効果音', exact=True)
    bgm.wait_for(); page.wait_for_function("document.querySelector('[role=switch]') && !document.querySelector('[role=switch]').disabled")
    bgm.uncheck(); se.uncheck(); page.wait_for_timeout(200)
    page.screenshot(path='/tmp/kasane-audio-settings.png')
    click('閉じる'); page.reload(wait_until='networkidle'); click('設定')
    assert not bgm.is_checked() and not se.is_checked()
    clear(); click('閉じる'); click('ゲームをはじめる')
    assert sounds() == [], 'SE OFF navigation must be silent'
    click('タイトルへ戻る'); click('設定'); se.check(); bgm.check(); click('閉じる')
    page.wait_for_timeout(250); clear()
    click('ゲームをはじめる'); expect_sound('button')
    click('色彩を学ぶを選ぶ'); click('次へ'); click('ゲームをはじめる'); click('はじめる')
    page.wait_for_timeout(400); clear()
    drag('C70'); expect_sound('card-place')
    drag('C70', 'hand-area'); expect_sound('card-remove')
    # Drop above the board: geometry is invalid, no state change or sound.
    source = page.get_by_test_id('card-C70').bounding_box()
    page.mouse.move(source['x'] + source['width']/2, source['y'] + 5); page.mouse.down()
    page.mouse.move(20, 20, steps=15); page.mouse.up(); page.wait_for_timeout(300)
    assert sounds() == [], sounds()
    drag('C70'); expect_sound('card-place'); click('リセット'); expect_sound('reset')
    click('リセット'); assert sounds() == [], 'empty reset must be silent'
    name = page.get_by_test_id('target-color').locator('..').locator('..').inner_text().split('お題の色')[1].strip().split()[0]
    for card in recipes[name]: drag(card); expect_sound('card-place')
    click('この色で回答する'); expect_sound('confirm')
    click('結果を見る'); expect_sound('perfect')
    page.set_viewport_size({'width': 390, 'height': 844}); page.wait_for_timeout(300)
    assert sounds() == [], 'result rerender must be silent'
    assert not errors, errors
    print('PASS: settings persistence, SE OFF, valid/invalid drops, reset, confirm, perfect once, small-screen modal')
    browser.close()
