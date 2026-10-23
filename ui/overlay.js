// AetherChat - Multi-Theme AI Camouflage Overlay & Animation Engine (Modern 2026 Edition)

class AetherOverlay {
  constructor(options = {}) {
    this.bridge = options.bridge;
    this.hotkeys = options.hotkeys;
    this.theme = "gemini";
    this.activeThreadId = null;
    this.messages = [];
    this.shadowRoot = null;
    this.host = null;
    this.isVisible = true;
    this.isThinking = false;
    this.streamingInterval = null;
  }

  async init() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(["theme", "enabled", "userName"]);
      if (data.theme) this.theme = data.theme;
      if (data.enabled !== undefined) this.isVisible = data.enabled;
    }

    this.mountShadowDom();
    this.bindEvents();
    console.log("[AetherChat Overlay] Mounted with modern 2026 UI & animation engine:", this.theme);
  }

  mountShadowDom() {
    let host = document.getElementById("insta-ai-camouflage-root");
    if (!host) {
      host = document.createElement("div");
      host.id = "insta-ai-camouflage-root";
      document.body.appendChild(host);
    }
    this.host = host;

    // Apply strict visibility and pointer-events to the light DOM host element
    if (this.isVisible) {
      this.host.style.setProperty("display", "block", "important");
      this.host.style.setProperty("pointer-events", "auto", "important");
      this.host.style.setProperty("visibility", "visible", "important");
      this.host.setAttribute("data-hidden", "false");
    } else {
      this.host.style.setProperty("display", "none", "important");
      this.host.style.setProperty("pointer-events", "none", "important");
      this.host.style.setProperty("visibility", "hidden", "important");
      this.host.setAttribute("data-hidden", "true");
    }

    this.shadowRoot = host.attachShadow({ mode: "open" });

    // Host reflection for foreign listeners checking if user is typing
    try {
      Object.defineProperty(this.host, "isContentEditable", {
        get: () => {
          const active = this.shadowRoot ? this.shadowRoot.activeElement : null;
          return !!(active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA"));
        },
        configurable: true
      });
    } catch (e) {}

    this.shadowRoot.innerHTML = `
      <style>
        ${this.getCommonCss()}
        ${this.getGeminiCss()}
        ${this.getChatGptCss()}
        ${this.getClaudeCss()}
      </style>
      <div id="aether-app" data-theme="${this.theme}" class="${this.isVisible ? '' : 'panic-hidden'}">
        <!-- Sidebar Navigation -->
        <aside class="aether-sidebar">
          <div class="sidebar-header">
            <div class="brand-wrap" id="brand-home-btn" title="AetherChat Camouflage">
              <!-- Gemini Sparkle SVG Logo -->
              <svg class="brand-sparkle gemini-only" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z" fill="url(#gemini_sparkle_grad)"/>
                <defs>
                  <linearGradient id="gemini_sparkle_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#4285F4"/>
                    <stop offset="0.35" stop-color="#9B72CB"/>
                    <stop offset="0.7" stop-color="#D96570"/>
                    <stop offset="1" stop-color="#131314"/>
                  </linearGradient>
                </defs>
              </svg>
              <!-- ChatGPT Logo -->
              <div class="brand-gpt-logo chatgpt-only">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V18h-2v-1.07A6 6 0 0 1 6.07 12H7a5 5 0 0 0 5 5 5 5 0 0 0 5-5h.93A6 6 0 0 1 13 16.93zM12 6a4 4 0 1 0 4 4 4 4 0 0 0-4-4z"/></svg>
              </div>
              <!-- Claude Logo -->
              <div class="brand-claude-logo claude-only">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#cc785c"><path d="M12 2l2.4 6.6L21 11l-5.6 4.4L17 22l-5-4-5 4 1.6-6.6L3 11l6.6-2.4z"/></svg>
              </div>
              <span class="brand-name">Gemini</span>
            </div>
            <div class="sidebar-header-actions gemini-only">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
            </div>
          </div>

          <div class="new-chat-container">
            <button class="new-chat-btn" id="new-chat-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              <span>New chat</span>
            </button>
          </div>

          <div class="static-nav-list gemini-only">
            <div class="static-nav-item"><span>📁</span><span>Library</span></div>
            <div class="static-nav-item"><span>🖼️</span><span>Images</span></div>
            <div class="static-nav-item"><span>⏰</span><span>Scheduled</span></div>
            <div class="static-nav-item"><span>🎓</span><span>Students</span></div>
            <div class="static-nav-item"><span>⋯</span><span>More</span></div>
          </div>

          <div class="sidebar-section-title gemini-only">
            <span>Notebooks</span>
          </div>
          <div class="notebook-item gemini-only">
            <span>+</span><span>New notebook</span>
          </div>

          <div class="sidebar-section-title">
            <span id="chats-heading-label">All</span>
            <svg class="gemini-only" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          </div>

          <!-- Dynamic Chat List from Instagram Direct Threads -->
          <div class="chats-scroll-list" id="chats-list-container">
            <!-- Items populated by bridge -->
          </div>

          <!-- Bottom Profile & Discrete Stealth Toggle -->
          <div class="sidebar-bottom-profile">
            <div class="profile-user-info">
              <div class="profile-avatar-circle" id="profile-letter">z</div>
              <div class="profile-text-names">
                <span class="profile-display-name" id="profile-display-name">zerak Xoshnaw</span>
                <span class="profile-tier-badge" id="profile-tier-label">Pro</span>
              </div>
            </div>
            <button class="settings-gear-btn" id="open-settings-btn" title="Camouflage Settings (Alt+Z)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </aside>

        <!-- Main Workspace Area -->
        <main class="aether-main">
          <!-- Ambient Glowing Aura -->
          <div class="ambient-glow-aura gemini-only"></div>

          <header class="main-topbar">
            <!-- Modern Gemini "Open in app" pill -->
            <div class="gemini-open-app-pill gemini-only">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z" fill="#38bdf8"/></svg>
              <span>Open in app</span>
            </div>
            <!-- Header Profile Avatar & 3-dots -->
            <div class="topbar-user-avatar">z</div>
            <div class="topbar-more-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </div>
            <!-- ChatGPT Model pill in top bar -->
            <div class="top-model-pill chatgpt-only">
              <span>ChatGPT 4o</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </div>
          </header>

          <!-- Chat Stream -->
          <div class="aether-chat-stream" id="chat-stream-container">
            <div class="empty-greeting-container" id="empty-state-greeting">
              <h1 class="empty-greeting-title" id="greeting-title-text">Where should we start?</h1>

              <!-- Suggestion Cards (Image 3) -->
              <div class="gemini-suggestions-grid gemini-only">
                <div class="suggestion-card" data-prompt="Plan a bday party that matches my style">
                  <span class="sugg-icon">📅</span>
                  <span class="sugg-text">Plan a bday party that matches my style</span>
                </div>
                <div class="suggestion-card" data-prompt="Organize my daily to-do list">
                  <span class="sugg-icon">📎</span>
                  <span class="sugg-text">Organize my daily to-do list</span>
                </div>
                <div class="suggestion-card" data-prompt="Set up a home office zone">
                  <span class="sugg-icon">⚒️</span>
                  <span class="sugg-text">Set up a home office zone</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Capsule Prompt Box -->
          <div class="input-wrapper-container">
            <div class="gemini-input-capsule">
              <span class="input-plus-icon">+</span>
              <input 
                type="text" 
                class="gemini-prompt-input" 
                id="aether-prompt-input" 
                placeholder="Type @ for connectors, skills and more"
                autocomplete="off"
              />
              <div class="model-selector-pill" id="model-selector-pill" title="Click to switch AI theme">
                <span id="active-model-name">Flash High</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
              </div>

              <!-- Morphing Action Button: Mic ↔ Blue Send Circle ↔ Stop Square -->
              <div class="prompt-action-slot" id="prompt-action-slot">
                <!-- 1. Mic Icon (Default when input empty) -->
                <button class="input-mic-btn active" id="action-mic-btn" title="Dictate prompt">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </button>
                <!-- 2. Blue Send Circle Button (When text present) -->
                <button class="gemini-send-circle-btn" id="action-send-btn" title="Send Message">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                </button>
                <!-- 3. Stop Square Button (When AI thinking) -->
                <button class="gemini-stop-btn" id="action-stop-btn" title="Stop response">
                  <span class="stop-square">■</span>
                </button>
              </div>
            </div>

            <!-- Chat & Task Pills (Image 3) -->
            <div class="bottom-pills-row gemini-only">
              <div class="mode-pill active">Chat</div>
              <div class="mode-pill">Task</div>
            </div>

            <!-- Footer Disclaimer (Image 4 & 5) -->
            <div class="gemini-footer-disclaimer gemini-only">
              <span>Gemini is AI and can make mistakes.</span>
            </div>
          </div>
        </main>

        <!-- Settings / Panic Modal -->
        <div class="aether-modal-backdrop" id="settings-modal-backdrop">
          <div class="aether-modal">
            <h3>⚙️ AetherChat Camouflage Settings</h3>
            <div class="modal-field">
              <label>AI Theme Persona</label>
              <select id="modal-theme-select">
                <option value="gemini">Google Gemini (Default · Flash High)</option>
                <option value="chatgpt">ChatGPT (GPT-4o Charcoal)</option>
                <option value="claude">Claude (Sonnet Warm Clay)</option>
              </select>
            </div>
            <div class="modal-field">
              <label>Display Name</label>
              <input type="text" id="modal-display-name-input" value="zerak Xoshnaw" />
            </div>
            <div class="modal-field">
              <label>Panic Hotkey</label>
              <input type="text" disabled value="Alt+Z or Double-Tap Escape" />
            </div>
            <div class="modal-actions">
              <button class="modal-btn secondary" id="modal-panic-now-btn">Panic! Revert to IG</button>
              <button class="modal-btn primary" id="modal-save-btn">Save & Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const input = this.shadowRoot.getElementById("aether-prompt-input");
    const openSettingsBtn = this.shadowRoot.getElementById("open-settings-btn");
    const modalBackdrop = this.shadowRoot.getElementById("settings-modal-backdrop");
    const modalSaveBtn = this.shadowRoot.getElementById("modal-save-btn");
    const modalPanicBtn = this.shadowRoot.getElementById("modal-panic-now-btn");
    const modalThemeSelect = this.shadowRoot.getElementById("modal-theme-select");
    const modelSelectorPill = this.shadowRoot.getElementById("model-selector-pill");
    const actionSendBtn = this.shadowRoot.getElementById("action-send-btn");
    const actionStopBtn = this.shadowRoot.getElementById("action-stop-btn");

    let isUserTypingInPrompt = false;

    // Track active typing state
    input.addEventListener("focus", () => {
      isUserTypingInPrompt = true;
    });

    // Prevent external blur/focus theft (e.g. Instagram attempting to steal focus when 'n' or other keys are pressed)
    input.addEventListener("blur", (e) => {
      // If user intentionally blurred (clicked somewhere in the overlay or pressed Esc)
      if (!isUserTypingInPrompt) return;

      const related = e.relatedTarget;
      // If focus shifted to an element inside our Shadow DOM (e.g. send button, theme pill, settings gear, modal), allow it
      if (related && (related.getRootNode() === this.shadowRoot || related === this.host)) {
        isUserTypingInPrompt = false;
        return;
      }

      // If focus was stolen by an outside element on the webpage while user was typing
      if (this.isVisible && isUserTypingInPrompt) {
        setTimeout(() => {
          if (this.isVisible && isUserTypingInPrompt && this.shadowRoot.activeElement !== input) {
            console.log("[AetherChat] Restored focus to chat prompt (defended against focus theft)");
            input.focus();
          }
        }, 10);
      }
    });

    // User explicitly clicking elsewhere in the overlay permits natural blur
    this.shadowRoot.addEventListener("pointerdown", (e) => {
      if (e.target !== input) {
        isUserTypingInPrompt = false;
      } else {
        isUserTypingInPrompt = true;
      }
    });

    // Dynamic Send Button Morphing on Input
    input.addEventListener("input", () => {
      this.updateActionButtonsState();
    });

    // 1. Submit Prompt on Enter or Send Button Click
    const handleSend = () => {
      const text = input.value.trim();
      if (!text) return;

      this.addMessageTurn("user", text);
      input.value = "";
      this.updateActionButtonsState();

      // Trigger Thinking Animation (3-Dot Orbital Cluster)
      this.showThinkingAnimation();

      if (this.bridge) {
        this.bridge.sendOutgoingMessage(text);
      }

      // Keep prompt input focused so the user doesn't lose focus after sending
      setTimeout(() => {
        if (this.isVisible) {
          isUserTypingInPrompt = true;
          input.focus();
        }
      }, 80);
    };

    input.addEventListener("keydown", (e) => {
      // 1. Allow Alt+Z for instant panic toggle
      if (e.altKey && (e.key === "z" || e.key === "Z")) {
        return;
      }

      // 2. Submit on Enter
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleSend();
        return;
      }

      // 3. Escape key explicitly blurs the input (user intentionally lifting focus)
      if (e.key === "Escape") {
        isUserTypingInPrompt = false;
        input.blur();
        return;
      }

      // 4. CRITICAL: Stop propagation of all regular keystrokes (like 'n', 'c', 'm', '/', space, etc.)
      // This prevents keystrokes from leaking past the Shadow DOM to Instagram's global document listeners,
      // which previously triggered Instagram's navigation shortcuts and stole focus away!
      e.stopPropagation();
    });

    input.addEventListener("keyup", (e) => {
      if (e.altKey && (e.key === "z" || e.key === "Z")) return;
      e.stopPropagation();
    });

    input.addEventListener("keypress", (e) => {
      e.stopPropagation();
    });

    actionSendBtn.addEventListener("click", handleSend);

    actionStopBtn.addEventListener("click", () => {
      this.hideThinkingAnimation();
    });

    // Suggestion Cards click handler
    this.shadowRoot.querySelectorAll(".suggestion-card").forEach((card) => {
      card.addEventListener("click", () => {
        const prompt = card.getAttribute("data-prompt");
        if (prompt) {
          input.value = prompt;
          handleSend();
        }
      });
    });

    // 2. Settings Modal Interactions
    openSettingsBtn.addEventListener("click", () => {
      modalThemeSelect.value = this.theme;
      modalBackdrop.classList.add("open");
    });

    modalSaveBtn.addEventListener("click", () => {
      const selectedTheme = modalThemeSelect.value;
      const name = this.shadowRoot.getElementById("modal-display-name-input").value.trim();
      if (name) {
        this.shadowRoot.getElementById("profile-display-name").textContent = name;
        this.shadowRoot.getElementById("profile-letter").textContent = name.charAt(0).toLowerCase();
        this.shadowRoot.querySelector(".topbar-user-avatar").textContent = name.charAt(0).toLowerCase();
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ userName: name });
        }
      }
      this.setTheme(selectedTheme);
      modalBackdrop.classList.remove("open");
    });

    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove("open");
      }
    });

    modalPanicBtn.addEventListener("click", () => {
      modalBackdrop.classList.remove("open");
      this.toggleVisibility();
    });

    modelSelectorPill.addEventListener("click", () => {
      const themes = ["gemini", "chatgpt", "claude"];
      const nextTheme = themes[(themes.indexOf(this.theme) + 1) % themes.length];
      this.setTheme(nextTheme);
    });
  }

  // Update Morphing Action Button State (Mic ↔ Send ↔ Stop)
  updateActionButtonsState() {
    const input = this.shadowRoot.getElementById("aether-prompt-input");
    const micBtn = this.shadowRoot.getElementById("action-mic-btn");
    const sendBtn = this.shadowRoot.getElementById("action-send-btn");
    const stopBtn = this.shadowRoot.getElementById("action-stop-btn");

    if (this.isThinking) {
      micBtn.classList.remove("active");
      sendBtn.classList.remove("active");
      stopBtn.classList.add("active");
      return;
    }

    stopBtn.classList.remove("active");
    if (input && input.value.trim().length > 0) {
      micBtn.classList.remove("active");
      sendBtn.classList.add("active");
    } else {
      sendBtn.classList.remove("active");
      micBtn.classList.add("active");
    }
  }

  // Show 3-Dot Orbital Constellation (Image 4 Animation)
  showThinkingAnimation() {
    this.isThinking = true;
    this.updateActionButtonsState();

    const stream = this.shadowRoot.getElementById("chat-stream-container");
    const emptyGreeting = this.shadowRoot.getElementById("empty-state-greeting");
    if (emptyGreeting) emptyGreeting.style.display = "none";

    let thinkingEl = this.shadowRoot.getElementById("gemini-thinking-indicator");
    if (!thinkingEl) {
      thinkingEl = document.createElement("div");
      thinkingEl.id = "gemini-thinking-indicator";
      thinkingEl.className = "gemini-thinking-container";
      thinkingEl.innerHTML = `
        <div class="gemini-thinking-dots">
          <span class="g-dot g-dot-1"></span>
          <span class="g-dot g-dot-2"></span>
          <span class="g-dot g-dot-3"></span>
        </div>
      `;
      stream.appendChild(thinkingEl);
      stream.scrollTop = stream.scrollHeight;
    }

    if (this.bridge && typeof this.bridge.startThinkingPolling === "function") {
      this.bridge.startThinkingPolling();
    }
  }

  // Hide Thinking Animation
  hideThinkingAnimation() {
    this.isThinking = false;
    this.updateActionButtonsState();
    const thinkingEl = this.shadowRoot.getElementById("gemini-thinking-indicator");
    if (thinkingEl) {
      thinkingEl.remove();
    }

    if (this.bridge && typeof this.bridge.stopThinkingPolling === "function") {
      this.bridge.stopThinkingPolling();
    }
  }

  // Set Theme & Update Labels
  setTheme(newTheme) {
    this.theme = newTheme;
    const app = this.shadowRoot.getElementById("aether-app");
    app.setAttribute("data-theme", newTheme);

    const modelNameSpan = this.shadowRoot.getElementById("active-model-name");
    const brandName = this.shadowRoot.querySelector(".brand-name");
    const promptInput = this.shadowRoot.getElementById("aether-prompt-input");
    const greetingText = this.shadowRoot.getElementById("greeting-title-text");
    const chatsHeading = this.shadowRoot.getElementById("chats-heading-label");

    if (newTheme === "gemini") {
      modelNameSpan.textContent = "Flash High";
      brandName.textContent = "Gemini";
      promptInput.placeholder = "Type @ for connectors, skills and more";
      greetingText.textContent = "Where should we start?";
      chatsHeading.textContent = "All";
    } else if (newTheme === "chatgpt") {
      modelNameSpan.textContent = "GPT-4o";
      brandName.textContent = "ChatGPT";
      promptInput.placeholder = "Message ChatGPT...";
      greetingText.textContent = "What can I help with today?";
      chatsHeading.textContent = "Recent";
    } else if (newTheme === "claude") {
      modelNameSpan.textContent = "Claude 3.5 Sonnet";
      brandName.textContent = "Claude";
      promptInput.placeholder = "Reply to Claude...";
      greetingText.textContent = "Good afternoon, Human";
      chatsHeading.textContent = "Recent Chats";
    }

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ theme: newTheme });
    }
  }

  // Toggle Visibility for Panic Hotkey
  toggleVisibility(forcedState) {
    if (typeof forcedState === "boolean") {
      this.isVisible = forcedState;
    } else {
      this.isVisible = !this.isVisible;
    }

    const app = this.shadowRoot ? this.shadowRoot.getElementById("aether-app") : null;

    if (this.isVisible) {
      if (this.host) {
        this.host.style.setProperty("display", "block", "important");
        this.host.style.setProperty("pointer-events", "auto", "important");
        this.host.style.setProperty("visibility", "visible", "important");
        this.host.setAttribute("data-hidden", "false");
        this.host.classList.remove("panic-hidden");
      }
      if (app) app.classList.remove("panic-hidden");
      setTimeout(() => {
        const input = this.shadowRoot ? this.shadowRoot.getElementById("aether-prompt-input") : null;
        if (input) input.focus();
      }, 50);
    } else {
      if (app) app.classList.add("panic-hidden");
      if (this.host) {
        this.host.style.setProperty("display", "none", "important");
        this.host.style.setProperty("pointer-events", "none", "important");
        this.host.style.setProperty("visibility", "hidden", "important");
        this.host.setAttribute("data-hidden", "true");
        this.host.classList.add("panic-hidden");
      }
      const nativeInput = this.bridge ? this.bridge.getNativeInput() : null;
      if (nativeInput) nativeInput.focus();
    }

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ enabled: this.isVisible });
    }
  }

  // Clear Chat Stream for Thread Switching
  clearChatStream() {
    const stream = this.shadowRoot ? this.shadowRoot.getElementById("chat-stream-container") : null;
    if (!stream) return;
    stream.querySelectorAll('.message-turn, #gemini-thinking-indicator').forEach(el => el.remove());
    const emptyGreeting = this.shadowRoot.getElementById("empty-state-greeting");
    if (emptyGreeting) {
      emptyGreeting.style.display = "flex";
    }
    this.messages = [];
    this.lastTurn = null;
    this.hideThinkingAnimation();
  }

  // Update Sidebar Chats
  renderThreadsList(threads) {
    const list = this.shadowRoot.getElementById("chats-list-container");
    if (!list) return;

    list.innerHTML = "";
    threads.forEach((t) => {
      const item = document.createElement("div");
      item.className = `chat-session-item stealth-tooltip-wrap ${t.isActive ? 'active' : ''}`;
      item.setAttribute("data-thread-id", t.threadId);

      item.innerHTML = `
        <span class="chat-session-title">${this.escapeHtml(t.maskedTitle)}</span>
        ${t.isActive ? '<span class="active-pin-icon">📌</span>' : ''}
        <div class="stealth-tooltip">Friend: @${this.escapeHtml(t.username)}</div>
      `;

      item.addEventListener("click", () => {
        this.shadowRoot.querySelectorAll(".chat-session-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
        this.clearChatStream();
        if (this.bridge) {
          this.bridge.selectThread(t.threadId);
        }
      });

      list.appendChild(item);
    });
  }

  // Load Existing Historical Messages from Instagram
  renderExistingMessages(history) {
    if (!history || history.length === 0) return;
    this.clearChatStream();
    const emptyGreeting = this.shadowRoot.getElementById("empty-state-greeting");
    if (emptyGreeting) {
      emptyGreeting.style.display = "none";
    }

    history.forEach((msg) => {
      this.addMessageTurn(msg.role, msg.text, false); // false = no streaming delay
    });
  }

  // Add Message Turn (User or Assistant Friend) with Modern Typewriter Streaming
  addMessageTurn(role, text, animateStream = true) {
    if (!text || typeof text !== "string") return;
    const cleanText = text.trim();
    if (!cleanText) return;

    // Prevent immediate consecutive duplicate messages (prevents "choi" showing twice)
    const now = Date.now();
    if (
      this.lastTurn &&
      this.lastTurn.role === role &&
      this.lastTurn.text === cleanText &&
      now - this.lastTurn.time < 5000
    ) {
      console.log("[AetherChat Overlay] Prevented duplicate turn:", role, cleanText);
      return;
    }
    this.lastTurn = { role, text: cleanText, time: now };
    this.messages.push({ role, text: cleanText, timestamp: now });

    this.hideThinkingAnimation();

    const stream = this.shadowRoot.getElementById("chat-stream-container");
    const emptyGreeting = this.shadowRoot.getElementById("empty-state-greeting");
    if (emptyGreeting) {
      emptyGreeting.style.display = "none";
    }

    const turn = document.createElement("div");
    turn.className = `message-turn ${role}`;

    if (role === "user") {
      turn.innerHTML = `
        <div class="prompt-bubble">${this.escapeHtml(cleanText)}</div>
      `;
      stream.appendChild(turn);
      stream.scrollTop = stream.scrollHeight;
    } else {
      // Modern Gemini assistant response (Image 5)
      turn.innerHTML = `
        <div class="assistant-content-wrapper">
          <div class="response-content" id="response-content-target"></div>
          <div class="gemini-response-actions">
            <button class="action-icon-btn" title="Good response">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            </button>
            <button class="action-icon-btn" title="Bad response">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
            </button>
            <button class="action-icon-btn" title="Modify response">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
            <button class="action-icon-btn copy-btn" title="Copy response">
              <svg class="copy-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span class="copy-check" style="display:none;color:#10b981;">✓</span>
            </button>
            <button class="action-icon-btn" title="More">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
          </div>
        </div>
      `;

      stream.appendChild(turn);
      stream.scrollTop = stream.scrollHeight;

      const target = turn.querySelector("#response-content-target");
      const copyBtn = turn.querySelector(".copy-btn");

      // Bind copy button
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(cleanText);
        const icon = copyBtn.querySelector(".copy-icon");
        const check = copyBtn.querySelector(".copy-check");
        icon.style.display = "none";
        check.style.display = "inline";
        setTimeout(() => {
          icon.style.display = "inline";
          check.style.display = "none";
        }, 1500);
      });

      // Typewriter Streaming Animation
      if (animateStream && cleanText.length > 0) {
        this.streamTextIntoElement(target, cleanText);
      } else {
        target.innerHTML = this.formatAsMarkdown(cleanText);
      }
    }
  }

  // Real-life Typewriter Token Streaming Animation
  streamTextIntoElement(element, fullText) {
    const words = fullText.split(" ");
    element.innerHTML = '<span class="streaming-caret">▌</span>';

    if (words.length > 1) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        currentIndex += 1;
        const currentWords = words.slice(0, currentIndex).join(" ");
        element.innerHTML = this.formatAsMarkdown(currentWords) + ' <span class="streaming-caret">▌</span>';

        const stream = this.shadowRoot.getElementById("chat-stream-container");
        if (stream) stream.scrollTop = stream.scrollHeight;

        if (currentIndex >= words.length) {
          clearInterval(interval);
          element.innerHTML = this.formatAsMarkdown(fullText); // final clean render
        }
      }, 35);
    } else {
      // Single word (e.g. "Bashi", "Hi", "Hello") - stream smoothly character-by-character
      let charIndex = 0;
      const interval = setInterval(() => {
        charIndex += 1;
        const currentChars = fullText.slice(0, charIndex);
        element.innerHTML = this.formatAsMarkdown(currentChars) + ' <span class="streaming-caret">▌</span>';

        const stream = this.shadowRoot.getElementById("chat-stream-container");
        if (stream) stream.scrollTop = stream.scrollHeight;

        if (charIndex >= fullText.length) {
          clearInterval(interval);
          element.innerHTML = this.formatAsMarkdown(fullText);
        }
      }, 40);
    }
  }

  formatAsMarkdown(raw) {
    if (!raw) return "";

    let parsed = this.escapeHtml(raw);

    // Code blocks ```code```
    parsed = parsed.replace(/```([\s\S]*?)```/g, (match, p1) => {
      return `<pre><code>${p1.trim()}</code></pre>`;
    });

    // Inline `code`
    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold **text**
    parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Paragraph breaks
    const paragraphs = parsed.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
    return paragraphs;
  }

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  // Master Common CSS Layout
  getCommonCss() {
    return `
      :host {
        all: initial;
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Google Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color-scheme: dark;
      }
      :host([data-hidden="true"]),
      :host(.panic-hidden) {
        display: none !important;
        pointer-events: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      #aether-app {
        width: 100%;
        height: 100%;
        display: flex;
        overflow: hidden;
        position: relative;
        transition: opacity 0.15s ease-out, visibility 0.15s ease-out;
      }
      #aether-app.panic-hidden {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      button { background: none; border: none; font: inherit; color: inherit; cursor: pointer; }
      input, textarea { font: inherit; color: inherit; }

      /* Sidebar Structure */
      .aether-sidebar {
        width: 270px;
        display: flex;
        flex-direction: column;
        height: 100vh;
        flex-shrink: 0;
        user-select: none;
      }
      .sidebar-header {
        padding: 16px 20px 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .brand-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
      }
      .brand-sparkle {
        width: 22px;
        height: 22px;
      }
      .brand-name {
        font-size: 18px;
        font-weight: 500;
        letter-spacing: -0.2px;
      }
      .sidebar-header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .sidebar-header-actions svg {
        cursor: pointer;
        border-radius: 50%;
        padding: 4px;
      }

      .new-chat-container {
        padding: 8px 16px 14px 16px;
      }
      .new-chat-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 9px 14px;
        border-radius: 20px;
        font-size: 13.5px;
        font-weight: 500;
        transition: background 0.15s;
      }

      .static-nav-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 0 12px;
      }
      .static-nav-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 13.5px;
        color: #c4c7c5;
        cursor: pointer;
        transition: background 0.15s;
      }

      .sidebar-section-title {
        padding: 14px 16px 6px 22px;
        font-size: 12px;
        font-weight: 500;
        color: #9aa0a6;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .notebook-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 8px 12px;
        margin: 0 12px;
        border-radius: 20px;
        font-size: 13.5px;
        color: #c4c7c5;
        cursor: pointer;
      }

      .chats-scroll-list {
        flex: 1;
        overflow-y: auto;
        padding: 4px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .chat-session-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        border-radius: 20px;
        font-size: 13.5px;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.15s;
        position: relative;
      }
      .chat-session-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 195px;
      }
      .active-pin-icon {
        font-size: 11px;
        opacity: 0.8;
      }

      .sidebar-bottom-profile {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .profile-user-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .profile-avatar-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #27272a;
        color: #e4e4e7;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        border: 1px solid #3f3f46;
      }
      .profile-text-names {
        display: flex;
        flex-direction: column;
      }
      .profile-display-name {
        font-size: 13.5px;
        font-weight: 500;
      }
      .profile-tier-badge {
        font-size: 11px;
        color: #9aa0a6;
      }
      .settings-gear-btn {
        color: #9aa0a6;
        padding: 6px;
        border-radius: 50%;
        transition: background 0.15s;
      }

      /* Main Workspace Structure */
      .aether-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100vh;
        position: relative;
      }
      .ambient-glow-aura {
        position: absolute;
        top: 12%;
        left: 50%;
        transform: translateX(-50%);
        width: 750px;
        height: 480px;
        background: radial-gradient(ellipse 65% 50% at 50% 35%, rgba(26, 43, 94, 0.42) 0%, rgba(19, 19, 20, 0) 72%);
        pointer-events: none;
        z-index: 0;
        animation: auraBreath 8s ease-in-out infinite;
      }
      @keyframes auraBreath {
        0%, 100% { opacity: 0.85; transform: translateX(-50%) scale(1); }
        50% { opacity: 1; transform: translateX(-50%) scale(1.08); }
      }

      .main-topbar {
        height: 56px;
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 14px;
        z-index: 2;
      }
      .gemini-open-app-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 18px;
        background: #1e1f20;
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 13px;
        font-weight: 500;
        color: #e3e3e3;
        cursor: pointer;
      }
      .topbar-user-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #27272a;
        color: #e3e3e3;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .topbar-more-icon {
        color: #9aa0a6;
        cursor: pointer;
        padding: 4px;
      }

      .top-model-pill {
        display: none;
      }

      .aether-chat-stream {
        flex: 1;
        overflow-y: auto;
        padding: 24px 20% 140px 20%;
        display: flex;
        flex-direction: column;
        gap: 28px;
        z-index: 1;
      }
      .empty-greeting-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: 28px;
      }
      .empty-greeting-title {
        font-size: 38px;
        font-weight: 400;
        letter-spacing: -0.5px;
      }

      /* Suggestion Cards Grid (Image 3) */
      .gemini-suggestions-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: min(580px, 90%);
      }
      .suggestion-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 18px;
        border-radius: 14px;
        background: rgba(30, 31, 32, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, transform 0.15s;
      }
      .suggestion-card:hover {
        background: #282a2c;
        border-color: rgba(138, 180, 248, 0.3);
        transform: translateY(-1px);
      }
      .sugg-icon {
        font-size: 16px;
      }
      .sugg-text {
        font-size: 14px;
        color: #e3e3e3;
      }

      /* Message Turns */
      .message-turn.user {
        display: flex;
        justify-content: flex-end;
      }
      .message-turn.user .prompt-bubble {
        padding: 12px 20px;
        border-radius: 20px;
        max-width: 75%;
        font-size: 15px;
        line-height: 1.5;
        background: #1e1f20;
        color: #f1f1f1;
        box-shadow: 0 2px 10px rgba(0,0,0,0.25);
        animation: bubblePop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes bubblePop {
        from { opacity: 0; transform: translateY(8px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .message-turn.assistant {
        display: flex;
        flex-direction: column;
        max-width: 85%;
      }
      .assistant-content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .response-content {
        font-size: 15px;
        line-height: 1.65;
        color: #e3e3e3;
      }
      .streaming-caret {
        color: #38bdf8;
        animation: caretBlink 0.7s infinite;
      }
      @keyframes caretBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      /* Gemini Response Actions (Image 5) */
      .gemini-response-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }
      .action-icon-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9aa0a6;
        transition: background 0.15s, color 0.15s;
      }
      .action-icon-btn:hover {
        background: #282a2c;
        color: #ffffff;
      }

      /* 3-Dot Orbital Thinking Animation (Image 4) */
      .gemini-thinking-container {
        display: flex;
        align-items: center;
        padding: 10px 0;
        margin-left: 6px;
      }
      .gemini-thinking-dots {
        position: relative;
        width: 24px;
        height: 24px;
        animation: geminiOrbit 2.4s linear infinite;
      }
      .g-dot {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 6px #8ab4f8, 0 0 10px rgba(66, 133, 244, 0.8);
      }
      .g-dot-1 {
        top: 2px;
        left: 10px;
        animation: gDotPulse1 1.6s ease-in-out infinite;
      }
      .g-dot-2 {
        bottom: 2px;
        left: 3px;
        animation: gDotPulse2 1.6s ease-in-out infinite 0.3s;
      }
      .g-dot-3 {
        bottom: 4px;
        right: 3px;
        animation: gDotPulse3 1.6s ease-in-out infinite 0.6s;
      }
      @keyframes geminiOrbit {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes gDotPulse1 {
        0%, 100% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.4); opacity: 1; filter: drop-shadow(0 0 6px #8ab4f8); }
      }
      @keyframes gDotPulse2 {
        0%, 100% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.3); opacity: 1; filter: drop-shadow(0 0 6px #d96570); }
      }
      @keyframes gDotPulse3 {
        0%, 100% { transform: scale(0.8); opacity: 0.4; }
        50% { transform: scale(1.5); opacity: 1; filter: drop-shadow(0 0 8px #9b72cb); }
      }

      /* Floating Input Capsule (Image 3) */
      .input-wrapper-container {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: min(840px, 86%);
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 10;
      }
      .gemini-input-capsule {
        background: #1e1f20;
        border-radius: 32px;
        padding: 10px 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
        transition: border-color 0.15s;
      }
      .gemini-input-capsule:focus-within {
        border-color: rgba(138, 180, 248, 0.5);
      }
      .input-plus-icon {
        font-size: 20px;
        color: #9aa0a6;
        cursor: pointer;
      }
      .gemini-prompt-input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        font-size: 15px;
        color: #e3e3e3;
      }
      .model-selector-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        padding: 6px 14px;
        border-radius: 18px;
        background: #282a2c;
        color: #c4c7c5;
        cursor: pointer;
      }

      /* Morphing Action Button Slot (Mic ↔ Blue Arrow ↔ Stop Square) */
      .prompt-action-slot {
        width: 32px;
        height: 32px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .input-mic-btn, .gemini-send-circle-btn, .gemini-stop-btn {
        position: absolute;
        top: 0; left: 0; width: 32px; height: 32px;
        display: none;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        cursor: pointer;
      }
      .input-mic-btn.active, .gemini-send-circle-btn.active, .gemini-stop-btn.active {
        display: flex;
      }
      .input-mic-btn {
        color: #9aa0a6;
      }
      .gemini-send-circle-btn {
        background: #1a73e8;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(26, 115, 232, 0.45);
        transition: transform 0.15s, background-color 0.15s;
      }
      .gemini-send-circle-btn:hover {
        background: #185abc;
        transform: scale(1.05);
      }
      .gemini-stop-btn {
        background: #282a2c;
        border: 1px solid #3c4043;
        color: #e3e3e3;
        animation: stopPulse 1.8s ease-in-out infinite;
      }
      .stop-square {
        font-size: 11px;
      }
      @keyframes stopPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); border-color: #8ab4f8; }
      }

      .bottom-pills-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      .mode-pill {
        border-radius: 16px;
        padding: 5px 16px;
        font-size: 12.5px;
        cursor: pointer;
      }

      .gemini-footer-disclaimer {
        font-size: 11.5px;
        color: #80868b;
        text-align: center;
      }

      /* Stealth Tooltip */
      .stealth-tooltip-wrap { position: relative; }
      .stealth-tooltip {
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(15, 23, 42, 0.95);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
        z-index: 1000;
        margin-left: 8px;
      }
      .stealth-tooltip-wrap:hover .stealth-tooltip { opacity: 1; }

      /* Settings Modal */
      .aether-modal-backdrop {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 100000;
        opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
      }
      .aether-modal-backdrop.open { opacity: 1; pointer-events: auto; }
      .aether-modal {
        width: 440px; background: #1e1f20; border: 1px solid #3c4043;
        border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.8);
        display: flex; flex-direction: column; gap: 16px; color: #e3e3e3;
      }
      .aether-modal h3 { font-size: 18px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
      .modal-field { display: flex; flex-direction: column; gap: 6px; }
      .modal-field label { font-size: 12px; color: #9aa0a6; text-transform: uppercase; letter-spacing: 0.5px; }
      .modal-field select, .modal-field input {
        background: #131314; border: 1px solid #3c4043; color: #e3e3e3;
        padding: 8px 12px; border-radius: 8px; outline: none;
      }
      .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
      .modal-btn { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; }
      .modal-btn.primary { background: #8ab4f8; color: #131314; }
      .modal-btn.secondary { background: #2d2f31; color: #e3e3e3; }
    `;
  }

  getGeminiCss() {
    return `
      #aether-app[data-theme="gemini"] {
        background-color: #131314;
        color: #e3e3e3;
      }
      #aether-app[data-theme="gemini"] .chatgpt-only,
      #aether-app[data-theme="gemini"] .claude-only { display: none !important; }

      #aether-app[data-theme="gemini"] .aether-sidebar {
        background-color: #1e1f20;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
      }
      #aether-app[data-theme="gemini"] .brand-name { color: #e3e3e3; }
      #aether-app[data-theme="gemini"] .sidebar-header-actions { color: #9aa0a6; }
      #aether-app[data-theme="gemini"] .new-chat-btn {
        background: #1a1a1c; color: #e3e3e3; border: 1px solid rgba(255, 255, 255, 0.04);
      }
      #aether-app[data-theme="gemini"] .new-chat-btn:hover { background: #282a2c; }
      #aether-app[data-theme="gemini"] .chat-session-item { color: #e3e3e3; }
      #aether-app[data-theme="gemini"] .chat-session-item:hover { background: #282a2c; }
      #aether-app[data-theme="gemini"] .chat-session-item.active { background: #282a2c; color: #ffffff; }
      #aether-app[data-theme="gemini"] .aether-main { background: #131314; }
      #aether-app[data-theme="gemini"] .mode-pill { background: #1e1f20; color: #c4c7c5; }
      #aether-app[data-theme="gemini"] .mode-pill.active { background: #282a2c; color: #fff; }
    `;
  }

  getChatGptCss() {
    return `
      #aether-app[data-theme="chatgpt"] {
        background-color: #212121;
        color: #ececec;
      }
      #aether-app[data-theme="chatgpt"] .gemini-only,
      #aether-app[data-theme="chatgpt"] .claude-only { display: none !important; }
      #aether-app[data-theme="chatgpt"] .chatgpt-only { display: flex !important; }

      #aether-app[data-theme="chatgpt"] .aether-sidebar {
        background-color: #171717;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
      }
      #aether-app[data-theme="chatgpt"] .brand-name { color: #ececec; font-weight: 600; font-size: 16px; }
      #aether-app[data-theme="chatgpt"] .new-chat-btn {
        background: transparent; color: #ececec; border: 1px solid #424242; border-radius: 8px;
      }
      #aether-app[data-theme="chatgpt"] .new-chat-btn:hover { background: #2f2f2f; }
      #aether-app[data-theme="chatgpt"] .chat-session-item { border-radius: 8px; color: #b4b4b4; }
      #aether-app[data-theme="chatgpt"] .chat-session-item:hover,
      #aether-app[data-theme="chatgpt"] .chat-session-item.active { background: #2f2f2f; color: #ffffff; }
      #aether-app[data-theme="chatgpt"] .aether-main { background: #212121; }
      #aether-app[data-theme="chatgpt"] .message-turn.user .prompt-bubble { background: #2f2f2f; color: #ffffff; }
      #aether-app[data-theme="chatgpt"] .gemini-input-capsule {
        background: #2f2f2f; border: 1px solid #424242; border-radius: 24px;
      }
      #aether-app[data-theme="chatgpt"] .model-selector-pill { background: #383838; color: #ececec; }
    `;
  }

  getClaudeCss() {
    return `
      #aether-app[data-theme="claude"] {
        background-color: #262624;
        color: #e5e5e4;
      }
      #aether-app[data-theme="claude"] .gemini-only,
      #aether-app[data-theme="claude"] .chatgpt-only { display: none !important; }
      #aether-app[data-theme="claude"] .claude-only { display: flex !important; }

      #aether-app[data-theme="claude"] .aether-sidebar {
        background-color: #1f1e1d;
        border-right: 1px solid #383734;
      }
      #aether-app[data-theme="claude"] .brand-name {
        font-family: Georgia, serif; font-size: 20px; font-weight: 500; color: #e5e5e4;
      }
      #aether-app[data-theme="claude"] .new-chat-btn {
        background: #cc785c; color: #1f1e1d; font-weight: 600; border-radius: 8px; border: none;
      }
      #aether-app[data-theme="claude"] .chat-session-item { border-radius: 6px; color: #bbb; }
      #aether-app[data-theme="claude"] .chat-session-item:hover,
      #aether-app[data-theme="claude"] .chat-session-item.active { background: #2d2c2a; color: #fff; }
      #aether-app[data-theme="claude"] .aether-main { background: #262624; }
      #aether-app[data-theme="claude"] .message-turn.user .prompt-bubble { background: #333230; color: #fff; }
      #aether-app[data-theme="claude"] .gemini-input-capsule {
        background: #1f1e1d; border: 1px solid #383734; border-radius: 14px;
      }
      #aether-app[data-theme="claude"] .model-selector-pill { background: #333230; color: #e5e5e4; }
    `;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AetherOverlay };
} else {
  window.AetherOverlay = AetherOverlay;
}
