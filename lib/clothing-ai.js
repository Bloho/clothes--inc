import { categories, isValidCategory } from "./categories";

const DEFAULT_VISION_MODEL = "gemini-2.5-flash";

export function isAiSorterAvailable() {
  return Boolean(getGeminiKey());
}

export async function analyzeClothingImage({ imageUrl }) {
  if (!isAiSorterAvailable()) {
    throw new Error("Gemini API key is not configured");
  }

  const prompt = `Review this wardrobe upload. Identify the single main clothing item the user is probably trying to save. Return a tight normalized bounding box around only that garment, not the person, face, hands, room, or background. If there are multiple garments, choose the most central or most visually dominant garment. Category must be one of: ${categories.join(", ")}.

Respond ONLY with a valid JSON object in this exact format, no markdown, no explanation:
{
  "category": "<one of the allowed categories>",
  "name": "<descriptive name of the item>",
  "brand": "<brand if visible, else empty string>",
  "color": "<primary color>",
  "confidence": <number 0-1>,
  "selection": {
    "x": <number 0-1>,
    "y": <number 0-1>,
    "width": <number 0-1>,
    "height": <number 0-1>
  }
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_CLOTHING_MODEL || DEFAULT_VISION_MODEL}:generateContent?key=${getGeminiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { image_url: { url: imageUrl } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    }
  );

  if (!response.ok) {
    throw await createGeminiError(response, "AI review failed");
  }

  const result = await response.json();
  const outputText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!outputText) throw new Error("AI review returned no result");

  let parsed;
  try {
    const clean = outputText.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

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

export async function createCleanClothingAsset({ imageUrl, selection }) {
  if (!getRemoveBgKey()) {
    throw new Error("REMOVE_BG_API_KEY is not configured");
  }

  // Convert normalized bounding box to remove.bg roi format: "x1% y1% x2% y2%"
  let roi = undefined;
  if (selection) {
    const x1 = Math.round(selection.x * 100);
    const y1 = Math.round(selection.y * 100);
    const x2 = Math.round((selection.x + selection.width) * 100);
    const y2 = Math.round((selection.y + selection.height) * 100);
    roi = `${x1}% ${y1}% ${x2}% ${y2}%`;
  }

  const formData = new FormData();
  formData.append("image_url", imageUrl);
  formData.append("size", "auto");
  formData.append("format", "png");
  formData.append("bg_color", "ffffff"); // white background
  formData.append("scale", "fit");
  formData.append("position", "center");
  if (roi) formData.append("roi", roi);

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": getRemoveBgKey() },
    body: formData,
  });

  if (!response.ok) {
    const error = new Error("Background removal failed");
    error.status = response.status;
    error.safeMessage = getSafeRemoveBgMessage(response.status);
    throw error;
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
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

function getGeminiKey() {
  return process.env.GEMINI_API_KEY?.trim().replace(/^['"]|['"]$/g, "");
}

function getRemoveBgKey() {
  return process.env.REMOVE_BG_API_KEY?.trim().replace(/^['"]|['"]$/g, "");
}

export function getSafeAIErrorMessage(error, fallback = "AI request failed") {
  if (error?.safeMessage) return error.safeMessage;
  return fallback;
}

async function createGeminiError(response, fallback) {
  let apiError = {};
  try {
    const body = await response.json();
    apiError = body.error || {};
  } catch {
    // ignore
  }

  const error = new Error(apiError.message || fallback);
  error.status = response.status;
  error.safeMessage = getSafeGeminiMessage(response.status, fallback);
  return error;
}

function getSafeGeminiMessage(status, fallback) {
  if (status === 400) return "Gemini rejected the request. Check that the image URL is publicly accessible.";
  if (status === 401 || status === 403) return "Gemini rejected the API key. Check GEMINI_API_KEY in your environment variables.";
  if (status === 429) return "Gemini rate limit reached. The free tier allows 15 requests per minute — try again shortly.";
  if (status === 503) return "Gemini is temporarily unavailable. Try again in a moment.";
  return fallback;
}

function getSafeRemoveBgMessage(status) {
  if (status === 402) return "Remove.bg free tier quota exhausted (50 images/month). Add credits at remove.bg or wait until next month.";
  if (status === 403) return "Remove.bg rejected the API key. Check REMOVE_BG_API_KEY in your environment variables.";
  if (status === 429) return "Remove.bg rate limit reached. Try again shortly.";
  return "Background removal failed. Try again.";
}