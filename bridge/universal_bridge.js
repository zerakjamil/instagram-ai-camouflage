// AetherChat - Universal Multi-Platform Chat Bridge & Spatial Engine
// Supports: Instagram Direct, WhatsApp Web, Telegram Web, Discord, X/Twitter DMs, Messenger, Slack, & Universal Heuristic Engine

class UniversalChatBridge {
  constructor(options = {}) {
    this.obfuscator = options.obfuscator || new ContactObfuscator();
    this.mediaHandler = options.mediaHandler || new MediaHandler();
    this.onIncomingMessage = options.onIncomingMessage || (() => {});
    this.onThreadsUpdated = options.onThreadsUpdated || (() => {});
    this.onExistingMessages = options.onExistingMessages || (() => {});
    this.onThreadSwitched = options.onThreadSwitched || (() => {});

    this.platform = this.detectPlatform();
    this.activeThreadId = null;
    this.activeFriendUsername = "Friend";
    this.messageObserver = null;
    this.threadsObserver = null;

    // Node-based element tracking
    this.processedElements = new WeakSet();
    this.sentByMeHistory = new Map(); // text -> timestamp
    this.hasScannedInitialMessages = false;

    this.isThinking = false;
    this.fastThinkingPollInterval = null;
    this.idlePollInterval = null;

    console.log(`[AetherChat Bridge] Detected Platform: ${this.platform.toUpperCase()}`);
  }

