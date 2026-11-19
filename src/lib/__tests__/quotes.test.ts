import { describe, expect, it } from "vitest";
import { getDailyQuoteIndex, type Quote } from "../quotes";

const quotes: Quote[] = [
  { text: "One", author: "A" },
  { text: "Two", author: "B" },
  { text: "Three", author: "C" },
  { text: "Four", author: "D" },
];

describe("daily quote selection", () => {
  it("keeps the same quote for every tab opened on the same local date", () => {
    const firstTab = getDailyQuoteIndex(quotes, new Date(2026, 10, 19, 8));
    const laterTab = getDailyQuoteIndex(quotes, new Date(2026, 10, 19, 23, 59));
    expect(laterTab).toBe(firstTab);
  });

  it("rotates the starting quote on the next day", () => {
    const today = getDailyQuoteIndex(quotes, new Date(2026, 10, 19));
    const tomorrow = getDailyQuoteIndex(quotes, new Date(2026, 10, 20));
    expect(tomorrow).toBe((today + 1) % quotes.length);
  });

  it("returns a safe zero index for an empty quote list", () => {
    expect(getDailyQuoteIndex([], new Date(2026, 10, 19))).toBe(0);
  });
});
