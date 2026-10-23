// AetherChat - Bi-Directional Instagram Direct DOM Bridge (Spatial Geometry & Active Tracking Engine)

class InstagramBridge {
  constructor(options = {}) {
    this.obfuscator = options.obfuscator || new ContactObfuscator();
    this.onIncomingMessage = options.onIncomingMessage || (() => {});
    this.onThreadsUpdated = options.onThreadsUpdated || (() => {});
    this.onExistingMessages = options.onExistingMessages || (() => {});
    this.onThreadSwitched = options.onThreadSwitched || (() => {});

    this.activeThreadId = null;
    this.activeFriendUsername = "Friend";
    this.messageObserver = null;
    this.threadsObserver = null;

    // Node-based tracking (avoids the bug where duplicate strings like "Bashi" are permanently ignored)
    this.processedElements = new WeakSet();
    this.sentByMeHistory = new Map(); // text -> timestamp
    this.hasScannedInitialMessages = false;

    this.isThinking = false;
    this.fastThinkingPollInterval = null;
    this.idlePollInterval = null;
  }

  init() {
    this.extractActiveThreadFromUrl();
    this.bindDomObservers();
    this.scanThreads();
    this.checkChatForUpdates();

    // Active idle polling loop: runs every 600ms to catch incoming messages in real-time
    this.idlePollInterval = setInterval(() => {
      const prevThreadId = this.activeThreadId;
      this.extractActiveThreadFromUrl();

      // If user switched threads on Instagram
      if (this.activeThreadId && this.activeThreadId !== prevThreadId) {
        this.processedElements = new WeakSet();
        this.hasScannedInitialMessages = false;
        this.onThreadSwitched(this.activeThreadId);
      }

      this.scanThreads();
      this.checkChatForUpdates();
    }, 600);

    // Listen to history navigation
    window.addEventListener("popstate", () => {
      this.extractActiveThreadFromUrl();
      this.processedElements = new WeakSet();
      this.hasScannedInitialMessages = false;
      setTimeout(() => this.checkChatForUpdates(), 250);
    });

    console.log("[AetherChat Bridge] Initialized Instagram Spatial Geometry & Active Tracking Engine");
  }

  // 1. Extract active thread ID and active username directly from current URL & DOM
  extractActiveThreadFromUrl() {
    const urlMatch = window.location.pathname.match(/\/direct\/t\/([^/]+)/);
    if (urlMatch && urlMatch[1]) {
      this.activeThreadId = urlMatch[1];
    }

    const headerCandidates = [
      document.querySelector('main header h2'),
      document.querySelector('main header span'),
      document.querySelector('div[role="main"] header span'),
      document.querySelector('div[role="main"] header h2'),
      document.querySelector('div[role="main"] header a'),
      document.querySelector('#header-username'),
      document.querySelector('header span')
    ];

    for (const el of headerCandidates) {
      if (el && el.textContent) {
        const txt = el.textContent.trim();
        if (txt && !txt.toLowerCase().includes("active") && !txt.includes("•") && txt.length < 35) {
          this.activeFriendUsername = txt;
          break;
        }
      }
    }
  }

  // 2. Locate Native Elements
  getNativeInput() {
    return (
      document.querySelector('div[role="textbox"][contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"][aria-label*="Message"]') ||
      document.querySelector('div[contenteditable="true"]') ||
      document.querySelector('textarea[placeholder*="Message"]') ||
      document.querySelector('#ig-native-input')
    );
  }

  getNativeSendButton() {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    return (
      buttons.find((b) => b.textContent && b.textContent.trim().toLowerCase() === "send") ||
      document.querySelector('button[type="submit"]') ||
      document.querySelector('#ig-native-send-btn')
    );
  }

