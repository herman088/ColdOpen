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
    setState("Reading Page....", true);
    const readerLevel = await getUserLevel();

    try {
      // returns fulfilled promise of array of "tabs" matching args,destructure and get active tab,
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url.startsWith("http")) {
        btn.disabled = false; //reset btn
        setState("Can't analyze this page (file://, chrome://, etc.)", false); //hide loader
        return;
      }
      //promise fulfilled with response object reply by content.js
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "extractArticle",
        readerLevel: readerLevel,
      });

      if (response.success) {
        setState("Parsing article with summarizer", true);
        console.log("Article title:", response.title);
        console.log("Text:", response.text);
        renderSummary(response.text);
      } else {
        btn.disabled = false; //reset btn
        setState(
          "Couldn't extract clean text. Try again or try another another page.",
          false
        ); //hide loader
      }
    } catch (error) {
      btn.disabled = false; //reset btn
      setState("Extraction faced an error.", false); //hide loader
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

  const emptyState = document.querySelector(".empty-state");
  const container = document.querySelector(".card-list");

  //if (data.sections.length > 0) {
  //emptyState.classList.add("hidden"); // hide immediately
  //}
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
    content.classList.add("contentText");
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
      emptyState.classList.add("hidden");
      card.classList.add("active");
    }
    observer.observe(card);
    console.log(
      "empty state",
      emptyState,
      emptyState.classList,
      container.children.length
    );
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

//attach listeners to saved pg nav button and home page nav button and populate saved pg when clicked, saved pg logic
async function switchViews() {
  const mainView = document.querySelector(".card-list");
  const savedView = document.querySelector(".card-list-saved");
  const savedPgBtn = document.getElementById("savedPgBtn");
  const mainPgBtn = document.getElementById("mainPgBtn");
  const emptyStateView = document.querySelector(".empty-state");
  const generateBtn = document.querySelector("#generateBtn");

  savedPgBtn.addEventListener("click", async () => {
    if (savedView.classList.contains("hidden")) {
      savedView.classList.remove("hidden");
      savedPgBtn.style.fill = "#2563eb";
      mainPgBtn.style.fill = "#4b5563";
      mainView.classList.add("hidden");
      emptyStateView.classList.add("hidden");
      generateBtn.classList.add("hidden");

      switchCardView();
      const cardsArray = await loadCards();

      const container = document.querySelector(".card-list-saved");
      //if if any new items added to storage, if storage and saved-card-list dom has changes, re-render,
      const domCardIds = Array.from(
        container.querySelectorAll(".card-grid")
      ).map((card) => card.dataset.id);
      const storageCardIds = cardsArray.map((card) => card.id);

      const isSameLength = domCardIds.length === storageCardIds.length;
      const isSameContent =
        isSameLength &&
        storageCardIds.every((id, i) => id === storageCardIds[i]);

      if (isSameContent) {
        console.log("no content change, skip re render");
        return;
      }

      if (cardsArray.length === 0) {
        container.innerHTML =
          '<div class="empty-state-saved">No saved summaries yet.</div>';
        return;
      }
      Array.from(container.children).forEach((child) => {
        if (!child.classList.contains("savedHeader")) {
          child.remove();
        }
      });
      for (const section of cardsArray) {
        //const emptyState = document.querySelector(".empty-state");
        //emptyState.style.display = "none";
        const card = document.createElement("div");
        card.classList.add("card-grid");
        card.dataset.id = section.id;

        const heading = document.createElement("h2");
        heading.textContent = section.heading;

        const content = document.createElement("div");
        content.classList.add("contentText");
        content.textContent = section.content;
        content.style.display = "none";

        const img = document.createElement("img");
        img.src = section.img;

        const saveBtn = defineSaveIconSVG("savePgBtnCard savedState");
        saveBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await deleteCard(section.id);
          const domCardDel = document.querySelectorAll(
            `.card-list-saved .card-grid[data-id="${section.id}"]`
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
    } else {
      return;
    }
  });
  mainPgBtn.addEventListener("click", async () => {
    if (mainView.classList.contains("hidden")) {
      generateBtn.classList.remove("hidden");
      const mainViewCards = mainView.querySelectorAll(".card");
      if (mainViewCards.length === 0) {
        emptyStateView.classList.remove("hidden");
      }
      revertCardView();
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

function switchCardView() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("active", entry.isIntersecting);
      });
    },
    { threshold: 0.6 }
  );

  const cardContainer = document.querySelector(".card-list-saved");
  cardContainer.addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target.closest(".savePgBtnCard")) return;
    const clickedCard = e.target.closest(".card-grid");
    //if target not card or text or img
    if (
      e.target !== clickedCard &&
      !e.target.closest("img") &&
      !e.target.closest("h2")
    )
      return;

    // card container style
    cardContainer.classList.remove("card-list-saved");
    cardContainer.classList.add("card-list-saved-expanded");

    //card style
    cardContainer.querySelectorAll(".card-grid").forEach((card) => {
      const text = card.querySelector(".contentText");
      text.style.display = "inline-block";
      card.classList.remove("card-grid");
      card.classList.add("card");
      observer.observe(card);

      const svgSaveBtn = card.querySelector("svg");

      svgSaveBtn.addEventListener("click", () => {
        const domCardDel = document.querySelectorAll(
          `.card-list-saved-expanded .card[data-id="${card.dataset.id}"]`
        );
        domCardDel.forEach((card) => card.remove());
      });
    });
    if (clickedCard) {
      clickedCard.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  });
}

//add func when user clicks main page and when user clicks "back" in expandedSaved view
function revertCardView() {
  const cardContainer = document.querySelector(".card-list-saved-expanded");
  if (cardContainer) {
    cardContainer.classList.remove("card-list-saved-expanded");
    cardContainer.classList.add("card-list-saved");

    cardContainer.querySelectorAll(".card").forEach((card) => {
      const text = card.querySelector(".contentText");
      text.style.display = "none";
      card.classList.remove("card");
      card.classList.add("card-grid");
    });
  } else {
    // could be in not expanded , grid mode
    return;
  }
}

function setState(statusMsg, showLoader) {
  const status = document.querySelector("#status");
  const statusTxt = status.querySelector("h3");
  const loader = document.querySelector(".loader");
  statusTxt.textContent = statusMsg;
  if (showLoader) {
    loader.classList.remove("hidden");
  } else {
    loader.classList.add("hidden");
  }
}
