import { Readability } from "@mozilla/readability";
const prompts = {
  basic: "Explain simply: short sentences, everyday words, clear examples.",
  medium:
    "Explain clearly for a general audience: include key details and define technical terms.",
  expert:
    "Explain with depth: advanced language, nuanced insights, and professional tone.",
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractArticle") {
    (async () => {
      try {
        //clone dom
        const clonedDOM = document.cloneNode(true);
        const article = new Readability(clonedDOM).parse();
        const readerLevel = request.readerLevel;
        console.log(readerLevel);
        if (article) {
          const summarizedText = await initPromptAPI(
            article.textContent,
            prompts[readerLevel]
          );
          if (summarizedText) {
            sendResponse({
              success: true,
              title: article.title,
              text: summarizedText,
            });
            console.log("OI", summarizedText, prompts[readerLevel]);
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
    })();
    return true;
  }
});
/*
async function initSummarizerAPI(parsedArticle, readerLevelPrompt) {
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
*/
const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          content: { type: "string" },
        },
        required: ["heading", "content"],
      },
    },
  },
  required: ["title", "sections"],
};
async function initPromptAPI(parsedArticle, readingLevel) {
  try {
    const availability = await LanguageModel.availability();

    console.log("AI availability :", availability);

    if (availability === "available") {
      const session = await LanguageModel.create();

      // Prompt the model and wait for the whole result to come back.
      const result = await session.prompt(
        `Summarize ${parsedArticle} into main points, with each main point giving relevant information of maximum 60words.${readingLevel}.Keep it to max 3 main points/sections`,
        {
          responseConstraint: schema,
        }
      );
      console.log(JSON.parse(result));
      return JSON.parse(result);
    } else {
      alert("PROMPT API NOT READY/AVAILABLE");
      return;
    }
  } catch (error) {
    console.error("AI Error:", error);
    return;
  }
}
