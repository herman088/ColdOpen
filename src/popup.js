import { GoogleGenAI, Modality } from "@google/genai";

/*OVERLAY*/
const overlay = document.getElementById("settings-overlay");
const settingsBtn = document.getElementById("settingsIcon");
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

/*API KEY*/
const apiButton = document.getElementById("apiKeyBtn");
const savedText = document.getElementById("savedText");
const apiKeyInput = document.getElementById("apiKeyField");
apiKeyInput.addEventListener("input", () => {
  apiButton.style.display = "inline-block";
  savedText.style.display = "none";
});

function setAPIKey() {
  apiButton.addEventListener("click", () => {
    if (!apiKeyInput.value.trim()) {
      alert("Please enter a valid API key.");
      return;
    }
    chrome.storage.local
      .set({ apiKey: apiKeyInput.value.trim() })
      .then(() => {
        apiButton.style.display = "none";
        savedText.style.display = "inline";
        console.log("API key saved:", apiKeyInput.value.trim());
      })
      .catch((err) => console.error("Failed to save apiKey:", err));
  });
}
async function getAPIKey() {
  try {
    const result = await chrome.storage.local.get("apiKey");
    const apiKey = result.apiKey;
    if (apiKey) {
      apiButton.style.display = "none";
      savedText.style.display = "inline";
      apiKeyInput.value = apiKey;
      console.log(apiKey);
      return apiKey;
    }
    apiButton.style.display = "inline-block";
    savedText.style.display = "none";
    return;
  } catch (error) {
    console.log("Failed to get api key", error);
  }
}

/* DOM CONTENT LOAD */
document.addEventListener("DOMContentLoaded", () => {
  switchViews();
  openZoom();
  setAPIKey();
  getAPIKey();
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
          " Can't analyze this page (file://, chrome://, etc.)";
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
        status.textContent = " Couldn't extract clean text. Try another page.";
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("active", entry.isIntersecting);
      });
    },
    { threshold: 0.6 }
  );

  for (const section of data.sections) {
    const id = crypto.randomUUID();
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.id = id;

    const heading = document.createElement("h2");
    heading.textContent = section.heading;

    const content = document.createElement("div");
    content.textContent = section.content;
    const saveBtn = defineSaveIconSVG("savePgBtnCard");
    const img = document.createElement("img");
    try {
      const apiKey = await getAPIKey();
      const imageDataLoad = await getImageData(
        apiKey,
        `Generate relevant interesting and engaging visuals that summarize and simplify below text:${section.heading},${section.content}.`
      );
      if (imageDataLoad) {
        img.src = `data:image/png;base64,${imageDataLoad}`;
        card.appendChild(img);
      }
    } catch (error) {
      console.error(
        "Failed to generate image for section:",
        section.heading,
        error
      );
    }

    const cardObj = {
      id: id,
      heading: section.heading,
      content: section.content,
      img: img.src || null,
    };
    saveBtn.addEventListener("click", async () => {
      if (saveBtn.classList.contains("savedState")) {
        //remove from storage and rmv class,
        await deleteCard(cardObj.id);
        saveBtn.classList.remove("savedState");
      } else {
        await saveCard(cardObj);
        saveBtn.classList.add("savedState");
      }
    });
    card.append(heading, content, saveBtn);
    container.appendChild(card);
    if (container.children.length === 1) {
      card.classList.add("active");
    }
    observer.observe(card);
  }
}

