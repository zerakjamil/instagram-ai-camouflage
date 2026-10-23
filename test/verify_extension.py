#!/usr/bin/env python3
import asyncio
import os
import sys
import threading
import http.server
import socketserver
from playwright.async_api import async_playwright

PORT = 8992
EXTENSION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=EXTENSION_DIR, **kwargs)

    def log_message(self, format, *args):
        pass # Suppress noisy server logs

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), CustomHandler) as httpd:
        httpd.serve_forever()

async def run_verification():
    print(f"[*] Starting local mock server on port {PORT}...")
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    await asyncio.sleep(0.5)

    print(f"[*] Launching Chromium with extension loaded from: {EXTENSION_DIR}")
    async with async_playwright() as p:
        # Launch persistent context with extension loaded
        user_data_dir = "/tmp/aether_test_profile"
        os.system(f"rm -rf {user_data_dir}")

        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=False,
            args=[
                f"--disable-extensions-except={EXTENSION_DIR}",
                f"--load-extension={EXTENSION_DIR}",
                "--no-sandbox",
                "--headless=new"
            ],
            viewport={"width": 1280, "height": 800}
        )

        try:
            page = await context.new_page()
            url = f"http://127.0.0.1:{PORT}/test/instagram_mock.html"
            print(f"[*] Navigating to {url}...")
            await page.goto(url, wait_until="networkidle")

            # 1. Check Shadow DOM Mount
            print("[*] Waiting for #insta-ai-camouflage-root...")
            await page.wait_for_selector("#insta-ai-camouflage-root", timeout=6000)
            print("✓ Found #insta-ai-camouflage-root")

            # Evaluate inside Shadow DOM
            brand_name = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    if (!host || !host.shadowRoot) return null;
                    const el = host.shadowRoot.querySelector('.brand-name');
                    return el ? el.textContent.trim() : null;
                }
            """)
            print(f"✓ Gemini Brand Name detected in Shadow DOM: '{brand_name}'")
            assert brand_name == "Gemini", f"Expected Gemini, got {brand_name}"

            # 2. Check Obfuscated Chat Sidebar
            chat_titles = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const items = Array.from(host.shadowRoot.querySelectorAll('.chat-session-title'));
                    return items.map(i => i.textContent.trim());
                }
            """)
            print(f"✓ Obfuscated Chat Topics in Sidebar: {chat_titles}")
            assert len(chat_titles) >= 3, f"Expected at least 3 topics, found {len(chat_titles)}"

            # 3. Check Stealth Tooltip
            tooltips = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const items = Array.from(host.shadowRoot.querySelectorAll('.stealth-tooltip'));
                    return items.map(i => i.textContent.trim());
                }
            """)
            print(f"✓ Stealth Tooltips: {tooltips}")
            assert any("alex_engineer" in t for t in tooltips), "Expected tooltip with alex_engineer"

            # 4. Test Outgoing Message Dispatch & Capture Thinking Animation
            print("[*] Testing outgoing message dispatch through AI disguise...")
            await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const input = host.shadowRoot.getElementById('aether-prompt-input');
                    input.value = 'Hey Alex! Testing bi-directional stealth message bridge.';
                    // Dispatch Enter to trigger thinking state
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
                }
            """)
            await asyncio.sleep(0.15)

            # Capture Gemini in the active thinking state (3-dot orbital constellation + stop square)
            thinking_screenshot = os.path.join(EXTENSION_DIR, "test", "gemini_thinking_screenshot.png")
            await page.screenshot(path=thinking_screenshot, full_page=True)
            print(f"✓ Thinking state screenshot captured: {thinking_screenshot}")

            # Check that mock native Instagram container received it
            last_ig_outgoing = await page.evaluate("""
                () => {
                    const rows = document.querySelectorAll('#ig-message-container .ig-message-row.outgoing .ig-msg-bubble');
                    if (rows.length === 0) return null;
                    return rows[rows.length - 1].textContent.trim();
                }
            """)
            print(f"✓ Native Instagram received bridged message: '{last_ig_outgoing}'")
            assert last_ig_outgoing and "Testing bi-directional stealth message bridge" in last_ig_outgoing

            # 5. Test Incoming Friend Message Bridge
            print("[*] Testing incoming friend reply simulation...")
            await page.evaluate("() => document.getElementById('sim-reply-text').click()")
            await asyncio.sleep(0.5)

            assistant_turn = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const el = host.shadowRoot.querySelector('.message-turn.assistant:last-child .response-content');
                    return el ? el.textContent.trim() : null;
                }
            """)
            print(f"✓ AI Chat Stream rendered friend reply as AI response: '{assistant_turn}'")
            assert assistant_turn is not None, "Friend reply did not render in AI chat stream!"

            # 5b. Real Instagram StyleX / Unclassed Message Detection Test (e.g. ChessMancer's 'Bashi')
            print("[*] Testing real Instagram Direct StyleX-formatted reply ('Bashi') without testbench mock classes...")
            # Send 'choi'
            await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const input = host.shadowRoot.getElementById('aether-prompt-input');
                    input.value = 'choi';
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
                }
            """)
            await asyncio.sleep(0.2)

            # Check that thinking animation is active and 'choi' is NOT duplicated
            is_thinking_and_counts = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const thinking = host.shadowRoot.getElementById('gemini-thinking-indicator');
                    const userTurns = Array.from(host.shadowRoot.querySelectorAll('.message-turn.user .prompt-bubble'))
                        .map(el => el.textContent.trim());
                    const choiOccurrences = userTurns.filter(t => t === 'choi').length;
                    return {
                        isThinkingActive: !!thinking,
                        choiOccurrences: choiOccurrences
                    };
                }
            """)
            print(f"✓ Active thinking and prompt turn verification: {is_thinking_and_counts}")
            assert is_thinking_and_counts["isThinkingActive"], "Thinking indicator should be visible after sending 'choi'!"
            assert is_thinking_and_counts["choiOccurrences"] == 1, f"Expected exactly 1 'choi' bubble, found {is_thinking_and_counts['choiOccurrences']}!"

            # Inject realistic real Instagram Direct message ('Bashi')
            await page.evaluate("""
                () => {
                    const container = document.getElementById('ig-message-container');
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:flex-start; margin:8px 0; width:100%;';
                    // Note: Zero testbench classes (.incoming, .ig-msg-bubble, data-sender are intentionally absent!)
                    row.innerHTML = `
                        <div style="width:28px;height:28px;border-radius:50%;background:#666;margin-right:8px;"></div>
                        <div style="background:rgb(38,38,38); border-radius:18px; padding:8px 14px; max-width:60%;">
                            <span dir="auto">Bashi</span>
                        </div>
                    `;
                    container.appendChild(row);
                }
            """)
            await asyncio.sleep(0.6)

            # Check that thinking indicator has disappeared and 'Bashi' was streamed into Gemini response
            real_reply_result = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const thinking = host.shadowRoot.getElementById('gemini-thinking-indicator');
                    const lastAssistant = host.shadowRoot.querySelector('.message-turn.assistant:last-child .response-content');
                    return {
                        thinkingCleared: !thinking,
                        replyText: lastAssistant ? lastAssistant.textContent.trim() : null
                    };
                }
            """)
            print(f"✓ Real Instagram reply detection result: {real_reply_result}")
            assert real_reply_result["thinkingCleared"], "Thinking indicator should clear when friend replies!"
            assert real_reply_result["replyText"] == "Bashi", f"Expected 'Bashi', got '{real_reply_result['replyText']}'!"

            # Capture screenshot of real reply in Gemini theme
            real_reply_screenshot = os.path.join(EXTENSION_DIR, "test", "real_reply_screenshot.png")
            await page.screenshot(path=real_reply_screenshot, full_page=True)
            print(f"✓ Real reply screenshot captured: {real_reply_screenshot}")

            # 6. Test Panic Hotkey (Alt+Z) & Instagram Native Clickability When Off
            print("[*] Testing Alt+Z Panic Toggle...")
            await page.keyboard.press("Alt+z")
            await asyncio.sleep(0.3)

            is_panic = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const comp = window.getComputedStyle(host);
                    const app = host.shadowRoot.getElementById('aether-app');
                    return {
                        hostDisplay: comp.display,
                        hostPointerEvents: comp.pointerEvents,
                        appPanic: app.classList.contains('panic-hidden')
                    };
                }
            """)
            print(f"✓ Camouflage off metrics: {is_panic}")
            assert is_panic["hostDisplay"] == "none", f"Expected display: none on host, got {is_panic['hostDisplay']}"
            assert is_panic["appPanic"] is True, "Expected app to have panic-hidden class"

            # CRITICAL VERIFICATION: Test that native Instagram buttons are 100% clickable with real pointer clicks when off!
            print("[*] Verifying native Instagram buttons receive real pointer clicks when camouflage is off...")
            await page.click(".ig-thread-item[data-username='sarah_ux']")
            await asyncio.sleep(0.3)

            active_friend = await page.evaluate("() => document.getElementById('header-username').textContent.trim()")
            print(f"✓ Native Instagram button clicked successfully! Active conversation switched to: '{active_friend}'")
            assert active_friend == "sarah_ux", f"Expected sarah_ux, got {active_friend}"

            # Toggle back on with Alt+Z
            await page.keyboard.press("Alt+z")
            await asyncio.sleep(0.3)
            is_restored = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const comp = window.getComputedStyle(host);
                    const app = host.shadowRoot.getElementById('aether-app');
                    return comp.display !== 'none' && !app.classList.contains('panic-hidden');
                }
            """)
            print(f"✓ Camouflage restored with Alt+Z: {is_restored}")
            assert is_restored, "Alt+Z did not restore the AI overlay!"

            # 7. Test Theme Switcher to ChatGPT and Claude
            print("[*] Testing Theme Switcher...")
            theme_1 = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    host.shadowRoot.getElementById('model-selector-pill').click();
                    return host.shadowRoot.getElementById('aether-app').getAttribute('data-theme');
                }
            """)
            print(f"✓ Switched theme to: '{theme_1}'")
            assert theme_1 == "chatgpt"
            await asyncio.sleep(0.3)
            gpt_screenshot = os.path.join(EXTENSION_DIR, "test", "chatgpt_screenshot.png")
            await page.screenshot(path=gpt_screenshot, full_page=True)

            theme_2 = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    host.shadowRoot.getElementById('model-selector-pill').click();
                    return host.shadowRoot.getElementById('aether-app').getAttribute('data-theme');
                }
            """)
            print(f"✓ Switched theme to: '{theme_2}'")
            assert theme_2 == "claude"
            await asyncio.sleep(0.3)
            claude_screenshot = os.path.join(EXTENSION_DIR, "test", "claude_screenshot.png")
            await page.screenshot(path=claude_screenshot, full_page=True)

            # Switch back to Gemini and take visual verification screenshot
            await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    host.shadowRoot.getElementById('model-selector-pill').click();
                }
            """)
            await asyncio.sleep(0.4)

            screenshot_path = os.path.join(EXTENSION_DIR, "test", "gemini_screenshot.png")
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"✓ Visual verification screenshot captured: {screenshot_path}")

            # 8. Test 'n' Key Focus Protection & Idle Shortcut
            print("[*] Testing 'n' key typing containment and focus retention...")
            # Focus prompt input
            await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const input = host.shadowRoot.getElementById('aether-prompt-input');
                    input.focus();
                }
            """)
            await asyncio.sleep(0.1)

            # Type a word with 'n' characters like "nice connection"
            await page.keyboard.type("nice connection")
            await asyncio.sleep(0.1)

            focus_check = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    const activeInsideShadow = host.shadowRoot.activeElement ? host.shadowRoot.activeElement.id : null;
                    const inputVal = host.shadowRoot.getElementById('aether-prompt-input').value;
                    return {
                        activeId: activeInsideShadow,
                        value: inputVal
                    };
                }
            """)
            print(f"✓ Typing 'n' containment check: {focus_check}")
            assert focus_check["activeId"] == "aether-prompt-input", "Chat focus should NEVER be lifted when typing 'n'!"
            assert "nice connection" in focus_check["value"], f"Expected 'nice connection', got '{focus_check['value']}'"

            # Test lifting focus intentionally with Escape
            print("[*] Testing lifting focus with Escape key...")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.1)

            unfocus_check = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    return host.shadowRoot.activeElement ? host.shadowRoot.activeElement.id : null;
                }
            """)
            print(f"✓ Lift focus with Escape: activeElement = {unfocus_check}")
            assert unfocus_check is None, f"Expected null (focus lifted), got {unfocus_check}"

            # Test pressing 'n' when idle (focuses the prompt input)
            print("[*] Testing idle 'n' key shortcut (should focus chat input)...")
            await page.keyboard.press("n")
            await asyncio.sleep(0.1)

            idle_focus_check = await page.evaluate("""
                () => {
                    const host = document.getElementById('insta-ai-camouflage-root');
                    return host.shadowRoot.activeElement ? host.shadowRoot.activeElement.id : null;
                }
            """)
            print(f"✓ Idle 'n' key focused input: activeElement = {idle_focus_check}")
            assert idle_focus_check == "aether-prompt-input", f"Expected aether-prompt-input, got {idle_focus_check}"

            print("\n=======================================================")
            print("🚀 ALL END-TO-END AUTOMATED VERIFICATION TESTS PASSED!")
            print("=======================================================\n")

        finally:
            await context.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
