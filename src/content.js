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
          primaryTopic: {
            type: "string",
            enum: [
              "biology",
              "chemistry",
              "physics",
              "mathematics",
              "computer-science",
              "technology",
              "history",
              "geography",
              "business-finance",
              "other",
            ],
          },
          contentType: {
            type: "string",
            enum: [
              "parts-and-structure",
              "step-by-step-process",
              "cause-and-effect",
              "comparison",
              "chronological-sequence",
              "statistics-and-numbers",
              "mathematical-proof",
              "worked-example",
              "abstract-concept",
              "definition",
            ],
          },
          visualType: {
            type: "string",
            enum: [
              "scientific-diagram", // Biology/Chemistry structures
              "process-flowchart", // Any step-by-step process
              "technical-diagram", // Physics/CS structures
              "mathematical-diagram", // Math geometry/proofs
              "data-chart", // Bar/pie charts for statistics
              "coordinate-graph", // Math functions, physics graphs
              "timeline", // Historical sequences
              "realistic-illustration", // Historical scenes, realistic images
              "conceptual-illustration", // Abstract concepts, definitions
              "comparison-table", // Side-by-side comparisons
              "map", // Geography, historical territories
              "infographic", // Business processes, modern layouts
            ],
          },
          promptForImageGeneration: { type: "string" },
        },
        required: [
          "heading",
          "content",
          "primaryTopic",
          "contentType",
          "visualType",
          "promptForImageGeneration",
        ],
      },
    },
  },
  required: ["title", "sections"],
};

async function initPromptAPI(parsedArticle, readingLevel) {
  const prompt = `Summarize this article into  sections.Each section maximum 60words. Reading Level:${readingLevel}.
Article:${parsedArticle}.

Return data with title, summary and sections. In each section, include relevant heading , summarized content for that section.Determine primary Topic, content Type,visual Type and prompt For ImageGeneration.

Here are some guides for each visual types to use with respect to its use case
- scientific-diagram: Molecular structures, anatomical diagrams, chemical reactions with detailed labels
- process-flowchart: Sequential workflows, decision trees, algorithms with directional flow
- technical-diagram:  Engineering schematics, system architectures, circuit designs, network topologies
- mathematical-diagram:  Geometric proofs, theorems, equation visualizations, set diagrams
- data-chart: Statistical visualizations (bar, pie, line charts) for comparing quantities
- coordinate-graph: Plotted functions, physics motion graphs, data points on axes
- timeline:  Chronological events, project milestones, historical progressions
- realistic-illustration: Lifelike scenes, historical events, detailed representational art
- conceptual-illustration: Abstract ideas, metaphors, simplified explanations of concepts
- comparison-table: Feature matrices, pros/cons lists, side-by-side specifications
- map:  Geographic locations, territorial boundaries, spatial layouts, regional data
- infographic: Visual summaries combining text, data, and graphics for storytelling
     
EXAMPLES:
{
  "heading": "Cell Membrane Structure",
  "content": "Cell membrane consists of phospholipid bilayer with embedded proteins and cholesterol controlling selective permeability.",
  "primaryTopic": "biology",
  "contentType": "parts-and-structure",
  "visualType": "scientific-diagram",
  "promptForImageGeneration": "labeled cross-section of cell membrane showing phospholipid bilayer, embedded proteins, cholesterol molecules, color-coded layers, educational biology illustration style"
}

{
  "heading": "Force Problem",
  "content": "5kg box pushed with 20N force. Using F=ma, acceleration equals 4 m/s² in direction of applied force.",
  "primaryTopic": "physics",
  "contentType": "worked-example",
  "visualType": "technical-diagram",
  "promptForImageGeneration": "diagram showing 5kg box with 20N force arrow, acceleration vector labeled 4 m/s², F=ma equation displayed, clean physics problem illustration with grid background"
}

{
  "heading": "Function Graph",
  "content": "Function y = x² creates U-shaped parabola with vertex at origin, symmetric about y-axis, opening upward.",
  "primaryTopic": "mathematics",
  "contentType": "parts-and-structure",
  "visualType": "coordinate-graph",
  "promptForImageGeneration": "parabola y=x² graphed on coordinate plane with vertex at origin labeled, axis of symmetry shown, key points marked, clean math graph with grid"
}

{
  "heading": "World War II Events",
  "content": "1939: War begins. 1941: Pearl Harbor. 1944: D-Day invasion. 1945: Atomic bombs, Japan surrenders, war ends.",
  "primaryTopic": "history",
  "contentType": "chronological-sequence",
  "visualType": "timeline",
  "promptForImageGeneration": "horizontal timeline spanning 1939-1945 with major WWII events marked at key dates, small historical icons, clear year labels, educational history style"
}

{
  "heading": "Market Share",
  "content": "Company A: 45%, Company B: 30%, Company C: 25% market distribution. Leader increased from 40% last quarter.",
  "primaryTopic": "business-finance",
  "contentType": "statistics-and-numbers",
  "visualType": "data-chart",
  "promptForImageGeneration": "pie chart showing market share percentages with company labels A, B, C, color-coded segments, clean modern business presentation style with legend"
}


`;
  try {
    const availability = await LanguageModel.availability();

    console.log("AI availability :", availability);

    if (availability === "available") {
      const session = await LanguageModel.create();

      // Prompt the model and wait for the whole result to come back.
      const result = await session.prompt(prompt, {
        responseConstraint: schema,
      });
      console.log(JSON.parse(result));
      console.log(
        `${session.inputUsage} tokens used, out of ${session.inputQuota} tokens available.`
      );
      session.destroy();
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
