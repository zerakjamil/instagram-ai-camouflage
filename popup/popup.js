// AetherChat - Popup Controller

document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("camouflage-toggle");
  const themeRadios = document.querySelectorAll('input[name="ai-theme"]');
  const openTestbenchBtn = document.getElementById("open-testbench-btn");

  // 1. Load initial storage
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    const data = await chrome.storage.local.get(["enabled", "theme"]);
    if (data.enabled !== undefined) {
      toggle.checked = data.enabled;
    }
    if (data.theme) {
      const radio = document.querySelector(`input[name="ai-theme"][value="${data.theme}"]`);
      if (radio) radio.checked = true;
    }
  }

  // 2. Handle Master Toggle
  toggle.addEventListener("change", async () => {
    const isEnabled = toggle.checked;
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ enabled: isEnabled });
    }
  });

  // 3. Handle Theme Changes
  themeRadios.forEach((radio) => {
    radio.addEventListener("change", async () => {
      if (radio.checked) {
        const theme = radio.value;
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ theme });
        }
      }
    });
  });

  // 4. Open Testbench
  openTestbenchBtn.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("test/instagram_mock.html")
      });
    } else {
      window.open("../test/instagram_mock.html", "_blank");
    }
  });
});
