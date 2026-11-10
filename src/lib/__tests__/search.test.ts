import { describe, expect, it } from "vitest";
import {
  SEARCH_PROVIDERS,
  buildDirectUrl,
  buildSearchUrl,
  getProvider,
  nextProviderId,
  providerForKeyword,
  providerIcon,
} from "../search";

describe("search providers", () => {
  it("exposes the six supported engines", () => {
    expect(SEARCH_PROVIDERS.map((provider) => provider.id)).toEqual([
      "google",
      "duckduckgo",
      "bing",
      "youtube",
      "chatgpt",
      "perplexity",
    ]);
  });

  it("builds a valid URL for every provider", () => {
    for (const provider of SEARCH_PROVIDERS) {
      const url = buildSearchUrl(provider.id, "hello world");
      expect(url.startsWith("https://")).toBe(true);
      expect(url).toContain("hello%20world");
      expect(url).not.toContain(" ");
      expect(() => new URL(url)).not.toThrow();
    }
  });

  it("encodes reserved characters", () => {
    const url = buildSearchUrl("google", "a&b=c?d #e");
    expect(url).toContain("a%26b%3Dc%3Fd%20%23e");
    expect(() => new URL(url)).not.toThrow();
  });

  it("keeps the query parameter name of each engine", () => {
    expect(buildSearchUrl("youtube", "cats")).toBe(
      "https://www.youtube.com/results?search_query=cats",
    );
    expect(buildSearchUrl("duckduckgo", "cats")).toBe(
      "https://duckduckgo.com/?q=cats",
    );
    expect(buildSearchUrl("perplexity", "cats")).toBe(
      "https://www.perplexity.ai/search?q=cats",
    );
  });

  it("falls back to the default engine for unknown ids", () => {
    expect(getProvider("nope").id).toBe("google");
    expect(buildSearchUrl("nope", "x")).toContain("google.com");
  });

  it("cycles through providers", () => {
    expect(nextProviderId("google")).toBe("duckduckgo");
    expect(nextProviderId("perplexity")).toBe("google");
  });

  it("resolves providers by keyword", () => {
    expect(providerForKeyword("ddg")?.id).toBe("duckduckgo");
    expect(providerForKeyword("yt")?.id).toBe("youtube");
    expect(providerForKeyword("unknown")).toBeNull();
  });

  it("renders an inline favicon so no network request is needed", () => {
    const icon = providerIcon("google");
    expect(icon.startsWith("data:image/svg+xml")).toBe(true);
    expect(icon).not.toContain(" ");
  });
});

describe("direct navigation", () => {
  it("recognises addresses", () => {
    expect(buildDirectUrl("example.com")).toBe("https://example.com");
    expect(buildDirectUrl("https://example.com/path?x=1")).toBe(
      "https://example.com/path?x=1",
    );
    expect(buildDirectUrl("localhost:3000")).toBe("https://localhost:3000");
    expect(buildDirectUrl("127.0.0.1:8080")).toBe("https://127.0.0.1:8080");
  });

  it("ignores normal search queries", () => {
    expect(buildDirectUrl("hello world")).toBeNull();
    expect(buildDirectUrl("what is the weather")).toBeNull();
    expect(buildDirectUrl("")).toBeNull();
  });
});
