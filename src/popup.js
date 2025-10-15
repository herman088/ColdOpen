document.addEventListener("DOMContentLoaded", () => {
  getUserLevel();
  setUserLevel();
  const btn = document.getElementById("extractBtn");
  const status = document.getElementById("status");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    status.textContent = "Reading page...";

    try {
      // returns fulfilled promise of array of "tabs" matching args,destructure and get active tab,
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url.startsWith("http")) {
        status.textContent =
          "⚠️ Can't analyze this page (file://, chrome://, etc.)";
        btn.disabled = false;
        return;
      }
      //promise fulfilled with response object reply by content.js
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "extractArticle",
      });

      if (response.success) {
        status.textContent = "Parsing article with Summarizer";
        console.log("Article title:", response.title);
        console.log("Text length:", response.text.length, "chars");
        console.log("Text:", response.text);
      } else {
        status.textContent =
          "❌ Couldn't extract clean text. Try another page.";
        btn.disabled = false;
      }
    } catch (error) {
      console.log("Extraction error", error);
    }
  });
});

// Function to initialize click listeners and save reader level
function setUserLevel() {
  const buttons = document.querySelectorAll(".level-buttons button");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const level = btn.dataset.level;

      // Save in storage using .then()
      chrome.storage.local
        .set({ readerLevel: level })
        .then(() => console.log("Reader level saved:", level))
        .catch((err) => console.error("Failed to save reader level:", err));

      // Highlight selected button
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// Function to load saved reader level and update UI
function getUserLevel() {
  const buttons = document.querySelectorAll(".level-buttons button");

  chrome.storage.local
    .get("readerLevel")
    .then((data) => {
      const savedLevel = data.readerLevel || "medium"; // default
      buttons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.level === savedLevel);
      });
    })
    .catch((err) => console.error("Failed to load reader level:", err));
}
