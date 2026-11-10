import { useCallback, useEffect, useRef, useState } from "react";

export interface DragDelta {
  dx: number;
  dy: number;
}

export interface UseDragOptions {
  onStart?: () => void;
  onMove: (delta: DragDelta) => void;
  onEnd?: (delta: DragDelta) => void;
  disabled?: boolean;
}

/**
 * Pointer based dragging helper.
 *
 * Uses pointer capture plus window listeners so a drag always terminates —
 * even when the pointer leaves the window or is released outside the element.
 */
export function useDrag(options: UseDragOptions) {
  const [dragging, setDragging] = useState(false);
  const state = useRef<{
    startX: number;
    startY: number;
    pointerId: number;
    lastDx: number;
    lastDy: number;
  } | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const stop = useCallback(() => {
    const current = state.current;
    state.current = null;
    setDragging(false);
    if (current) {
      optionsRef.current.onEnd?.({ dx: current.lastDx, dy: current.lastDy });
    }
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const current = state.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      current.lastDx = dx;
      current.lastDy = dy;
      optionsRef.current.onMove({ dx, dy });
    };

    const onUp = (event: PointerEvent) => {
      const current = state.current;
      if (!current || event.pointerId !== current.pointerId) return;
      stop();
    };

    const onCancel = () => stop();

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onCancel);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onCancel);
    };
  }, [dragging, stop]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (optionsRef.current.disabled) return;
      if (event.button !== 0) return;
      if (state.current) return;

      state.current = {
        startX: event.clientX,
        startY: event.clientY,
        pointerId: event.pointerId,
        lastDx: 0,
        lastDy: 0,
      };
      setDragging(true);
      optionsRef.current.onStart?.();
    },
    [],
  );

  return { onPointerDown, dragging };
}
