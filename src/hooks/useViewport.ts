import { useEffect, useState } from "react";

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Tracks the viewport size with a requestAnimationFrame throttle so resize
 * storms never trigger a burst of React renders.
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 800 : window.innerHeight,
  }));

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setSize((prev) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    };
    const onResize = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return size;
}