  // 3. Compute Exact Spatial Bounds of the Active Chat Column
  // Anchoring to the native composer gives millimeter-accurate bounds, completely isolating
  // the chat message stream from the left inbox sidebar, headers, and footer controls.
  getSpatialBounds() {
    const input = this.getNativeInput();
    if (input) {
      const inputRect = input.getBoundingClientRect();
      if (inputRect.width > 100) {
        return {
          chatLeft: inputRect.left - 25,
          chatRight: inputRect.right + 25,
          chatTop: 55, // below Instagram top header
          chatBottom: inputRect.top + 15, // above composer input
          chatCenter: inputRect.left + inputRect.width / 2
        };
      }
    }

    // Fallback: If composer is not yet visible
    return {
      chatLeft: window.innerWidth * 0.28,
      chatRight: window.innerWidth,
      chatTop: 55,
      chatBottom: window.innerHeight - 70,
      chatCenter: window.innerWidth * 0.64
    };
  }

  // 4. System UI Noise Filter
  isSystemNoise(text) {
    if (!text || typeof text !== "string") return true;
    const clean = text.trim();
    if (!clean || clean.length > 1000) return true;

    if (/^[•·\s]+$/.test(clean)) return true;

    // Timestamps like "1:21 PM", "12:00 AM", "1m", "2h"
    if (/^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(clean)) return true;
    if (/^\d+[mhdwy]$/i.test(clean)) return true;

    const noiseExact = [
      "Seen just now",
      "Seen",
      "Active now",
      "View profile",
      "Message...",
      "Requests",
      "Messages",
      "Search",
      "Weekend plans?",
      "Your note",
      "Send",
      "Like",
      "Reply"
    ];
    if (noiseExact.some((n) => clean.toLowerCase() === n.toLowerCase())) {
      return true;
    }

    if (clean.includes("· Instagram") || clean.includes("Active ") || clean.startsWith("Seen ")) {
      return true;
    }

    return false;
  }

