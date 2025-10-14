import { Readability } from "@mozilla/readability";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractArticle") {
    try {
      //clone dom
      const clonedDOM = document.cloneNode(true);
      const article = new Readability(clonedDOM).parse();

      if (article) {
        const summarizedText = initPromptAPI(article.textContent);
        if (summarizedText) {
          sendResponse({
            success: true,
            title: article.title,
            text: summarizedText,
          });
        } else {
          console.log("Summary API failed");
        }
      } else {
        sendResponse({
          success: false,
          title: document.title,
          text: document.body.innerText || "",
        });
      }
    } catch (error) {
      console.log("Error", error);
      sendResponse({
        success: false,
        error: error.message,
        title: document.title,
        text: "",
      });
    }
  }
  return true;
});

async function initSummarizerAPI(parsedArticle) {
  const options = {
    sharedContext: "This is a educational article",
    type: "key-points",
    format: "markdown",
    length: "long",
  };
  const availability = await Summarizer.availability();
  console.log("Ai availability:", availability);

  if (availability === "available") {
    const summarizer = await Summarizer.create(options);
    const summary = await summarizer.summarize(parsedArticle);
    console.log(summary);
    return summary;
  } else {
    alert("API NOT READY/AVAILABLE");
    return;
  }
}

async function initPromptAPI(parsedArticle) {
  try {
    const availability = await LanguageModel.availability();

    console.log("AI availability :", availability);

    if (availability === "available") {
      const session = await LanguageModel.create();

      // Prompt the model and wait for the whole result to come back.
      const result = await session.prompt(
        `Summarize ${parsedArticle} in bullet points, categorize each main idea in each bullet point, with each bullet point giving some relevant information less than 100 words`
      );
      console.log(result);
    } else {
      alert("API NOT READY/AVAILABLE");
      return;
    }
  } catch (error) {
    console.error("AI Error:", error);
    return;
  }
}
