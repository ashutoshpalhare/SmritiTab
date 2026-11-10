import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { normalizeWindows } from "../lib/defaults";
import { StorageKeys, store } from "../lib/storage";
import { clamp, uid } from "../lib/utils";
import type { WindowState } from "../types";

export interface WindowManagerValue {
  windows: WindowState[];
  /** Opens (or focuses) a window for the given app. */
  openWindow: (appId: string, title: string) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  updateGeometry: (
    id: string,
    patch: Partial<Pick<WindowState, "x" | "y" | "width" | "height">>,
  ) => void;
  /** True when the given app already has an open window. */
  hasWindow: (appId: string) => boolean;
}

const WindowContext = createContext<WindowManagerValue | null>(null);

const MIN_WIDTH = 300;
const MIN_HEIGHT = 220;
const BASE_Z = 100;

function viewport() {
  if (typeof window === "undefined") return { width: 1440, height: 900 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function WindowProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [ready, setReady] = useState(false);
  const topZ = useRef(BASE_Z);
  const cascade = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await store.read<unknown>(StorageKeys.windows, []);
      if (cancelled) return;
      const restored = normalizeWindows(raw).map((win) => ({ ...win, minimized: false }));
      setWindows(restored);
      topZ.current = restored.reduce((max, win) => Math.max(max, win.z), BASE_Z);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.windows, windows);
  }, [ready, windows]);

  const openWindow = useCallback((appId: string, title: string) => {
    const id = uid("win");
    const { width: vw, height: vh } = viewport();
    const width = Math.min(480, Math.max(MIN_WIDTH, vw - 80));
    const height = Math.min(560, Math.max(MIN_HEIGHT, vh - 140));
    const offset = (cascade.current % 6) * 28;
    cascade.current += 1;

    const next: WindowState = {
      id,
      appId,
      title,
      x: clamp(Math.round((vw - width) / 2) + offset - 60, 8, Math.max(8, vw - width - 8)),
      y: clamp(Math.round((vh - height) / 2) + offset - 40, 8, Math.max(8, vh - height - 8)),
      width,
      height,
      z: topZ.current + 1,
      minimized: false,
    };
    topZ.current = next.z;

    setWindows((prev) => {
      const existing = prev.find((win) => win.appId === appId);
      if (existing) {
        // Focus the existing window instead of stacking duplicates.
        return prev.map((win) =>
          win.id === existing.id
            ? { ...win, z: topZ.current, minimized: false }
            : win,
        );
      }
      return [...prev, next];
    });

    return id;
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((win) => win.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev.find((win) => win.id === id);
      if (!target) return prev;
      if (target.z === topZ.current) return prev;
      topZ.current += 1;
      const z = topZ.current;
      return prev.map((win) => (win.id === id ? { ...win, z } : win));
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, minimized: true } : win)),
    );
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev.find((win) => win.id === id);
      if (!target) return prev;
      topZ.current += 1;
      const z = topZ.current;
      return prev.map((win) =>
        win.id === id ? { ...win, minimized: false, z } : win,
      );
    });
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setWindows((prev) => {
      const target = prev.find((win) => win.id === id);
      if (!target) return prev;
      if (target.minimized) {
        topZ.current += 1;
        const z = topZ.current;
        return prev.map((win) => (win.id === id ? { ...win, minimized: false, z } : win));
      }
      return prev.map((win) => (win.id === id ? { ...win, minimized: true } : win));
    });
  }, []);

  const updateGeometry = useCallback(
    (id: string, patch: Partial<Pick<WindowState, "x" | "y" | "width" | "height">>) => {
      setWindows((prev) =>
        prev.map((win) => {
          if (win.id !== id) return win;
          const { width: vw, height: vh } = viewport();
          const width = clamp(
            patch.width ?? win.width,
            MIN_WIDTH,
            Math.max(MIN_WIDTH, vw - 16),
          );
          const height = clamp(
            patch.height ?? win.height,
            MIN_HEIGHT,
            Math.max(MIN_HEIGHT, vh - 16),
          );
          const x = clamp(patch.x ?? win.x, 0, Math.max(0, vw - width));
          const y = clamp(patch.y ?? win.y, 0, Math.max(0, vh - 48));
          return { ...win, x, y, width, height };
        }),
      );
    },
    [],
  );

  const hasWindow = useCallback(
    (appId: string) => windows.some((win) => win.appId === appId),
    [windows],
  );

  const value = useMemo<WindowManagerValue>(
    () => ({
      windows,
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      restoreWindow,
      toggleMinimize,
      updateGeometry,
      hasWindow,
    }),
    [
      windows,
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      restoreWindow,
      toggleMinimize,
      updateGeometry,
      hasWindow,
    ],
  );

  return <WindowContext.Provider value={value}>{children}</WindowContext.Provider>;
}

export function useWindows(): WindowManagerValue {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error("useWindows must be used inside <WindowProvider>");
  }
  return context;
}
