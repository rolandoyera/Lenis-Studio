/**
 * Configuration limits and settings for the AI scraper and LLM extraction.
 */
export const SCRAPER_CONFIG = {
  maxCharacters: 100000,
  maxImageCandidates: 15,
  primaryModel: "gemini-3.5-flash",
  fallbackModel: "gemini-2.5-flash",
  jinaReaderUrl: "https://r.jina.ai/",
};