async function getImageData(apiKey, promptText) {
  const ai = new GoogleGenAI({ apiKey: apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: promptText,
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    console.log("No image data found");
    return null;
  } catch (error) {
    console.log("Image API process error", error);
    return null;
  }
}

function openZoom() {
  const zoomableImgs = document.querySelectorAll(".card img");
  const modal = document.createElement("div");
  modal.classList.add("image-modal");
  const modalImg = document.createElement("img");
  const closeBtn = document.createElement("span");
  closeBtn.classList.add("close");
  closeBtn.innerHTML = "&times";

  modal.appendChild(closeBtn);
  modal.appendChild(modalImg);

  document.body.appendChild(modal);
  document.querySelector(".card-list").addEventListener("click", (e) => {
    if (e.target.tagName === "IMG") {
      modal.style.display = "flex";
      modalImg.src = e.target.src;
    }
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

async function saveCard(card) {
  const result = await chrome.storage.local.get("savedCards");
  const cards = result.savedCards || [];

  cards.push(card);

  chrome.storage.local
    .set({ savedCards: cards })
    .then(() => console.log("Cards saved:", card))
    .catch((err) => console.error("Failed to card:", err));
}

async function loadCards() {
  const result = await chrome.storage.local.get("savedCards");
  return result.savedCards || [];
}
async function deleteCard(cardId) {
  const result = await chrome.storage.local.get("savedCards");
  const cards = result.savedCards || [];
  const updatedCards = cards.filter((card) => card.id !== cardId);
  chrome.storage.local
    .set({ savedCards: updatedCards })
    .then(() => console.log(`Card ${cardId} deleted`))
    .catch((err) => console.error("Failed to delete card:", err));
}

//attach listeners to saved pg nav button and home page nav button and populate saved pg when clicked
async function switchViews() {
  const mainView = document.querySelector(".card-list");
  const savedView = document.querySelector(".card-list-saved");
  const savedPgBtn = document.getElementById("savedPgBtn");
  const mainPgBtn = document.getElementById("mainPgBtn");
  savedPgBtn.addEventListener("click", async () => {
    if (savedView.classList.contains("hidden")) {
      //retrieve from local storage

      const cardsArray = await loadCards();
      const container = document.querySelector(".card-list-saved");
      container.innerHTML = "";

      if (cardsArray.length === 0) {
        container.innerHTML =
          '<div class="empty-state">No saved summaries yet.</div>';
        return;
      }

      for (const section of cardsArray) {
        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.id = section.id;

        const heading = document.createElement("h2");
        heading.textContent = section.heading;

        const content = document.createElement("div");
        content.textContent = section.content;

        const img = document.createElement("img");
        img.src = section.img;

        const saveBtn = defineSaveIconSVG("savePgBtnCard savedState");
        saveBtn.addEventListener("click", async () => {
          await deleteCard(section.id);
          const domCardDel = document.querySelectorAll(
            `.card-list-saved .card[data-id="${section.id}"]`
          );
          domCardDel.forEach((card) => card.remove());
          //change class to remove savedState from main page
          const cardClassMain = document.querySelectorAll(
            `.card-list .card[data-id="${section.id}"]`
          );
          cardClassMain.forEach((card) => {
            const svgChild = card.querySelector("svg");
            if (svgChild) {
              svgChild.classList.remove("savedState");
            }
          });
        });

        card.append(img, heading, content, saveBtn);
        container.appendChild(card);
      }
      savedView.classList.remove("hidden");
      savedPgBtn.style.fill = "#2563eb";
      mainPgBtn.style.fill = "#4b5563";
      mainView.classList.add("hidden");
    } else {
      return;
    }
  });
  mainPgBtn.addEventListener("click", async () => {
    if (mainView.classList.contains("hidden")) {
      mainView.classList.remove("hidden");
      savedView.classList.add("hidden");
      mainPgBtn.style.fill = "#2563eb";
      savedPgBtn.style.fill = "#4b5563";
    } else {
      return;
    }
  });
}

function defineSaveIconSVG(classNm) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", classNm);
  svg.setAttribute("width", 200);
  svg.setAttribute("height", 200);
  svg.setAttribute("viewBox", "0 0 16 16");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute(
    "d",
    "M3.75 2a.75.75 0 0 0-.75.75v10.5a.75.75 0 0 0 1.28.53L8 10.06l3.72 3.72a.75.75 0 0 0 1.28-.53V2.75a.75.75 0 0 0-.75-.75z"
  );
  svg.appendChild(path);

  return svg;
}
