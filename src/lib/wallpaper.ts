import {
  DEFAULT_WALLPAPER_ID,
  WALLPAPERS,
  type WallpaperEntry,
} from "../../wallpapers.js";

export type { WallpaperEntry };

export const ALL_WALLPAPERS: WallpaperEntry[] = WALLPAPERS;

const LAST_WALLPAPER_KEY = "smrititab:last-wallpaper-id";

let memoryLastId: string | null = null;

/** The wallpaper used when the selected one cannot be loaded. */
export function getDefaultWallpaper(): WallpaperEntry {
  return (
    WALLPAPERS.find((entry) => entry.id === DEFAULT_WALLPAPER_ID) ??
    WALLPAPERS[0] ?? {
      id: "fallback",
      title: "Fallback",
      src: "",
      source: "local",
    }
  );
}

export function getWallpaperById(id: string | null | undefined): WallpaperEntry {
  if (id) {
    const found = WALLPAPERS.find((entry) => entry.id === id);
    if (found) return found;
  }
  return getDefaultWallpaper();
}

/**
 * Picks a random wallpaper, never repeating `lastId` when the pool has more
 * than one entry. Pure and seedable for tests.
 */
export function pickRandomWallpaper(
  entries: WallpaperEntry[],
  lastId: string | null,
  random: () => number = Math.random,
): WallpaperEntry {
  if (entries.length === 0) return getDefaultWallpaper();
  const pool =
    entries.length > 1 && lastId
      ? entries.filter((entry) => entry.id !== lastId)
      : entries;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

/** Resolves an entry to a loadable URL (external entries are already absolute). */
export function resolveWallpaperUrl(entry: WallpaperEntry, baseUrl: string): string {
  if (/^https?:\/\//i.test(entry.src)) return entry.src;
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}${entry.src.replace(/^\//, "")}`;
}

/** Id of the wallpaper shown on the previous tab (for repeat avoidance). */
export function readLastWallpaperId(): string | null {
  try {
    return window.localStorage.getItem(LAST_WALLPAPER_KEY) ?? memoryLastId;
  } catch {
    return memoryLastId;
  }
}

export function saveLastWallpaperId(id: string): void {
  memoryLastId = id;
  try {
    window.localStorage.setItem(LAST_WALLPAPER_KEY, id);
  } catch {
    /* storage unavailable — the in-memory value still covers this session */
  }
}

/** Loads one image, resolving on success and rejecting on any failure. */
export function loadWallpaperImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("Empty wallpaper URL"));
      return;
    }
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not load wallpaper: ${url}`));
    image.src = url;
  });
}
