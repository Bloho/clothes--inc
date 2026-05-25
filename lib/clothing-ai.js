import { categories, isValidCategory } from "./categories";

const DEFAULT_MODEL = "gpt-5.4-mini";

export function isAiSorterAvailable() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function classifyClothingImage({ buffer, mimeType }) {
  if (!isAiSorterAvailable()) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CLOTHING_MODEL || DEFAULT_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Classify this clothing image for an online wardrobe. Return one category from this list only: ${categories.join(", ")}. Also infer a concise item name, a brand if visible, and the dominant color.`,
            },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${buffer.toString("base64")}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "clothing_upload",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: {
                type: "string",
                enum: categories,
              },
              name: {
                type: "string",
              },
              brand: {
                type: "string",
              },
              color: {
                type: "string",
              },
            },
            required: ["category", "name", "brand", "color"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  const outputText = result.output_text || findOutputText(result.output);
  if (!outputText) return null;

  try {
    const parsed = JSON.parse(outputText);
    if (!isValidCategory(parsed.category)) return null;

    return {
      category: parsed.category,
      name: parsed.name || "",
      brand: parsed.brand || "",
      color: parsed.color || "",
    };
  } catch {
    return null;
  }
}

function findOutputText(output) {
  if (!Array.isArray(output)) return "";

  for (const item of output) {
    if (!Array.isArray(item.content)) continue;

    for (const content of item.content) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}
