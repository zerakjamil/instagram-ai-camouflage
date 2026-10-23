// Automated Verification Script for AetherChat Chrome Extension
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const EXTENSION_PATH = path.resolve(__dirname, '..');
const PORT = 8991;

// 1. Simple HTTP server to serve the mock Instagram environment
function startMockServer() {
  const server = http.createServer((req, res) => {
    let filePath = path.join(EXTENSION_PATH, req.url.split('?')[0]);
    if (req.url === '/' || req.url === '/test' || req.url === '/test/') {
      filePath = path.join(EXTENSION_PATH, 'test', 'instagram_mock.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + req.url);
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'instagram_mock.html');
    }

    const ext = path.extname(filePath);
    const contentTypeMap = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[Mock Server] Running on http://127.0.0.1:${PORT}/test/instagram_mock.html`);
      resolve(server);
    });
  });
}

async function runTests() {
  const server = await startMockServer();

  console.log('[Test] Launching Chromium with extension loaded from:', EXTENSION_PATH);
  const browserContext = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  try {
    const page = await browserContext.newPage();
    console.log('[Test] Navigating to Mock Instagram...');
    await page.goto(`http://127.0.0.1:${PORT}/test/instagram_mock.html`, { waitUntil: 'networkidle' });

    // Wait for the extension Shadow DOM to mount
    console.log('[Test] Checking for #insta-ai-camouflage-root...');
    await page.waitForSelector('#insta-ai-camouflage-root', { timeout: 8000 });
    console.log('✓ Found #insta-ai-camouflage-root in DOM');

    // Verify Shadow DOM content
    const shadowHost = await page.$('#insta-ai-camouflage-root');
    const shadowRoot = await shadowHost.evaluateHandle(el => el.shadowRoot);

    const brandName = await shadowRoot.evaluate(sr => {
      const el = sr.querySelector('.brand-name');
      return el ? el.textContent.trim() : null;
    });
    console.log('✓ Gemini Brand Name detected in Shadow DOM:', brandName);
    if (brandName !== 'Gemini') throw new Error(`Expected Gemini, got ${brandName}`);

    // Verify Obfuscated Chat Sidebar
    const chatTitles = await shadowRoot.evaluate(sr => {
      const items = Array.from(sr.querySelectorAll('.chat-session-title'));
      return items.map(i => i.textContent.trim());
    });
    console.log('✓ Obfuscated Chat Topics in Sidebar:', chatTitles);
    if (chatTitles.length === 0) throw new Error('No obfuscated chat topics found');

    // Verify Stealth Tooltip
    const tooltips = await shadowRoot.evaluate(sr => {
      const items = Array.from(sr.querySelectorAll('.stealth-tooltip'));
      return items.map(i => i.textContent.trim());
    });
    console.log('✓ Stealth Friend Tooltips:', tooltips);
    if (!tooltips.some(t => t.includes('alex_engineer'))) {
      throw new Error('Expected tooltip for alex_engineer not found');
    }

    // Test Outgoing Message Dispatch
    console.log('[Test] Typing into AI Prompt Bar and submitting...');
    const inputHandle = await shadowRoot.evaluateHandle(sr => sr.querySelector('#aether-prompt-input'));
    await inputHandle.fill('Hey Alex, test outgoing message through AI disguise');
    await inputHandle.press('Enter');

    await page.waitForTimeout(500);

    // Verify message sent into native mock Instagram container
    const lastMockOutgoing = await page.$eval(
      '#ig-message-container .ig-message-row.outgoing:last-child .ig-msg-bubble',
      el => el.textContent.trim()
    );
    console.log('✓ Native Instagram received bridged message:', lastMockOutgoing);
    if (!lastMockOutgoing.includes('test outgoing message')) {
      throw new Error(`Message was not received by native Instagram! Got: ${lastMockOutgoing}`);
    }

    // Verify message displayed as user prompt turn in AI interface
    const userPromptTurn = await shadowRoot.evaluate(sr => {
      const el = sr.querySelector('.message-turn.user:last-child .prompt-bubble');
      return el ? el.textContent.trim() : null;
    });
    console.log('✓ AI Chat Stream rendered user prompt:', userPromptTurn);

    // Test Incoming Friend Message Bridge
    console.log('[Test] Simulating incoming friend message via mock control...');
    await page.click('#sim-reply-text');
    await page.waitForTimeout(600);

    const assistantTurn = await shadowRoot.evaluate(sr => {
      const el = sr.querySelector('.message-turn.assistant:last-child .response-content');
      return el ? el.textContent.trim() : null;
    });
    console.log('✓ AI Chat Stream formatted incoming friend reply as AI response:', assistantTurn);
    if (!assistantTurn) throw new Error('Incoming friend reply did not bridge into AI response!');

    // Test Panic Hotkey (Alt+Z)
    console.log('[Test] Triggering Alt+Z Panic Hotkey...');
    await page.keyboard.press('Alt+z');
    await page.waitForTimeout(300);

    const isPanicHidden = await shadowRoot.evaluate(sr => {
      const app = sr.querySelector('#aether-app');
      return app.classList.contains('panic-hidden');
    });
    console.log('✓ Camouflage is panic-hidden:', isPanicHidden);
    if (!isPanicHidden) throw new Error('Alt+Z did not trigger panic-hidden class!');

    // Toggle back with Alt+Z
    await page.keyboard.press('Alt+z');
    await page.waitForTimeout(300);
    const isRestored = await shadowRoot.evaluate(sr => {
      return !sr.querySelector('#aether-app').classList.contains('panic-hidden');
    });
    console.log('✓ Camouflage restored with Alt+Z:', isRestored);

    // Test Theme Switcher (Switch to ChatGPT then Claude)
    console.log('[Test] Testing Theme Switcher...');
    await shadowRoot.evaluate(sr => {
      const pill = sr.querySelector('#model-selector-pill');
      pill.click(); // switches to chatgpt
    });
    await page.waitForTimeout(200);

    let currentTheme = await shadowRoot.evaluate(sr => sr.querySelector('#aether-app').getAttribute('data-theme'));
    console.log('✓ Switched theme to:', currentTheme);
    if (currentTheme !== 'chatgpt') throw new Error(`Expected chatgpt, got ${currentTheme}`);

    await shadowRoot.evaluate(sr => {
      const pill = sr.querySelector('#model-selector-pill');
      pill.click(); // switches to claude
    });
    await page.waitForTimeout(200);

    currentTheme = await shadowRoot.evaluate(sr => sr.querySelector('#aether-app').getAttribute('data-theme'));
    console.log('✓ Switched theme to:', currentTheme);
    if (currentTheme !== 'claude') throw new Error(`Expected claude, got ${currentTheme}`);

    // Take screenshot of Gemini camouflage for visual verification!
    await shadowRoot.evaluate(sr => {
      const pill = sr.querySelector('#model-selector-pill');
      pill.click(); // back to gemini
    });
    await page.waitForTimeout(300);

    const screenshotPath = path.resolve(EXTENSION_PATH, 'test', 'verification_screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('✓ Saved visual proof screenshot to:', screenshotPath);

    console.log('\n=========================================');
    console.log('🎉 ALL AUTOMATED VERIFICATION TESTS PASSED!');
    console.log('=========================================\n');

  } finally {
    await browserContext.close();
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
