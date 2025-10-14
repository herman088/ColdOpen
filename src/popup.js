document.addEventListener("DOMContentLoaded", () => {
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
