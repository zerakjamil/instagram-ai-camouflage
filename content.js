// AetherChat - Content Script Entrypoint

(async function () {
  console.log("[AetherChat] Injecting stealth AI camouflage layer...");

  // Prevent multiple injections
  if (window.__AETHER_INITIALIZED__) return;
  window.__AETHER_INITIALIZED__ = true;

  // Wait for DOM
  if (document.readyState === "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve));
  }

  // 1. Initialize Obfuscator
  const obfuscator = new ContactObfuscator();
  await obfuscator.init();

  // 2. Initialize Hotkeys
  let overlayInstance = null;
  const hotkeys = new HotkeyManager((source) => {
    if (overlayInstance) {
      overlayInstance.toggleVisibility();
    }
  });
  hotkeys.init();

  // 3. Initialize Instagram Bridge
  const bridge = new InstagramBridge({
    obfuscator,
    onIncomingMessage: (msg) => {
      console.log("[AetherChat] Incoming friend message received:", msg);
      if (overlayInstance) {
        overlayInstance.addMessageTurn("assistant", msg.text);
      }
    },
    onThreadsUpdated: (threads) => {
      if (overlayInstance) {
        overlayInstance.renderThreadsList(threads);
      }
    },
    onExistingMessages: (history) => {
      console.log("[AetherChat] Loaded existing conversation history:", history.length);
      if (overlayInstance) {
        overlayInstance.renderExistingMessages(history);
      }
    },
    onThreadSwitched: (threadId) => {
      console.log("[AetherChat] Thread switched to:", threadId);
      if (overlayInstance) {
        overlayInstance.clearChatStream();
      }
    }
  });

  // 4. Initialize Overlay
  overlayInstance = new AetherOverlay({
    bridge,
    hotkeys
  });
  await overlayInstance.init();

  // 5. Connect Bridge
  bridge.init();

  // 6. Listen for Chrome Storage Changes directly (instant cross-tab sync)
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (changes.theme && overlayInstance) {
        overlayInstance.setTheme(changes.theme.newValue);
      }
      if (changes.enabled !== undefined && overlayInstance) {
        overlayInstance.toggleVisibility(changes.enabled.newValue);
      }
    });
  }

  // 7. Listen for Chrome Runtime Messages (e.g. from Extension Popup fallback)
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "AETHER_CONFIG_UPDATED") {
        if (request.changes.theme && overlayInstance) {
          overlayInstance.setTheme(request.changes.theme.newValue);
        }
        if (request.changes.enabled !== undefined && overlayInstance) {
          overlayInstance.toggleVisibility(request.changes.enabled.newValue);
        }
      }
      sendResponse({ status: "ok" });
    });
  }

  // 8. Idle shortcut: Pressing 'n' or 'N' when not typing brings focus directly to the chat prompt
  window.addEventListener("keydown", (e) => {
    if (!overlayInstance || !overlayInstance.isVisible) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key !== "n" && e.key !== "N") return;

    // Check if user is already focused on an input or within Shadow DOM
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
    if (overlayInstance.shadowRoot && overlayInstance.shadowRoot.activeElement) return;

    // Focus the chat prompt
    e.preventDefault();
    const promptInput = overlayInstance.shadowRoot ? overlayInstance.shadowRoot.getElementById("aether-prompt-input") : null;
    if (promptInput) {
      promptInput.focus();
    }
  });

  console.log("[AetherChat] Stealth AI Camouflage fully initialized & active!");
})();
