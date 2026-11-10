import type { SearchEngineId } from "../types";
import { isLikelyUrl, toAbsoluteUrl } from "./utils";

export interface SearchProvider {
  id: SearchEngineId;
  label: string;
  /** `{q}` is replaced with the URL encoded query. */
  urlTemplate: string;
  color: string;
  keywords: string[];
}

export const SEARCH_PROVIDERS: SearchProvider[] = [
  {
    id: "google",
    label: "Google",
    urlTemplate: "https://www.google.com/search?q={q}",
    color: "#4285f4",
    keywords: ["g", "goog"],
  },
  {
    id: "duckduckgo",
    label: "DuckDuckGo",
    urlTemplate: "https://duckduckgo.com/?q={q}",
    color: "#de5833",
    keywords: ["ddg", "duck"],
  },
  {
    id: "bing",
    label: "Bing",
    urlTemplate: "https://www.bing.com/search?q={q}",
    color: "#0f7ebf",
    keywords: ["b"],
  },
  {
    id: "youtube",
    label: "YouTube",
    urlTemplate: "https://www.youtube.com/results?search_query={q}",
    color: "#ff0033",
    keywords: ["yt", "video"],
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    urlTemplate: "https://chatgpt.com/?q={q}",
    color: "#10a37f",
    keywords: ["ai", "gpt"],
  },
  {
    id: "perplexity",
    label: "Perplexity",
    urlTemplate: "https://www.perplexity.ai/search?q={q}",
    color: "#20808d",
    keywords: ["ppl", "perplex"],
  },
];

const FALLBACK_PROVIDER = SEARCH_PROVIDERS[0];

export function getProvider(id: SearchEngineId | string): SearchProvider {
  return SEARCH_PROVIDERS.find((provider) => provider.id === id) ?? FALLBACK_PROVIDER;
}

/** Builds a fully encoded search URL for the given provider. */
export function buildSearchUrl(id: SearchEngineId | string, query: string): string {
  const provider = getProvider(id);
  const encoded = encodeURIComponent(query.trim());
  return provider.urlTemplate.replace("{q}", encoded);
}

/**
 * Returns a navigable URL when the user typed something that looks like a
 * site address, otherwise `null` so the query is sent to the search engine.
 */
export function buildDirectUrl(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed || !isLikelyUrl(trimmed)) return null;
  return toAbsoluteUrl(trimmed);
}

/** Inline SVG favicon for a provider (no network request, always renders). */
export function providerIcon(id: SearchEngineId | string): string {
  const provider = getProvider(id);
  const letter = provider.label.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="9" fill="${provider.color}"/>
<text x="16" y="22" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">${letter}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\n/g, ""))}`;
}

/** Cycles to the next provider (used by the engine dropdown). */
export function nextProviderId(id: SearchEngineId): SearchEngineId {
  const index = SEARCH_PROVIDERS.findIndex((provider) => provider.id === id);
  if (index === -1) return SEARCH_PROVIDERS[0].id;
  return SEARCH_PROVIDERS[(index + 1) % SEARCH_PROVIDERS.length].id;
}

/** Finds a provider by its shortcut keyword (e.g. "ddg"). */
export function providerForKeyword(keyword: string): SearchProvider | null {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return null;
  return (
    SEARCH_PROVIDERS.find(
      (provider) =>
        provider.keywords.includes(needle) ||
        provider.id === needle ||
        provider.label.toLowerCase() === needle,
    ) ?? null
  );
}