  // 1. Automatic Platform Detection
  detectPlatform() {
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("whatsapp.com")) return "whatsapp";
    if (host.includes("telegram.org")) return "telegram";
    if (host.includes("discord.com")) return "discord";
    if (host.includes("twitter.com") || host.includes("x.com")) return "twitter";
    if (host.includes("messenger.com") || (host.includes("facebook.com") && path.includes("messages"))) return "messenger";
    if (host.includes("slack.com")) return "slack";
    if (host.includes("reddit.com")) return "reddit";
    return "universal";
  }

  init() {
    this.extractActiveThread();
    this.bindDomObservers();
    this.scanThreads();
    this.checkChatForUpdates();

    // Idle monitoring loop (runs every 600ms)
    this.idlePollInterval = setInterval(() => {
      const prevThreadId = this.activeThreadId;
      this.extractActiveThread();

      if (this.activeThreadId && this.activeThreadId !== prevThreadId) {
        this.processedElements = new WeakSet();
        this.hasScannedInitialMessages = false;
        this.onThreadSwitched(this.activeThreadId);
      }

      this.scanThreads();
      this.checkChatForUpdates();
    }, 600);

    // URL change detection
    window.addEventListener("popstate", () => {
      this.extractActiveThread();
      this.processedElements = new WeakSet();
      this.hasScannedInitialMessages = false;
      setTimeout(() => this.checkChatForUpdates(), 300);
    });

    console.log("[AetherChat Bridge] Universal Multi-Platform Engine Active!");
  }

  // 2. Extract Active Thread ID and Active Contact Name
  extractActiveThread() {
    const url = window.location.href;

    // Platform-specific thread ID parsing
    if (this.platform === "instagram") {
      const match = url.match(/\/direct\/t\/([^/]+)/);
      if (match && match[1]) this.activeThreadId = match[1];
    } else if (this.platform === "discord") {
      const match = url.match(/\/channels\/([^/]+)\/([^/]+)/);
      if (match) this.activeThreadId = `${match[1]}_${match[2]}`;
    } else if (this.platform === "telegram") {
      const match = url.match(/[#?&]tgaddr=([^&]+)/) || url.match(/\/a\/#([^/]+)/) || url.match(/\/k\/#@?([^/]+)/);
      if (match) this.activeThreadId = match[1];
    } else if (this.platform === "twitter") {
      const match = url.match(/\/messages\/([^/?]+)/);
      if (match) this.activeThreadId = match[1];
    }

    // Locate active chat header username across platforms
    const candidates = [
      // Instagram
      document.querySelector('main header h2'),
      document.querySelector('main header span'),
      document.querySelector('div[role="main"] header span'),
      // WhatsApp
      document.querySelector('#main header span[dir="auto"]'),
      document.querySelector('#main header div[role="button"] span'),
      // Telegram
      document.querySelector('.chat-info .peer-title'),
      document.querySelector('.top-chat-info .name'),
      // Discord
      document.querySelector('h1[class*="title-"]'),
      document.querySelector('section[aria-label*="Channel header"] h2'),
      // Twitter / X
      document.querySelector('div[data-testid="conversation-header"] span'),
      // Fallback
      document.querySelector('#header-username'),
      document.querySelector('header span')
    ];

    for (const el of candidates) {
      if (el && el.textContent) {
        const txt = el.textContent.trim();
        if (txt && !txt.toLowerCase().includes("active") && !txt.includes("•") && txt.length < 40) {
          this.activeFriendUsername = txt;
          break;
        }
      }
    }
  }

  // 3. Locate Native Message Composer across Platforms
  getNativeInput() {
    const selectors = [
      // Local Mock Bench
      '#ig-native-input',
      // Instagram Direct
      'div[role="textbox"][contenteditable="true"]',
      'div[contenteditable="true"][aria-label*="Message"]',
      // WhatsApp Web
      'footer div[contenteditable="true"]',
      'footer div[role="textbox"]',
      '#main footer div[contenteditable="true"]',
      // Telegram Web
      '#editable-message-text',
      '.input-message-input[contenteditable="true"]',
      '.composer-text',
      // Discord
      'div[role="textbox"][aria-label*="Message"]',
      'form div[contenteditable="true"]',
      // Twitter / X DMs
      'div[data-testid="dmComposerTextInput"]',
      'aside div[role="textbox"]',
      // Messenger / Slack / Generic
      'div[role="textbox"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Type"]',
      'textarea'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !el.closest('#insta-ai-camouflage-root') && !el.closest('#aether-app')) {
        return el;
      }
    }
    return null;
  }

  getNativeSendButton() {
    const selectors = [
      // Mock bench
      '#ig-native-send-btn',
      // WhatsApp
      'span[data-icon="send"]',
      'button[data-tab="11"]',
      // Telegram
      'button.btn-send',
      'button.send',
      // Twitter
      'div[data-testid="dmComposerSendButton"]',
      // Discord / Instagram buttons
      'button[type="submit"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }

    // Search by text "send"
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    return buttons.find(b => b.textContent && b.textContent.trim().toLowerCase() === "send") || null;
  }

  // 4. Compute Spatial Bounds of Active Chat Column
  getSpatialBounds() {
    const input = this.getNativeInput();
    if (input) {
      const inputRect = input.getBoundingClientRect();
      if (inputRect.width > 80) {
        return {
          chatLeft: inputRect.left - 30,
          chatRight: inputRect.right + 30,
          chatTop: 50,
          chatBottom: inputRect.top + 20,
          chatCenter: inputRect.left + inputRect.width / 2
        };
      }
    }

    return {
      chatLeft: window.innerWidth * 0.28,
      chatRight: window.innerWidth,
      chatTop: 50,
      chatBottom: window.innerHeight - 70,
      chatCenter: window.innerWidth * 0.64
    };
  }

  // 5. System UI Noise Filter
  isSystemNoise(text) {
    if (!text || typeof text !== "string") return true;
    const clean = text.trim();
    if (!clean || clean.length > 1000) return true;
    if (/^[•·\s]+$/.test(clean)) return true;

    // Timestamps
    if (/^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(clean)) return true;
    if (/^\d+[mhdwy]$/i.test(clean)) return true;

    const noiseExact = [
      "Seen just now", "Seen", "Active now", "Online", "View profile",
      "Message...", "Type a message", "Search", "Send", "Like", "Reply",
      "Delivered", "Read", "Today", "Yesterday"
    ];
    if (noiseExact.some(n => clean.toLowerCase() === n.toLowerCase())) return true;
    if (clean.includes("· Instagram") || clean.startsWith("Seen ") || clean.startsWith("Active ")) return true;

    return false;
  }

  // 6. Color & Alignment Direction Classifier
  isColorOutgoing(node) {
    try {
      const checkEl = (el) => {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor || "";
        // Instagram blue/purple, WhatsApp green (#005c4b / #d9fdd3), Telegram blue, Discord blurple (#5865F2)
        return (
          bg.includes("55, 151, 240") ||
          bg.includes("0, 149, 246") ||
          bg.includes("59, 130, 246") ||
          bg.includes("0, 92, 75") ||
          bg.includes("217, 253, 211") ||
          bg.includes("88, 101, 242") ||
          bg.includes("43, 82, 120")
        );
      };

      if (checkEl(node)) return true;
      if (checkEl(node.parentElement)) return true;
      if (checkEl(node.closest('div[style*="border-radius"], div[class*="message"]'))) return true;
    } catch (e) {}
    return false;
  }

  // 7. Find Chat Message Elements & Media
  findChatMessageElements() {
    const bounds = this.getSpatialBounds();
    const selectors = [
      '.ig-msg-bubble',
      'span[dir="auto"]',
      'div[dir="auto"]',
      'div[role="row"]',
      'div[class*="message"]',
      'div[data-testid*="msg"]',
      '.message-content',
      'div[style*="border-radius"]'
    ];

    const found = [];
    const seenNodes = new Set();

    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      for (const node of nodes) {
        if (seenNodes.has(node)) continue;

        // Skip extension root, sidebars, headers, navigation
        if (
          node.closest('#insta-ai-camouflage-root') ||
          node.closest('#aether-app') ||
          node.closest('header') ||
          node.closest('aside') ||
          node.closest('nav') ||
          node.closest('#pane-side') ||
          node.closest('.chat-list') ||
          node.closest('.ig-inbox-sidebar') ||
          node.closest('div[role="list"]')
        ) {
          continue;
        }

        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        // Spatial filter
        if (rect.right < bounds.chatLeft || rect.left > bounds.chatRight) continue;
        if (rect.bottom < bounds.chatTop || rect.top > bounds.chatBottom) continue;

        const txt = (node.innerText || node.textContent || "").trim();
        // Extract media (images or videos) inside node
        const media = this.mediaHandler.extractMediaFromNode(node);

        // Keep node if it has text OR has media attachments
        if ((!txt || this.isSystemNoise(txt)) && media.length === 0) continue;

        seenNodes.add(node);
        found.push({ node, rect, text: txt, media });
      }
    }

    // Leaf filtering
    const leaves = [];
    for (const item of found) {
      const isParentOfAnother = found.some(
        other => other !== item && item.node.contains(other.node) && other.text === item.text && other.media.length === item.media.length
      );
      if (!isParentOfAnother && !leaves.some(l => l.node === item.node)) {
        leaves.push(item);
      }
    }

    leaves.sort((a, b) => a.rect.top - b.rect.top);
    return leaves;
  }

  // 8. Check Active Chat for Existing History & Real-Time Incoming Messages
  checkChatForUpdates() {
    const leaves = this.findChatMessageElements();
    if (leaves.length === 0) return;

    const bounds = this.getSpatialBounds();

    // Initial History Scan
    if (!this.hasScannedInitialMessages) {
      const history = [];
      for (const item of leaves) {
        const xCenter = item.rect.left + item.rect.width / 2;
        const isOutgoing =
          xCenter > bounds.chatCenter + 20 ||
          this.isColorOutgoing(item.node) ||
          item.node.classList.contains("outgoing") ||
          item.node.classList.contains("message-out") ||
          item.node.getAttribute("data-sender") === "me" ||
          this.sentByMeHistory.has(item.text);

        const role = isOutgoing ? "user" : "assistant";
        item.node.__aether_processed__ = true;
        this.processedElements.add(item.node);

        history.push({
          role,
          text: item.text,
          media: item.media
        });
      }

      if (history.length > 0) {
        this.hasScannedInitialMessages = true;
        this.onExistingMessages(history);
      }
      return;
    }

    // Real-Time Incoming & Outgoing Message Detection
    for (let i = leaves.length - 1; i >= 0; i--) {
      const item = leaves[i];
      if (item.node.__aether_processed__ || this.processedElements.has(item.node)) {
        continue;
      }

      item.node.__aether_processed__ = true;
      this.processedElements.add(item.node);

      const xCenter = item.rect.left + item.rect.width / 2;
      const isOutgoing =
        xCenter > bounds.chatCenter + 20 ||
        this.isColorOutgoing(item.node) ||
        item.node.classList.contains("outgoing") ||
        item.node.classList.contains("message-out") ||
        item.node.getAttribute("data-sender") === "me" ||
        this.sentByMeHistory.has(item.text);

      if (isOutgoing) {
        console.log("[AetherChat Bridge] Outgoing message confirmed:", item.text);
      } else {
        console.log("[AetherChat Bridge] 🎉 INCOMING MESSAGE / MEDIA:", item.text, item.media);
        this.stopThinkingPolling();
        this.onIncomingMessage({
          text: item.text,
          media: item.media,
          sender: this.activeFriendUsername,
          rawNode: item.node
        });
      }
    }
  }

  // 9. High-Speed 200ms Active Polling during Thinking State
  startThinkingPolling() {
    this.stopThinkingPolling();
    this.isThinking = true;
    let pollCount = 0;
    const maxPolls = 300;

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

  // 10. Scan Sidebar Conversations across Platforms
  getThreadLinks() {
    const selectors = [
      // Instagram
      'a[href*="/direct/t/"]',
      '.ig-thread-item',
      // WhatsApp
      '#pane-side div[role="listitem"]',
      'div[data-testid="cell-frame-container"]',
      // Telegram
      '.chat-list .ListItem',
      // Discord
      'ul[aria-label*="Direct Messages"] li a',
      'nav[aria-label*="Channels"] a',
      // Twitter
      'div[data-testid="conversation"]',
      // Generic
      'div[role="navigation"] a',
      'div[role="list"] a',
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
      let threadId = link.getAttribute("data-thread-id") || link.getAttribute("data-id");
      if (!threadId) {
        const href = link.getAttribute("href") || link.href || "";
        const match = href.match(/\/direct\/t\/([^/]+)/) || href.match(/\/channels\/([^/]+)/) || href.match(/\/messages\/([^/?]+)/);
        threadId = match ? match[1] : null;
      }

      let username = link.getAttribute("data-username");
      if (!username) {
        const textNodes = (link.innerText || "").split("\n").map(s => s.trim()).filter(Boolean);
        for (const t of textNodes) {
          if (!t.match(/^[0-9]+[mhdwy]/) && !t.includes("•") && t !== "Active now" && t.length < 35) {
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

  // 11. Switch Thread
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

    return true;
  }

  // 12. Send Message (Text and/or Media Attachments) via Native Composer
  async sendOutgoingMessage(text, files = []) {
    const cleanText = (text || "").trim();
    if (!cleanText && (!files || files.length === 0)) return false;

    if (cleanText) {
      this.sentByMeHistory.set(cleanText, Date.now());
    }

    const input = this.getNativeInput();
    if (!input) {
      console.error("[AetherChat Bridge] Could not locate native message composer!");
      return false;
    }

    // A. Dispatch Media Attachments (Images/Videos) if present
    if (files && files.length > 0) {
      await this.mediaHandler.dispatchMediaToNativeComposer(input, files);
    }

    // B. Dispatch Text
    if (cleanText) {
      input.focus();

      let inserted = false;
      try {
        inserted = document.execCommand("insertText", false, cleanText);
      } catch (e) {
        inserted = false;
      }

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

      // Enter key
      const enterDown = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13
      });
      input.dispatchEvent(enterDown);

      setTimeout(() => {
        const sendBtn = this.getNativeSendButton();
        if (sendBtn) {
          sendBtn.click();
        }
      }, 70);
    }

    return true;
  }

  // 13. DOM MutationObserver
  bindDomObservers() {
    if (this.messageObserver) {
      this.messageObserver.disconnect();
    }

    this.messageObserver = new MutationObserver(() => {
      this.checkChatForUpdates();
    });

    const targetContainer = document.querySelector('main') || document.querySelector('#main') || document.body;
    this.messageObserver.observe(targetContainer, { childList: true, subtree: true, characterData: true });

    const threadListContainer =
      document.querySelector('.ig-thread-list') ||
      document.querySelector('#pane-side') ||
      document.querySelector('.chat-list') ||
      document.querySelector('div[role="list"]');

    if (threadListContainer) {
      this.threadsObserver = new MutationObserver(() => this.scanThreads());
      this.threadsObserver.observe(threadListContainer, { childList: true, subtree: true });
    }
  }
}

// Aliases for backward compatibility
const InstagramBridge = UniversalChatBridge;

if (typeof module !== "undefined" && module.exports) {
  module.exports = { UniversalChatBridge, InstagramBridge };
} else {
  window.UniversalChatBridge = UniversalChatBridge;
  window.InstagramBridge = UniversalChatBridge;
}
