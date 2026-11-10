import { useEffect, useRef, useState } from "react";
import {
  getDefaultWallpaper,
  getWallpaperById,
  loadWallpaperImage,
  pickRandomWallpaper,
  readLastWallpaperId,
  resolveWallpaperUrl,
  saveLastWallpaperId,
  ALL_WALLPAPERS,
  type WallpaperEntry,
} from "../lib/wallpaper";

export interface WallpaperLayer {
  key: number;
  url: string;
}

export interface DynamicWallpaper {
  /** Image layers for the crossfade (oldest first, newest on top). */
  layers: WallpaperLayer[];
  activeKey: number;
  entry: WallpaperEntry | null;
  /** True when even the fallback image failed (render a gradient instead). */
  failed: boolean;
}

/**
 * Dynamic wallpaper selection.
 *
 * - Random mode picks a new wallpaper on every mount (i.e. every new tab or
 *   refresh) and never repeats the previously shown one.
 * - Fixed mode always shows the wallpaper chosen in Settings.
 * - Only the selected image is loaded; a broken URL falls back to the
 *   bundled default, and if that fails too the caller renders a gradient.
 */
export function useDynamicWallpaper(options: {
  mode: "random" | "fixed";
  fixedId: string;
}): DynamicWallpaper {
  const { mode, fixedId } = options;
  const [layers, setLayers] = useState<WallpaperLayer[]>([]);
  const [activeKey, setActiveKey] = useState(0);
  const [entry, setEntry] = useState<WallpaperEntry | null>(null);
  const [failed, setFailed] = useState(false);
  const keyRef = useRef(0);
  const pickedRef = useRef<WallpaperEntry | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    const target =
      mode === "fixed"
        ? getWallpaperById(fixedId)
        : (pickedRef.current ??=
            pickRandomWallpaper(ALL_WALLPAPERS, readLastWallpaperId()));

    setEntry(target);

    const show = async (candidate: WallpaperEntry, isFallback: boolean) => {
      const url = resolveWallpaperUrl(candidate, import.meta.env.BASE_URL);
      try {
        // Only this one image is ever requested — the rest of the library
        // stays untouched until (maybe) a future tab picks it.
        await loadWallpaperImage(url);
      } catch {
        if (cancelled) return;
        if (!isFallback) {
          await show(getDefaultWallpaper(), true);
        } else {
          setFailed(true);
        }
        return;
      }
      if (cancelled) return;
      saveLastWallpaperId(candidate.id);
      setFailed(false);
      keyRef.current += 1;
      const key = keyRef.current;
      setLayers((prev) => [...prev.slice(-1), { key, url }]);
      // Crossfade: activate on the next frame, then drop the old layer.
      const activate = window.requestAnimationFrame(() => {
        if (!cancelled) setActiveKey(key);
      });
      const prune = window.setTimeout(() => {
        if (!cancelled) setLayers((prev) => prev.filter((layer) => layer.key === key));
      }, 900);
      timers.current.push(activate, prune);
    };

    void show(target, target.id === getDefaultWallpaper().id);

    return () => {
      cancelled = true;
      for (const timer of timers.current) {
        window.cancelAnimationFrame(timer);
        window.clearTimeout(timer);
      }
      timers.current = [];
    };
  }, [mode, fixedId]);

  return { layers, activeKey, entry, failed };
}
