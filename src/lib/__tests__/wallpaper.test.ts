import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ALL_WALLPAPERS,
  getDefaultWallpaper,
  getWallpaperById,
  pickRandomWallpaper,
  resolveWallpaperUrl,
  type WallpaperEntry,
} from "../wallpaper";

const entry = (id: string): WallpaperEntry => ({
  id,
  title: id,
  src: `wallpapers/${id}.jpg`,
  source: "local",
});

describe("wallpaper library", () => {
  it("configures at least 100 wallpapers in wallpapers.js", () => {
    expect(ALL_WALLPAPERS.length).toBeGreaterThanOrEqual(100);
    const ids = new Set(ALL_WALLPAPERS.map((wallpaper) => wallpaper.id));
    expect(ids.size).toBe(ALL_WALLPAPERS.length);
  });

  it("builds all local wallpaper assets without external services", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "../../../");
    const output = mkdtempSync(join(tmpdir(), "smrititab-wallpapers-"));
    try {
      execFileSync(process.execPath, [join(root, "scripts/copy-wallpapers.mjs"), output], { cwd: tmpdir() });
      const wallpaperDir = join(output, "wallpapers");
      const files = readdirSync(wallpaperDir);
      const locals = ALL_WALLPAPERS.filter((wallpaper) => wallpaper.source === "local");
      expect(locals.length).toBeGreaterThanOrEqual(100);
      expect(files.filter((file) => /\.(?:png|svg|jpg)$/i.test(file))).toHaveLength(100);
      for (const wallpaper of locals) {
        const file = wallpaper.src.replace(/^wallpapers\//, "");
        expect(existsSync(join(wallpaperDir, file)), wallpaper.src).toBe(true);
      }
    } finally {
      rmSync(output, { recursive: true, force: true });
    }
  });

  it("has a bundled default wallpaper as the fallback", () => {
    const fallback = getDefaultWallpaper();
    expect(fallback.source).toBe("local");
    expect(getWallpaperById("does-not-exist").id).toBe(fallback.id);
    expect(getWallpaperById(ALL_WALLPAPERS[5].id).id).toBe(ALL_WALLPAPERS[5].id);
  });
});

describe("random selection", () => {
  const pool = [entry("a"), entry("b"), entry("c")];

  it("never repeats the previous wallpaper", () => {
    for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
      const picked = pickRandomWallpaper(pool, "b", () => roll);
      expect(picked.id).not.toBe("b");
    }
  });

  it("uses the injected random source", () => {
    expect(pickRandomWallpaper(pool, null, () => 0).id).toBe("a");
    expect(pickRandomWallpaper(pool, null, () => 0.999).id).toBe("c");
  });

  it("handles single-entry and empty pools", () => {
    expect(pickRandomWallpaper([entry("only")], "only").id).toBe("only");
    expect(pickRandomWallpaper([], "x").id).toBe(getDefaultWallpaper().id);
  });

  it("picks different wallpapers across consecutive rolls", () => {
    const rolls = [0.05, 0.4, 0.7, 0.95];
    let last: string | null = null;
    const seen = new Set<string>();
    for (const roll of rolls) {
      const picked = pickRandomWallpaper(ALL_WALLPAPERS, last, () => roll);
      expect(picked.id).not.toBe(last);
      seen.add(picked.id);
      last = picked.id;
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("URL resolution", () => {
  it("passes external URLs through untouched", () => {
    const external: WallpaperEntry = {
      id: "ext",
      title: "ext",
      src: "https://picsum.photos/seed/x/1600/900",
      source: "external",
    };
    expect(resolveWallpaperUrl(external, "/")).toBe(external.src);
  });

  it("joins local paths against the base URL", () => {
    expect(resolveWallpaperUrl(entry("a"), "/")).toBe("/wallpapers/a.jpg");
    expect(resolveWallpaperUrl(entry("a"), "./")).toBe("./wallpapers/a.jpg");
    expect(resolveWallpaperUrl(entry("a"), "/app")).toBe("/app/wallpapers/a.jpg");
  });
});
