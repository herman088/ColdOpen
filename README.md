# ColdOpen
<img width="48" height="48" alt="image" src="https://github.com/user-attachments/assets/ae13ebda-ddcf-4fe9-97fd-4ec41aa9e923" />

# What it does
ColdOpen turns long-form content, wordy text content into Insight/Idea cards, capturing the main gist, while keeping users engaged. Get an overview of the content, dive deeper once you're ready! Powered by **Google Built in Prompt API**, leverage LLMS to summarize long wordy web content . Create AI generated images from curated prompts & **Google gemini flash image**, find joy in reading and learning again!

# Technology used
Built Front-end using vanilla **javascript** and basic **HTML**

Used external libraries such as **ReadibilityJS** to parse long articles and retrieve content

**Google's gemini-2.5-flash image** for image generation

**Google's built in prompt API** for summaries as well as image prompts.

Content is first parsed with external library **"ReadabilityJS"** to extract readable parts of the website. It is then parsed to **prompt API** for further processing. Utilizing examples to guide prompt API to provide topic and disciplinary relevant images. JSON schema was also used to ensure that output image prompts and summary output by API are structured and predictable, ensuring consistent flow of content in a card, yet providing insightful and fun ideas. 

# Demo Video 
[Watch here](https://youtu.be/u-2h5hzK144)

# Implementations to improve image reliability 
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
<img width="973" height="313" alt="image" src="https://github.com/user-attachments/assets/3d433ede-888a-4c2f-8dd4-bbc50d1314c5" />


# What's next
More multimodal capabilities , context aware narration etc \
Engaging quizzes or dialogues to engage with users while waiting for response and image generation \
Exporting of cards into own gallery \
Feedback generation through app and more personalized 
