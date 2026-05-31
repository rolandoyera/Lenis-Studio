"use server";

import { withProtocol } from "../app/(main)/dashboard/library/_components/library-constants";

export interface AutofillResult {
  success: boolean;
  error?: string;
  data?: {
    name: string;
    sku?: string;
    category?: string;
    description?: string;
    finishColor?: string;
    manufacturer?: string;
    materials?: string;
    dimensions?: string;
    msrp?: number;
    imageUrls?: string[];
    confidence?: Record<string, number>;
    rawExtraction?: string;
  };
}

/**
 * Server Action: Scrapes a product webpage via Jina Reader and passes the cleaned
 * markdown to Gemini 2.5 Flash-Lite. Returns structured, verified JSON content
 * alongside confidence ratings and a raw snapshot of the page contents.
 */
export async function autofillProductFromUrl(url: string): Promise<AutofillResult> {
  try {
    if (!url || url.trim() === "") {
      return { success: false, error: "Please enter a valid product web link." };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY is not defined. Please add it to your apps/dashboard/.env.local file.",
      };
    }

    const normalizedUrl = withProtocol(url.trim());
    console.log(`[AI Autofill] Starting scraping via Jina Reader for: ${normalizedUrl}`);

    // 1. Fetch the raw page contents converted to clean Markdown via Jina Reader
    const jinaHeaders: Record<string, string> = {};
    if (process.env.JINA_API_KEY) {
      jinaHeaders.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
    }

    const jinaRes = await fetch(`https://r.jina.ai/${normalizedUrl}`, {
      headers: jinaHeaders,
      next: { revalidate: 0 }, // Prevent Next.js from caching pages so it grabs fresh pricing
      signal: AbortSignal.timeout(20000), // 20 seconds timeout to prevent infinite hanging
    });

    if (!jinaRes.ok) {
      console.error(`[AI Autofill] Jina Reader failed with status ${jinaRes.status}`);
      return {
        success: false,
        error: `Could not reach the website via AI Scraper (Jina Reader status: ${jinaRes.status}).`,
      };
    }

    const markdownText = await jinaRes.text();
    if (!markdownText || markdownText.trim() === "") {
      console.error(`[AI Autofill] Jina Reader returned empty markdown`);
      return { success: false, error: "The scraper was unable to read any content from that webpage." };
    }

    // Intercept Jina Reader upstream block/HTTP errors hidden in successful text responses
    if (markdownText.includes("Warning: Target URL returned error")) {
      const errorLine =
        markdownText.split("\n").find((line) => line.includes("Warning: Target URL returned error")) || "";
      console.error(`[AI Autofill] Jina Reader scraped a target site error: ${errorLine}`);

      let friendlyError = "The AI scraper was blocked or could not read this website. Please input specs manually.";
      if (errorLine.includes("403")) {
        friendlyError =
          "This website is protected against AI scrapers (403 Forbidden). Please input specifications manually.";
      } else if (errorLine.includes("404")) {
        friendlyError = "This product page was not found (404 Not Found). Please verify the link.";
      } else if (errorLine.includes("503") || errorLine.includes("502")) {
        friendlyError =
          "The website's server is temporarily unavailable. Please try again later or type details manually.";
      }

      return { success: false, error: friendlyError };
    }

    console.log(`[AI Autofill] Scraped Markdown successfully. Length: ${markdownText.length} characters.`);

    // 2. High-Density Payload Extraction (Multi-Strategy Image URL Crawler)
    const candidateImages: string[] = [];
    let match: RegExpExecArray | null;

    // Strategy A: Standard markdown images `![Alt text](url)`
    const mdImgRegex = /!\[.*?\]\((https?:\/\/[^)\s]+)\)/gi;
    match = mdImgRegex.exec(markdownText);
    while (match !== null) {
      const src = match[1].trim();
      if (src && !candidateImages.includes(src)) {
        candidateImages.push(src);
      }
      match = mdImgRegex.exec(markdownText);
    }

    // Strategy B: Raw HTML `<img>` tag sources if present
    const htmlImgRegex = /<img\s+[^>]*src=["'](https?:\/\/[^"']+)["']/gi;
    match = htmlImgRegex.exec(markdownText);
    while (match !== null) {
      const src = match[1].trim();
      if (src && !candidateImages.includes(src)) {
        candidateImages.push(src);
      }
      match = htmlImgRegex.exec(markdownText);
    }

    // Strategy C: Markdown links containing image keywords or standard extensions `[Alt text](url)`
    const mdLinkRegex = /\[.*?\]\((https?:\/\/[^)\s]+)\)/gi;
    const imgExtensionOrPathPattern = /\.(jpg|jpeg|png|webp|gif|svg|tiff)(\?.*)?$/i;
    const imageKeywordPattern = /image|product|asset|media|photo|picture|thumb/i;
    match = mdLinkRegex.exec(markdownText);
    while (match !== null) {
      const src = match[1].trim();
      if (src && !candidateImages.includes(src)) {
        if (imgExtensionOrPathPattern.test(src) || imageKeywordPattern.test(src)) {
          candidateImages.push(src);
        }
      }
      match = mdLinkRegex.exec(markdownText);
    }

    // Strategy D: Raw absolute URLs in the text ending with classic image extensions (with optional queries)
    const rawUrlRegex = /(https?:\/\/[^\s"'<>()]+?\.(?:jpg|jpeg|png|webp|gif|svg)(?:\?[^\s"'<>()]*)?)/gi;
    match = rawUrlRegex.exec(markdownText);
    while (match !== null) {
      const src = match[1].trim();
      if (src && !candidateImages.includes(src)) {
        candidateImages.push(src);
      }
      match = rawUrlRegex.exec(markdownText);
    }

    // Backend Image Filtering: exclude obvious junk, tracker pixels, and icons
    const junkPatterns =
      /logo|icon|avatar|sprite|banner|pixel|social|facebook|instagram|pinterest|twitter|linkedin|tracker|nav|footer|header|loading|\.svg|\.gif|analytics|checkout|cart/i;
    const filteredImages = candidateImages.filter((src) => !junkPatterns.test(src)).slice(0, 15);
    console.log(`[AI Autofill] Filtered image candidates count: ${filteredImages.length}`, filteredImages);

    // Limit markdown length to 80,000 characters to ensure we capture price blocks and images at the bottom of long pages
    const optimizedMarkdown = markdownText.substring(0, 80000);

    // 3. Formulate Query to Gemini 2.5 Flash with Strict JSON Response Schema
    console.log(`[AI Autofill] Sending optimized markdown to Gemini 2.5 Flash...`);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an expert product data extractor. Parse the product page details below, which is a Markdown snapshot of an e-commerce website. Extract the exact product specifications to populate a library item form.

URL: ${normalizedUrl}
Page Content:
${optimizedMarkdown}

Candidate Images found on the page:
${JSON.stringify(filteredImages)}

Extract the following specifications and return them in the requested JSON structure. If a field cannot be found, use an empty string or omit it.
Specifically:
- name: The clean, brief product name/title (e.g. "Carey Accent Chair").
- category: Match the product to one of these exact categories: "Appliances", "Art & Decor", "Building Materials", "Doors & Windows", "Equipment", "Fabrics & Rugs", "Finishes", "Fixtures", "Furniture", "Hardware", "Landscaping", "Lighting", "Services", "Surfaces". Choose the single closest match.
- description: A clean public description of the product.
- finishColor: The finish, color, or upholstery (e.g. "Honed Natural", "Boucle Cream").
- manufacturer: The brand or manufacturer (e.g. "Crate & Barrel").
- materials: The material composition (e.g. "Solid Oak, Boucle Fabric").
- dimensions: The dimensions (e.g. "32" W x 34" D x 30" H").
- msrp: The retail price/selling price listed on the page. Parse as a clean float number (e.g. 1299.00). Do not include currency symbols.
- sku: The model number, article number, model name, or inventory SKU of the product if listed (e.g. "42801140").
- imageUrls: Select the top 1 to 4 highest-quality direct product image URLs strictly from the provided 'Candidate Images' array. If the candidate list is empty, you may extract valid absolute product image URLs directly from the page content. CRITICAL: You must NEVER under any circumstances return base64-encoded image data URLs (e.g. data:image/jpeg;base64,...). Only return absolute HTTP or HTTPS URLs.
- confidence: An object with keys matching each of the parsed text/numeric fields above (name, sku, category, description, finishColor, manufacturer, materials, dimensions, msrp, imageUrls). For each field, return a float confidence value between 0.0 (completely uncertain) and 1.0 (absolutely certain) based on how clearly and unambiguously the information was stated in the page content.

CRITICAL: You MUST return 100% valid JSON. Do not include raw unescaped newlines or raw unescaped double quotes inside your string properties. All double quotes inside text properties must be escaped as \\" and all literal linebreaks must be escaped as \\n.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              sku: { type: "STRING" },
              category: { type: "STRING" },
              description: { type: "STRING" },
              finishColor: { type: "STRING" },
              manufacturer: { type: "STRING" },
              materials: { type: "STRING" },
              dimensions: { type: "STRING" },
              msrp: { type: "NUMBER" },
              imageUrls: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              confidence: {
                type: "OBJECT",
                properties: {
                  name: { type: "NUMBER" },
                  sku: { type: "NUMBER" },
                  category: { type: "NUMBER" },
                  description: { type: "NUMBER" },
                  finishColor: { type: "NUMBER" },
                  manufacturer: { type: "NUMBER" },
                  materials: { type: "NUMBER" },
                  dimensions: { type: "NUMBER" },
                  msrp: { type: "NUMBER" },
                  imageUrls: { type: "NUMBER" },
                },
                required: ["name"],
              },
            },
            required: ["name", "confidence"],
          },
        },
      }),
      signal: AbortSignal.timeout(45000), // 45 seconds timeout to prevent infinite hanging under load
    });
    console.log(`[AI Autofill] Gemini response received with status: ${geminiRes.status}`);

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API Error:", errorText);
      return { success: false, error: "The Gemini AI model failed to extract product data from the scraped webpage." };
    }

    const geminiJson = await geminiRes.json();
    const parsedText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!parsedText) {
      return { success: false, error: "The AI model returned an empty response. Product could not be parsed." };
    }

    const data = parseGeminiJson(parsedText);
    console.log(`[AI Autofill] Gemini response successfully parsed! Data:`, data);

    // Append the raw Markdown snapshot of Jina Reader for tracing and debugging purposes
    return {
      success: true,
      data: {
        ...data,
        rawExtraction: optimizedMarkdown,
      },
    };
  } catch (error: unknown) {
    console.error("Autofill Server Action Error:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return {
        success: false,
        error: "AI scraping timed out. The website is taking too long to respond. Please try again.",
      };
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage || "An unexpected error occurred during AI autofill." };
  }
}

/**
 * Resilient, self-healing JSON parser that strips markdown wrappers,
 * escapes raw newlines/tabs inside JSON string properties, and
 * removes trailing commas to ensure successful parsing.
 */
function parseGeminiJson(rawText: string): any {
  let text = rawText.trim();

  // 1. Strip markdown code block wrapper if present
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  text = text.trim();

  try {
    return JSON.parse(text);
  } catch (firstError) {
    console.warn("[AI Autofill] Initial JSON.parse failed. Attempting self-healing cleanup...", firstError);

    try {
      // 2. Self-healing: Escape raw newlines, carriage returns, and tabs in string values
      let cleaned = text.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_match, p1) => {
        return `"${p1.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`;
      });

      // 3. Self-healing: Remove trailing commas in arrays/objects which violate JSON standard
      cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error("[AI Autofill] Both JSON parsing attempts failed.", secondError);
      throw new Error("The AI returned formatted data that could not be parsed as clean JSON. Please try again.");
    }
  }
}
