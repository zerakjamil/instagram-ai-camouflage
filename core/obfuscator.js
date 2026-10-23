// AetherChat - Contact & Thread Obfuscation Engine (Modern Gemini Topics)

const TECHNICAL_AI_TOPICS = [
  "Monetization Brainstorming: Ready?",
  "Casual Greeting and Readiness",
  "MacBook Pro Touch Bar & Trackpad Customization",
  "Roman-Inspired Tech Company Names",
  "Fixing the Opencode Update Error",
  "Implementing Dialog Windows via IPC",
  "Foundations of Probability: Concepts & Proofs",
  "Digital Images: Sampling and Quantization",
  "Fixing the Installer Process Error",
  "Claude Startup Program Status",
  "LACP Channel-Group Configuration Guide",
  "Battery Guard for Ubuntu Servers",
  "Updating Free Claude Code",
  "Step-by-Step Guide to Database Normalization",
  "Is Packet Tracer Free?",
  "Countries With Blocked International Connections",
  "Transformer Attention Matrix Optimization",
  "PostgreSQL Connection Pool Sizing",
  "Tailscale Derp Relay Latency Analysis",
  "WebAssembly SIMD Matrix Multiplication"
];

class ContactObfuscator {
  constructor() {
    this.customAliases = {};
  }

  async init() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get("friendAliases");
        if (data.friendAliases) {
          this.customAliases = data.friendAliases;
        }
      }
    } catch (e) {
      console.warn("[AetherChat] Storage read failed, using memory aliases", e);
    }
  }

  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  getMaskedTitle(threadId, username) {
    const key = String(threadId || username);
    if (this.customAliases[key]) {
      return this.customAliases[key];
    }

    // Special match for ChessMancer to mirror modern Gemini session
    if (key.toLowerCase().includes("chessmancer") || key.includes("17845011597148603")) {
      return "Casual Greeting and Readiness";
    }

    const idx = this._hash(key) % TECHNICAL_AI_TOPICS.length;
    return TECHNICAL_AI_TOPICS[idx];
  }

  async setCustomAlias(key, customTitle) {
    this.customAliases[key] = customTitle;
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ friendAliases: this.customAliases });
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ContactObfuscator, TECHNICAL_AI_TOPICS };
} else {
  window.ContactObfuscator = ContactObfuscator;
}
