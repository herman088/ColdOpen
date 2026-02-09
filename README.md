# Chrome-challenge-2025

# What it does
ColdOpen turns long-form content, wordy text content into Insight/Idea cards, capturing the main gist, while keeping users engaged. Get an overview of the content, dive deeper once you're ready! Powered by AI generated images from curated prompts, as well as AI-powered summaries, find joy in reading and learning again!

# Technology used
Built Front-end using vanilla javascript and basic HTML

Used external libraries such as ReadibilityJS to parse long articles

**Google's gemini-2.5-flash image** for image generation

**Google's built in prompt API** for summaries as well as image prompts.

Content is first parsed with external library **"ReadabilityJS"** to extract readable parts of the website. It is then parsed to **prompt API** for further processing. Utilizing multi-shot prompting and examples to guide prompt API to provide topic and disciplinary relevant images. JSON schema was also used to ensure that output image prompts and summary output by API are structured and predictable, ensuring consistent flow of content in a card, yet providing insightful and fun ideas. 

# Demo Video 
https://youtu.be/u-2h5hzK144

# Implementation to improve image reliability 
**Used** JSON schema** to ensure consistency in response object**
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

**Provided examples for LLM prompt API **
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

# What's next
More multimodal capabilities , context aware narration etc
Engaging quizzes or dialogues to engage with users while waiting for response and image generation
Exporting of cards into own gallery
Feedback generation through app and more personalized
