import { GoogleGenAI, Modality } from "@google/genai";

const overlay = document.getElementById("settings-overlay");
const settingsBtn = document.getElementById("settingsBtn");
console.log(overlay.style.display);
settingsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (overlay.style.display === "block") {
    overlay.style.display = "none";
  } else {
    overlay.style.display = "block";
  }
});

document.addEventListener("click", (e) => {
  if (!overlay.contains(e.target) && e.target !== settingsBtn) {
    overlay.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  getUserLevel();
  setUserLevel();
  const btn = document.getElementById("generateBtn");
  const status = document.getElementById("status");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    status.textContent = "Reading page...";
    const readerLevel = await getUserLevel();

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
        readerLevel: readerLevel,
      });

      if (response.success) {
        status.textContent = "Parsing article with Summarizer";
        console.log("Article title:", response.title);
        console.log("Text:", response.text);
        renderSummary(response.text);
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
async function getUserLevel() {
  try {
    const buttons = document.querySelectorAll(".level-buttons button");

    // await the promise and get the data
    const data = await chrome.storage.local.get("readerLevel");
    const savedLevel = data.readerLevel || "medium"; // default

    // update button UI
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.level === savedLevel);
    });

    return savedLevel;
  } catch (err) {
    console.error("Failed to load reader level:", err);
    return "medium";
  }
}

async function renderSummary(data) {
  if (!data) {
    console.log("No data to render");
    return;
  }
  const container = document.querySelector(".card-list");
  container.innerHTML = "";

  for (const section of data.sections) {
    const card = document.createElement("div");
    card.classList.add("card");

    const heading = document.createElement("h2");
    heading.textContent = section.heading;

    const content = document.createElement("div");
    content.textContent = section.content;

    try {
      const imageLoad = await getImages(
        `Generate relevant interesting and engaging visuals that summarize and simplify below text:${section.heading},${section.content}.Width and height of images around 200px`
      );
      if (imageLoad) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(new Blob([imageLoad]));
        card.appendChild(img);
      }
    } catch (error) {
      console.error(
        "Failed to generate image for section:",
        section.heading,
        error
      );
    }
    card.append(heading, content);
    container.appendChild(card);
  }
}

async function getImages(promptText) {
  const key = "";
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: promptText,
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const binary = atob(imageData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
  }
  return null;
}
