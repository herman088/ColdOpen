# ColdOpen
<img width="48" height="48" alt="image" src="https://github.com/user-attachments/assets/ae13ebda-ddcf-4fe9-97fd-4ec41aa9e923" />

## What it does
ColdOpen turns long-form content, wordy text content into Insight/Idea cards, capturing the main gist, while keeping users engaged. Get an overview of the content, dive deeper once you're ready! Powered by **Google Built in Prompt API**, leverage LLMS to summarize long wordy web content . Create AI generated images from curated prompts & **Google gemini flash image**, find joy in reading and learning again!

## Technology used
Built Front-end using vanilla **javascript** and basic **HTML**

Used external libraries such as **ReadibilityJS** to parse long articles and retrieve content

**Google's gemini-2.5-flash image** for image generation

**Google's built in prompt API** for summaries as well as image prompts.

Content is first parsed with external library **"ReadabilityJS"** to extract readable parts of the website. It is then parsed to **prompt API** for further processing. Utilizing examples to guide prompt API to provide topic and disciplinary relevant images. JSON schema was also used to ensure that output image prompts and summary output by API are structured and predictable, ensuring consistent flow of content in a card, yet providing insightful and fun ideas. 

## Demo Video 
[Watch here](https://youtu.be/u-2h5hzK144)

## Implementations to improve image reliability 
**Used JSON schema to ensure consistency in response object** 
```
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
```


**Provided examples for LLM prompt API** 
```
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
```

**Example response generated by LLM as input for image generation** 
LLM determines content type, and respective relevant visual type based on card content
 + **First example**
    + <img width="240" height="502" alt="img1" src="https://github.com/user-attachments/assets/e9400348-b791-49b5-a690-a23af8735f3e" />
    + <img width="335" height="320" alt="zoom1" src="https://github.com/user-attachments/assets/7cba6b05-4bb5-4673-adc4-e8d316b29826" />
    + <img width="534" height="111" alt="json1" src="https://github.com/user-attachments/assets/671f6885-cde8-4e12-8dcd-6c99905ea02c" />
 + **Second example**
    + <img width="288" height="524" alt="img2" src="https://github.com/user-attachments/assets/d94e2e97-7931-4024-9714-9440790b787b" />
    + <img width="361" height="353" alt="zoom2" src="https://github.com/user-attachments/assets/d919c57b-4e3e-4e5f-8ea6-fa5e458a56a2" />
    + <img width="537" height="101" alt="json2" src="https://github.com/user-attachments/assets/b9f65d72-e241-4725-8ba9-61fd27593471" />
 + **Third example**
    + <img width="275" height="470" alt="img3" src="https://github.com/user-attachments/assets/5880e79f-8633-4fc7-a723-b16d5bf44ba4" />
    + <img width="275" height="470" alt="zoom3" src="https://github.com/user-attachments/assets/23a2a436-1b96-4fa6-b976-cbd18e096ac5" />
    + <img width="536" height="99" alt="json3" src="https://github.com/user-attachments/assets/039de435-1b62-4939-9e09-c2a922ecdf01" />
 + **Fourth example**
    + <img width="245" height="440" alt="img4" src="https://github.com/user-attachments/assets/4b147cef-6f09-4cf7-ab91-f9afc97755ca" />
    + <img width="334" height="336" alt="zoom4" src="https://github.com/user-attachments/assets/71e37c3d-ab74-4f26-9287-e5994aeb1131" />
    + <img width="538" height="101" alt="json4" src="https://github.com/user-attachments/assets/9a805cc0-a737-474f-a99d-b9451196bfb8" />





# What's next
More multimodal capabilities , context aware narration etc \
Engaging quizzes or dialogues to engage with users while waiting for response and image generation \
Exporting of cards into own gallery \
Feedback generation through app and more personalized 
