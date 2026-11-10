/**
 * Type declarations for the plain-JS wallpaper configuration in
 * `/wallpapers.js` (kept as JavaScript so it can be edited without touching
 * the TypeScript sources).
 */
declare module "*/wallpapers.js" {
  export interface WallpaperEntry {
    id: string;
    title: string;
    /** File name for local assets, full https URL for external ones. */
    src: string;
    source: "local" | "external";
    credit?: string;
  }

  export const WALLPAPERS: WallpaperEntry[];
  export const DEFAULT_WALLPAPER_ID: string;
}
