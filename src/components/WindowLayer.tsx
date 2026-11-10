import { useRef } from "react";
import { APP_REGISTRY } from "../apps/registry";
import { internalAppMeta } from "../lib/app-meta";
import { useDrag } from "../hooks/useDrag";
import { cn } from "../lib/utils";
import { useWindows } from "../state/window-manager";
import type { WindowState } from "../types";
import { Icon, IconButton } from "./ui";

function WindowFrame({ win }: { win: WindowState }) {
  const { closeWindow, focusWindow, toggleMinimize, updateGeometry } = useWindows();
  const AppComponent = APP_REGISTRY[win.appId];
  const meta = internalAppMeta(win.appId);

  /* The drag/resize origin is captured when the gesture starts so the
     window never drifts when the component re-renders mid-drag. */
  const origin = useRef({ x: win.x, y: win.y, width: win.width, height: win.height });

  const drag = useDrag({
    onStart: () => {
      origin.current = { x: win.x, y: win.y, width: win.width, height: win.height };
      focusWindow(win.id);
    },
    onMove: ({ dx, dy }) => {
      updateGeometry(win.id, {
        x: origin.current.x + dx,
        y: origin.current.y + dy,
      });
    },
  });

  const resize = useDrag({
    onStart: () => {
      origin.current = { x: win.x, y: win.y, width: win.width, height: win.height };
      focusWindow(win.id);
    },
    onMove: ({ dx, dy }) => {
      updateGeometry(win.id, {
        width: origin.current.width + dx,
        height: origin.current.height + dy,
      });
    },
  });

  return (
    <section
      aria-label={`${win.title} window`}
      onPointerDown={() => focusWindow(win.id)}
      style={{
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.z,
      }}
      className="glass-panel-strong pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl"
    >
      <header
        onPointerDown={drag.onPointerDown}
        className="flex cursor-grab items-center gap-2 border-b border-slate-900/10 px-3 py-2 active:cursor-grabbing dark:border-white/10"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <Icon name={meta.icon} className="h-3.5 w-3.5" />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
          {win.title}
        </h2>
        <IconButton
          icon="minimize"
          label={`Minimise ${win.title}`}
          size="sm"
          className="h-6 w-6"
          onClick={() => toggleMinimize(win.id)}
        />
        <IconButton
          icon="close"
          label={`Close ${win.title}`}
          size="sm"
          className="h-6 w-6 hover:text-rose-500"
          onClick={() => closeWindow(win.id)}
        />
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {AppComponent ? (
          <AppComponent />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            This app is not available.
          </div>
        )}
      </div>

      {/* Resize handles */}
      <div
        onPointerDown={resize.onPointerDown}
        role="presentation"
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
      >
        <span className="absolute bottom-1 right-1 h-2 w-2 rounded-br-md border-b-2 border-r-2 border-slate-400/60" />
      </div>
      <div
        onPointerDown={resize.onPointerDown}
        role="presentation"
        className="absolute bottom-0 right-4 h-2 w-3 cursor-ew-resize"
      />
      <div
        onPointerDown={resize.onPointerDown}
        role="presentation"
        className={cn("absolute bottom-4 right-0 h-3 w-2 cursor-ns-resize")}
      />
    </section>
  );
}

export function WindowLayer() {
  const { windows } = useWindows();

  return (
    <div aria-label="Application windows" className="pointer-events-none absolute inset-0 z-[25]">
      {windows
        .filter((win) => !win.minimized)
        .map((win) => (
          <WindowFrame key={win.id} win={win} />
        ))}
    </div>
  );
}
