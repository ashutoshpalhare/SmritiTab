/**
 * SmritiTab — wallpaper configuration.
 *
 * This is the ONLY file you need to edit to manage wallpapers:
 *   - Add or remove entries in `WALLPAPERS` below.
 *   - Local images live in `assets/wallpapers/` and are referenced by file
 *     name (they are copied to `wallpapers/` in the build output).
 *   - External images use a full https URL.
 *
 * The dashboard loads only the single selected wallpaper — entries are never
 * preloaded in bulk. Delete a local file and its entry (or vice versa) and
 * the picker in Settings stays in sync automatically.
 */

export const DEFAULT_WALLPAPER_ID = "local-001";

const LOCAL_TITLES = [
  "Indigo Drift", "Violet Haze", "Teal Depth", "Plum Dusk", "Aurora Fade",
  "Ember Glow", "Midnight Tide", "Rose Mist", "Verdant Calm", "Solar Veil",
];

const localWallpapers = Array.from({ length: 100 }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");
  const titles = {
    "001": "Aurora Veil",
    "002": "Dune Dusk",
  };
  return {
    id: `local-${number}`,
    title: titles[number] ?? `${LOCAL_TITLES[index % LOCAL_TITLES.length]} ${number}`,
    src: `wallpapers/wallpaper-${number}.jpg`,
    source: "local",
  };
});

/** Externally hosted wallpapers (full URLs, loaded on demand only). */
const externalWallpapers = [
  {
    id: "ext-picsum-1",
    title: "Picsum — Seed Valley",
    src: "https://picsum.photos/seed/smriti-valley/1600/900",
    source: "external",
    credit: "picsum.photos",
  },
  {
    id: "ext-picsum-2",
    title: "Picsum — Seed Harbor",
    src: "https://picsum.photos/seed/smriti-harbor/1600/900",
    source: "external",
    credit: "picsum.photos",
  },
  {
    id: "ext-picsum-3",
    title: "Picsum — Seed Summit",
    src: "https://picsum.photos/seed/smriti-summit/1600/900",
    source: "external",
    credit: "picsum.photos",
  },
  {
    id: "ext-picsum-4",
    title: "Picsum — Seed Forest",
    src: "https://picsum.photos/seed/smriti-forest/1600/900",
    source: "external",
    credit: "picsum.photos",
  },
  {
    id: "ext-picsum-5",
    title: "Picsum — Seed Desert",
    src: "https://picsum.photos/seed/smriti-desert/1600/900",
    source: "external",
    credit: "picsum.photos",
  },
  {
    id: "ext-picsum-6",
    title: "Picsum — Seed Coast",
    src: "https://picsum.photos/seed/smriti-coast/1600/900",
    source: "external",
    credit: "picsum.photos",
  },
];

export const WALLPAPERS = [...localWallpapers, ...externalWallpapers];
