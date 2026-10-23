// Instagram Direct Mock Testbench Logic

document.addEventListener("DOMContentLoaded", () => {
  const messageContainer = document.getElementById("ig-message-container");
  const nativeInput = document.getElementById("ig-native-input");
  const sendBtn = document.getElementById("ig-native-send-btn");
  const threadItems = document.querySelectorAll(".ig-thread-item");
  const headerUsername = document.getElementById("header-username");
  const headerAvatarLetter = document.getElementById("header-avatar-letter");
  const simCurrentFriend = document.getElementById("sim-current-friend");

  let activeUser = "alex_engineer";

  // 1. Send Outgoing Message
  function sendOutgoingMessage() {
    const text = nativeInput.innerText.trim();
    if (!text) return;

    const row = document.createElement("div");
    row.className = "ig-message-row outgoing";
    row.setAttribute("data-sender", "me");
    row.innerHTML = `<div class="ig-msg-bubble">${escapeHtml(text)}</div>`;
    messageContainer.appendChild(row);

    nativeInput.innerHTML = "";
    messageContainer.scrollTop = messageContainer.scrollHeight;

    console.log("[Mock IG] Sent message to", activeUser, ":", text);
  }

  sendBtn.addEventListener("click", sendOutgoingMessage);

  nativeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendOutgoingMessage();
    }
  });

  // 2. Thread Switching
  threadItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      threadItems.forEach(t => t.classList.remove("active"));
      item.classList.add("active");

      activeUser = item.getAttribute("data-username");
      const fullName = item.getAttribute("data-fullname") || activeUser;
      
      headerUsername.textContent = activeUser;
      headerAvatarLetter.textContent = activeUser.charAt(0).toUpperCase();
      simCurrentFriend.textContent = activeUser;

      // Update mock message list for switched user
      messageContainer.innerHTML = `
        <div class="ig-message-row incoming" data-sender="${activeUser}">
          <div class="ig-msg-bubble">
            Hey! Switched to our conversation with ${fullName}.
          </div>
        </div>
      `;

      // Trigger custom navigation event for extension bridge
      window.dispatchEvent(new CustomEvent("ig-thread-changed", {
        detail: { threadId: item.getAttribute("data-thread-id"), username: activeUser }
      }));
    });
  });

  // 3. Simulation Panel Helpers
  function simulateIncomingMessage(contentHtml) {
    const row = document.createElement("div");
    row.className = "ig-message-row incoming";
    row.setAttribute("data-sender", activeUser);
    row.innerHTML = `<div class="ig-msg-bubble">${contentHtml}</div>`;
    messageContainer.appendChild(row);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    console.log("[Mock IG] Incoming friend message simulated from", activeUser);
  }

  document.getElementById("sim-reply-text").addEventListener("click", () => {
    const replies = [
      "I just pushed the branch with the new routing table rules.",
      "Can you test if sys.boot_completed equals 1 now?",
      "Yeah that looks good! Let's double check the latency across Tailscale.",
      "The Gemini camouflage looks surprisingly convincing, nice job!"
    ];
    const pick = replies[Math.floor(Math.random() * replies.length)];
    simulateIncomingMessage(escapeHtml(pick));
  });

  document.getElementById("sim-reply-code").addEventListener("click", () => {
    const codeSnippet = `Here is the ip rule fix:
<pre style="background:#111;padding:8px;border-radius:6px;margin-top:6px;font-family:monospace;">ip rule add from all lookup main pref 29000
ip route flush cache</pre>`;
    simulateIncomingMessage(codeSnippet);
  });

  document.getElementById("sim-reply-image").addEventListener("click", () => {
    const imgHtml = `Check out this server screenshot:
<div style="margin-top:6px;padding:12px;background:#18181b;border-radius:8px;border:1px dashed #555;text-align:center;">
  [📷 Attached Screenshot: system_metrics_2026.png]
</div>`;
    simulateIncomingMessage(imgHtml);
  });

  document.getElementById("sim-add-thread").addEventListener("click", () => {
    const names = ["elena_ai", "david_cloud", "maya_security", "jordan_frontend"];
    const rand = names[Math.floor(Math.random() * names.length)] + "_" + Math.floor(Math.random() * 100);
    const list = document.querySelector(".ig-thread-list");
    
    const a = document.createElement("a");
    a.href = `/direct/t/thread_${rand}/`;
    a.className = "ig-thread-item";
    a.setAttribute("data-thread-id", `thread_${rand}`);
    a.setAttribute("data-username", rand);
    a.innerHTML = `
      <div class="ig-avatar">
        <span class="avatar-letter">${rand.charAt(0).toUpperCase()}</span>
      </div>
      <div class="ig-thread-info">
        <span class="ig-friend-name">${rand}</span>
        <span class="ig-last-snippet">New conversation started</span>
      </div>
    `;
    list.appendChild(a);
  });

  // Toggle sim panel collapse
  const simPanel = document.getElementById("sim-control-panel");
  const simToggleBtn = document.getElementById("sim-toggle-btn");
  simToggleBtn.addEventListener("click", () => {
    const body = simPanel.querySelector(".sim-panel-body");
    if (body.style.display === "none") {
      body.style.display = "flex";
      simToggleBtn.textContent = "−";
    } else {
      body.style.display = "none";
      simToggleBtn.textContent = "+";
    }
  });

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }
});
