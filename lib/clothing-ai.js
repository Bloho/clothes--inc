import { categories, isValidCategory } from "./categories";

const DEFAULT_VISION_MODEL = "gpt-5.5";
const DEFAULT_IMAGE_MODEL = "gpt-image-1.5";

export function isAiSorterAvailable() {
  return Boolean(getOpenAIKey());
}

export async function analyzeClothingImage({ imageUrl }) {
  if (!isAiSorterAvailable()) {
    throw new Error("OpenAI API key is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CLOTHING_MODEL || DEFAULT_VISION_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Review this wardrobe upload. Identify the single main clothing item the user is probably trying to save. Return a tight normalized bounding box around only that garment, not the person, face, hands, room, or background. If there are multiple garments, choose the most central or most visually dominant garment. Category must be one of: ${categories.join(", ")}.`,
            },
            {
              type: "input_image",
              image_url: imageUrl,
            },
          ],
        },
      ],
      reasoning: {
        effort: "low",
      },
      text: {
        format: {
          type: "json_schema",
          name: "clothing_review",
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
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              selection: {
                type: "object",
                additionalProperties: false,
                properties: {
                  x: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                  y: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                  width: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                  height: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                },
                required: ["x", "y", "width", "height"],
              },
            },
            required: ["category", "name", "brand", "color", "confidence", "selection"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw await createOpenAIError(response, "AI review failed");
  }

  const result = await response.json();
  const outputText = result.output_text || findOutputText(result.output);
  if (!outputText) throw new Error("AI review returned no result");

  const parsed = JSON.parse(outputText);
  if (!isValidCategory(parsed.category)) throw new Error("AI returned an invalid category");

  return {
    brand: parsed.brand || "",
    category: parsed.category,
    color: parsed.color || "",
    confidence: parsed.confidence || 0,
    name: parsed.name || parsed.category,
    selection: clampSelection(parsed.selection),
  };
}

export async function createCleanClothingAsset({ category, color, imageUrl, name, selection }) {
  if (!isAiSorterAvailable()) {
    throw new Error("OpenAI API key is not configured");
  }

  const prompt = [
    `Create a clean online wardrobe catalog image of only the ${color ? `${color} ` : ""}${name || category}.`,
    "Use the reference photo only to preserve the actual garment's shape, color, fabric, collar, sleeves, and visible details.",
    "Remove the person, body parts, face, room, background, props, shadows, and distractions.",
    "Center the garment alone on a pure white background, full item visible, flat catalog style, no model, no hanger unless the source garment clearly needs one.",
    "Match a minimal wardrobe grid aesthetic: natural product photo, soft edges, no text, no watermark.",
  ];

  if (selection) {
    prompt.push(
      `The garment selection box in normalized image coordinates is x=${selection.x}, y=${selection.y}, width=${selection.width}, height=${selection.height}. Focus on that region.`,
    );
  }

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
      images: [{ image_url: imageUrl }],
      prompt: prompt.join(" "),
      quality: "medium",
      size: "1024x1024",
      output_format: "png",
    }),
  });

  if (!response.ok) {
    throw await createOpenAIError(response, "AI cleanup failed");
  }

  const result = await response.json();
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("AI cleanup returned no image");

  return Buffer.from(b64, "base64");
}

function clampSelection(selection) {
  const x = clamp(Number(selection?.x) || 0);
  const y = clamp(Number(selection?.y) || 0);
  const width = clamp(Number(selection?.width) || 1);
  const height = clamp(Number(selection?.height) || 1);

  return {
    x,
    y,
    width: Math.min(width, 1 - x),
    height: Math.min(height, 1 - y),
  };
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY?.trim().replace(/^['"]|['"]$/g, "");
}

export function getSafeAIErrorMessage(error, fallback = "AI request failed") {
  if (error?.safeMessage) return error.safeMessage;
  return fallback;
}

async function createOpenAIError(response, fallback) {
  const apiError = await readOpenAIError(response);
  const error = new Error(apiError.message || fallback);
  error.status = response.status;
  error.type = apiError.type || "";
  error.code = apiError.code || "";
  error.safeMessage = getSafeOpenAIMessage(response.status, apiError, fallback);
  return error;
}

function getSafeOpenAIMessage(status, apiError, fallback) {
  if (status === 401 || apiError.code === "invalid_api_key" || apiError.type === "invalid_request_error") {
    return "OpenAI rejected the API key. Rotate the key, update OPENAI_API_KEY in Vercel without quotes or spaces, then redeploy.";
  }

  if (status === 403) {
    return "OpenAI denied this request. Check that your organization has access to the configured models.";
  }

  if (status === 429) {
    return "OpenAI rate limit or quota reached. Check billing, usage limits, and project quota.";
  }

  if (apiError.code === "model_not_found") {
    return "The configured OpenAI model is not available for this key. Check OPENAI_CLOTHING_MODEL and OPENAI_IMAGE_MODEL.";
  }

  return fallback;
}

async function readOpenAIError(response) {
  try {
    const body = await response.json();
    return body.error || {};
  } catch {
    return {};
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
