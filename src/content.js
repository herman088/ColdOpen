import { Readability } from "@mozilla/readability";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractArticle") {
    try {
      //clone dom
      const clonedDOM = document.cloneNode(true);
      const article = new Readability(clonedDOM).parse();

      if (article) {
        sendResponse({
          success: true,
          title: article.title,
          text: article.textContent,
        });
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
