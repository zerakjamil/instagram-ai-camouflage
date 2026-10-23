// AetherChat - Instant Panic & Stealth Hotkey Listener

class HotkeyManager {
  constructor(onToggle) {
    this.onToggle = onToggle;
    this.lastEscTime = 0;
    this.escThresholdMs = 350;
    this.enabled = true;
    this.panicKey = "Alt+Z";
  }

  init() {
    window.addEventListener("keydown", (e) => this.handleKeyDown(e), true);
  }

  handleKeyDown(e) {
    if (!this.enabled) return;

    // 1. Check Alt+Z
    if (e.altKey && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      e.stopPropagation();
      this.triggerToggle("hotkey_alt_z");
      return;
    }

    // 2. Check Double-Tap Escape
    if (e.key === "Escape") {
      const now = Date.now();
      if (now - this.lastEscTime <= this.escThresholdMs) {
        e.preventDefault();
        e.stopPropagation();
        this.lastEscTime = 0;
        this.triggerToggle("double_escape");
        return;
      }
      this.lastEscTime = now;
    }
  }

  triggerToggle(source) {
    console.log(`[AetherChat] Panic toggle triggered by ${source}`);
    if (this.onToggle) {
      this.onToggle(source);
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { HotkeyManager };
} else {
  window.HotkeyManager = HotkeyManager;
}