  // 5. Detect Background Color Signals (Instagram Blue/Purple = Outgoing)
  isColorOutgoing(node) {
    try {
      const checkEl = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor || "";
        return (
          bg.includes("55, 151, 240") ||
          bg.includes("0, 149, 246") ||
          bg.includes("59, 130, 246") ||
          bg.includes("56, 189, 248") ||
          bg.includes("147, 51, 234")
        );
      };

      if (checkEl(node)) return true;
      if (checkEl(node.parentElement)) return true;
      if (checkEl(node.closest('div[style*="border-radius"]'))) return true;
    } catch (e) {}
    return false;
  }

  // 6. Find All Chat Message Leaf Elements Strictly Inside Chat Bounds
  findChatMessageElements() {
    const bounds = this.getSpatialBounds();
    const selectors = [
      '.ig-msg-bubble',
      'span[dir="auto"]',
      'div[dir="auto"]',
      'div[role="row"]',
      'div[style*="border-radius"]'
    ];

    const found = [];
    const seenNodes = new Set();

    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      for (const node of nodes) {
        if (seenNodes.has(node)) continue;

        // Strictly exclude extension elements, sidebar, navigation, and header
        if (
          node.closest('#insta-ai-camouflage-root') ||
          node.closest('#aether-app') ||
          node.closest('header') ||
          node.closest('aside') ||
          node.closest('nav') ||
          node.closest('.ig-inbox-sidebar') ||
          node.closest('.ig-thread-list') ||
          node.closest('div[role="list"]')
        ) {
          continue;
        }

        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        // Apply Spatial Filter
        if (rect.right < bounds.chatLeft || rect.left > bounds.chatRight) continue;
        if (rect.bottom < bounds.chatTop || rect.top > bounds.chatBottom) continue;

        const txt = (node.innerText || node.textContent || "").trim();
        if (!txt || this.isSystemNoise(txt)) continue;

        seenNodes.add(node);
        found.push({ node, rect, text: txt });
      }
    }

    // Filter to innermost leaf elements (removes parent wrappers with duplicate text)
    const leaves = [];
    for (const item of found) {
      const isParentOfAnother = found.some(
        (other) => other !== item && item.node.contains(other.node) && other.text === item.text
      );
      if (!isParentOfAnother && !leaves.some((l) => l.node === item.node)) {
        leaves.push(item);
      }
    }

    // Sort top-to-bottom by vertical position
    leaves.sort((a, b) => a.rect.top - b.rect.top);
    return leaves;
  }

  // 7. Check Active Chat for Existing History & Real-Time New Incoming Messages
  checkChatForUpdates() {
    const leaves = this.findChatMessageElements();
    if (leaves.length === 0) return;

    const bounds = this.getSpatialBounds();

    // Phase A: Initial History Scan on Thread Open / Page Load
    if (!this.hasScannedInitialMessages) {
      const history = [];
      for (const item of leaves) {
        const xCenter = item.rect.left + item.rect.width / 2;
        const isOutgoing =
          xCenter > bounds.chatCenter + 20 ||
          this.isColorOutgoing(item.node) ||
          item.node.classList.contains("outgoing") ||
          item.node.getAttribute("data-sender") === "me" ||
          this.sentByMeHistory.has(item.text);

        const role = isOutgoing ? "user" : "assistant";
        item.node.__aether_processed__ = true;
        this.processedElements.add(item.node);
        history.push({ role, text: item.text });
      }

      if (history.length > 0) {
        this.hasScannedInitialMessages = true;
        this.onExistingMessages(history);
      }
      return;
    }

    // Phase B: Real-Time Incoming & Outgoing Message Detection
    // Check from newest (bottom) upwards
    for (let i = leaves.length - 1; i >= 0; i--) {
      const item = leaves[i];

      // If already processed and text hasn't changed, skip
      if (item.node.__aether_processed__ || this.processedElements.has(item.node)) {
        continue;
      }

      // Mark this element as processed
      item.node.__aether_processed__ = true;
      this.processedElements.add(item.node);

      const xCenter = item.rect.left + item.rect.width / 2;
      const isOutgoing =
        xCenter > bounds.chatCenter + 20 ||
        this.isColorOutgoing(item.node) ||
        item.node.classList.contains("outgoing") ||
        item.node.getAttribute("data-sender") === "me" ||
        this.sentByMeHistory.has(item.text);

      if (isOutgoing) {
        console.log("[AetherChat Bridge] Outgoing message rendered in DOM:", item.text);
      } else {
        // 🎉 NEW INCOMING FRIEND REPLY!
        console.log("[AetherChat Bridge] Detected incoming reply from friend:", item.text);
        this.stopThinkingPolling();
        this.onIncomingMessage({
          text: item.text,
          sender: this.activeFriendUsername,
          rawNode: item.node
        });
      }
    }
  }

  // 8. High-Speed 200ms Active Polling during Thinking State
  startThinkingPolling() {
    this.stopThinkingPolling();
    this.isThinking = true;
    let pollCount = 0;
    const maxPolls = 300; // up to 60 seconds at 200ms intervals

    this.fastThinkingPollInterval = setInterval(() => {
      pollCount++;
      if (pollCount > maxPolls || !this.isThinking) {
        this.stopThinkingPolling();
        return;
      }

      this.checkChatForUpdates();
    }, 200);
  }

  stopThinkingPolling() {
    this.isThinking = false;
    if (this.fastThinkingPollInterval) {
      clearInterval(this.fastThinkingPollInterval);
      this.fastThinkingPollInterval = null;
    }
  }

  // 9. Scan Sidebar Threads
  getThreadLinks() {
    const selectors = [
      'a[href*="/direct/t/"]',
      '.ig-thread-item',
      'div[role="list"] a',
      'div[role="navigation"] a[href*="/direct/"]',
      'div[role="list"] div[role="listitem"]'
    ];

    const found = new Set();
    const result = [];

    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => {
        if (!found.has(el)) {
          found.add(el);
          result.push(el);
        }
      });
    }

    return result;
  }

  scanThreads() {
    const links = this.getThreadLinks();
    const threads = [];
    const seenIds = new Set();

    links.forEach((link) => {
      let threadId = link.getAttribute("data-thread-id");
      if (!threadId) {
        const href = link.getAttribute("href") || link.href || "";
        const match = href.match(/\/direct\/t\/([^/]+)/);
        threadId = match ? match[1] : null;
      }

      let username = link.getAttribute("data-username");
      if (!username) {
        const textNodes = (link.innerText || "").split("\n").map((s) => s.trim()).filter(Boolean);
        for (const t of textNodes) {
          if (!t.match(/^[0-9]+[mhdwy]/) && !t.includes("•") && t !== "Active now") {
            username = t;
            break;
          }
        }
      }

      if (!threadId && username) {
        threadId = "thread_" + username.toLowerCase().replace(/[^a-z0-9_]/g, "");
      }

      if (threadId && !seenIds.has(threadId)) {
        seenIds.add(threadId);

        const isActive =
          (this.activeThreadId && threadId === this.activeThreadId) ||
          link.classList.contains("active") ||
          link.getAttribute("aria-selected") === "true";

        if (isActive && username) {
          this.activeFriendUsername = username;
        }

        const maskedTitle = this.obfuscator.getMaskedTitle(threadId, username || "Friend");

        threads.push({
          threadId,
          username: username || "Friend",
          maskedTitle,
          isActive,
          element: link
        });
      }
    });

    if (this.activeThreadId && !seenIds.has(this.activeThreadId)) {
      const fallbackUsername = this.activeFriendUsername || "Friend";
      const maskedTitle = this.obfuscator.getMaskedTitle(this.activeThreadId, fallbackUsername);
      threads.unshift({
        threadId: this.activeThreadId,
        username: fallbackUsername,
        maskedTitle,
        isActive: true,
        element: null
      });
    }

    this.onThreadsUpdated(threads);
    return threads;
  }

  // 10. Switch Thread
  selectThread(threadId) {
    this.activeThreadId = threadId;
    const links = this.getThreadLinks();

    for (const link of links) {
      const href = link.href || link.getAttribute("href") || "";
      const match = href.includes(threadId) || link.getAttribute("data-thread-id") === threadId;
      if (match) {
        try {
          link.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
          link.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
        } catch (e) {}
        link.click();
        try {
          link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        } catch (e) {}

        this.processedElements = new WeakSet();
        this.hasScannedInitialMessages = false;
        setTimeout(() => {
          this.scanThreads();
          this.checkChatForUpdates();
        }, 400);
        return true;
      }
    }

    if (threadId.startsWith("17") || threadId.length > 8) {
      if (window.location.pathname !== `/direct/t/${threadId}/`) {
        window.history.pushState({}, "", `/direct/t/${threadId}/`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }

    return true;
  }

  // 11. Send Message via Native Instagram Composer
  sendOutgoingMessage(text) {
    if (!text || !text.trim()) return false;
    const cleanText = text.trim();

    // Register text in sentByMeHistory with timestamp so it's never treated as an incoming reply
    this.sentByMeHistory.set(cleanText, Date.now());

    const input = this.getNativeInput();
    if (!input) {
      console.error("[AetherChat Bridge] Could not find Instagram message composer!");
      return false;
    }

    input.focus();

    // Strategy A: document.execCommand ('insertText')
    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, cleanText);
    } catch (e) {
      inserted = false;
    }

    // Strategy B: Direct innerText + InputEvent dispatch
    if (!inserted) {
      input.innerText = cleanText;
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: cleanText
        })
      );
    }

    // Dispatch Enter key to submit
    const enterDown = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13
    });
    input.dispatchEvent(enterDown);

    // Fallback: Click the Send button
    setTimeout(() => {
      const sendBtn = this.getNativeSendButton();
      if (sendBtn) {
        sendBtn.click();
      }
    }, 60);

    return true;
  }

  // 12. DOM MutationObserver
  bindDomObservers() {
    if (this.messageObserver) {
      this.messageObserver.disconnect();
    }

    this.messageObserver = new MutationObserver(() => {
      this.checkChatForUpdates();
    });

    const targetContainer = document.querySelector('main') || document.body;
    this.messageObserver.observe(targetContainer, { childList: true, subtree: true, characterData: true });

    const threadListContainer = document.querySelector('.ig-thread-list') || document.querySelector('div[role="list"]');
    if (threadListContainer) {
      this.threadsObserver = new MutationObserver(() => this.scanThreads());
      this.threadsObserver.observe(threadListContainer, { childList: true, subtree: true });
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { InstagramBridge };
} else {
  window.InstagramBridge = InstagramBridge;
}
