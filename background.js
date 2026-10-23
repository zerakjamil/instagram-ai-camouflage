// AetherChat - Background Service Worker

chrome.runtime.onInstalled.addListener(async (details) => {
  const defaults = {
    enabled: true,
    theme: "gemini", // "gemini", "chatgpt", "claude"
    panicHotkey: "Alt+Z",
    doubleEscEnabled: true,
    friendAliases: {},
    stealthMode: "full_camouflage"
  };

  const current = await chrome.storage.local.get(Object.keys(defaults));
  const toSet = {};
  for (const [key, val] of Object.entries(defaults)) {
    if (current[key] === undefined) {
      toSet[key] = val;
    }
  }

  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }

  console.log("[AetherChat] Service worker initialized with theme:", current.theme || defaults.theme);
});

// Broadcast state changes to active tabs
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "AETHER_CONFIG_UPDATED",
      changes
    }).catch(() => {
      // Tab may not have content script running
    });
  });
});
