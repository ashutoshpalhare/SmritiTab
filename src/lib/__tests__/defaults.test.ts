import { describe, expect, it } from "vitest";
import {
  DEFAULT_APPS,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  normalizeApps,
  normalizeCategories,
  normalizeClipboard,
  normalizeDock,
  normalizeFavorites,
  normalizeNotes,
  normalizeSettings,
  normalizeTodos,
  normalizeWidgets,
  normalizeWindows,
} from "../defaults";

describe("settings normalisation", () => {
  it("returns the defaults for unusable payloads", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings("nope")).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid values and replaces invalid ones", () => {
    const result = normalizeSettings({
      theme: "dark",
      wallpaper: "dune",
      searchEngine: "duckduckgo",
      clock24h: true,
      temperatureUnit: "f",
      sidebarCollapsed: "yes",
    });
    expect(result.theme).toBe("dark");
    expect(result.wallpaper).toBe("dune");
    expect(result.searchEngine).toBe("duckduckgo");
    expect(result.clock24h).toBe(true);
    expect(result.temperatureUnit).toBe("f");
    expect(result.sidebarCollapsed).toBe(DEFAULT_SETTINGS.sidebarCollapsed);
  });

  it("keeps saved accents inside the warm orange palette", () => {
    expect(normalizeSettings({ accent: "#ea580c" }).accent).toBe("#ea580c");
    expect(normalizeSettings({ accent: "#6366f1" }).accent).toBe("#f97316");
    expect(normalizeSettings({ accent: "not-a-color" }).accent).toBe("#f97316");
  });

  it("rejects unknown enum values", () => {
    const result = normalizeSettings({ theme: "neon", searchEngine: "askjeeves" });
    expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(result.searchEngine).toBe(DEFAULT_SETTINGS.searchEngine);
  });
});

describe("collection normalisation", () => {
  it("drops invalid categories and de-duplicates ids", () => {
    const categories = normalizeCategories([
      { id: "a", name: "A" },
      { id: "a", name: "Duplicate" },
      { id: "", name: "No id" },
      { name: "Missing id" },
      "not an object",
    ]);
    expect(categories).toHaveLength(1);
    expect(categories[0]).toEqual({ id: "a", name: "A", accent: "#f97316" });
  });

  it("reassigns apps of an unknown category", () => {
    const categories = normalizeCategories([{ id: "cat_1", name: "One" }]);
    const apps = normalizeApps(
      [{ id: "app_1", name: "App", target: "https://x.dev", categoryId: "gone" }],
      categories,
    );
    expect(apps[0].categoryId).toBe("cat_1");
  });

  it("removes apps without a name or target", () => {
    const categories = normalizeCategories([{ id: "cat_1", name: "One" }]);
    const apps = normalizeApps(
      [
        { id: "a", name: "", target: "https://x.dev" },
        { id: "b", name: "B", target: "" },
        { id: "c", name: "C", target: "https://x.dev" },
      ],
      categories,
    );
    expect(apps.map((app) => app.id)).toEqual(["c"]);
  });

  it("drops todos without a title and clamps priorities", () => {
    const todos = normalizeTodos([
      { id: "1", title: "Keep me", priority: "urgent" },
      { id: "2", title: "   " },
      { id: "3", title: "Also me", priority: "high", done: "yes" },
    ]);
    expect(todos).toHaveLength(2);
    expect(todos[0].priority).toBe("medium");
    expect(todos[1].priority).toBe("high");
    expect(todos[1].done).toBe(false);
  });

  it("keeps notes and favourites intact", () => {
    const notes = normalizeNotes([{ id: "n1", title: "Title", body: "Body" }]);
    expect(notes[0].body).toBe("Body");
    const favorites = normalizeFavorites([
      { id: "f1", title: "Example", url: "https://example.com" },
    ]);
    expect(favorites[0].url).toBe("https://example.com");
  });

  it("clamps widget positions into the viewport range", () => {
    const widgets = normalizeWidgets({ clock: { x: 5, y: -2, visible: true } });
    expect(widgets.clock.x).toBe(1);
    expect(widgets.clock.y).toBe(0);
  });

  it("keeps only known dock entries", () => {
    const dock = normalizeDock(
      { appIds: ["notes", "notes", "unknown-app", "todo"], size: "lg" },
      DEFAULT_APPS,
    );
    expect(dock.appIds).toEqual(["notes", "todo"]);
    expect(dock.size).toBe("lg");
  });

  it("drops windows without an app id", () => {
    const windows = normalizeWindows([
      { id: "w1", appId: "notes", x: 10, y: 10, width: 300, height: 200 },
      { id: "w2" },
    ]);
    expect(windows).toHaveLength(1);
    expect(windows[0].appId).toBe("notes");
  });

  it("caps the clipboard history", () => {
    const entries = Array.from({ length: 80 }, (_, index) => ({
      id: `c${index}`,
      text: `text ${index}`,
    }));
    expect(normalizeClipboard(entries)).toHaveLength(50);
  });

  it("falls back to the shipped seed data", () => {
    expect(normalizeCategories(null)).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(normalizeApps(undefined, DEFAULT_CATEGORIES).length).toBeGreaterThan(0);
  });
});
