import { useCallback, useEffect, useMemo, useState } from "react";
import { BookmarksPanel } from "./components/BookmarksPanel";
import { Dock } from "./components/Dock";
import { FocusMode } from "./components/FocusMode";
import { RightRail } from "./components/RightRail";
import { SearchBar } from "./components/SearchBar";
import { WidgetLayer } from "./components/Widgets";
import { WindowLayer } from "./components/WindowLayer";
import { Icon, IconButton, Spinner } from "./components/ui";
import { useDynamicWallpaper } from "./hooks/useDynamicWallpaper";
import { internalAppMeta } from "./lib/app-meta";
import { getWallpaper } from "./lib/quotes";
import { buildSearchUrl } from "./lib/search";
import { StorageKeys, store } from "./lib/storage";
import { cn } from "./lib/utils";
import { AppProvider, useApp } from "./state/app-state";
import { NavigationProvider, useNavigation } from "./state/navigation";
import { WeatherProvider } from "./state/weather-state";
import { WindowProvider } from "./state/window-manager";
import type { AppEntry, ThemeMode } from "./types";

/** Applies the light/dark theme to the document root. */
function useTheme(mode: ThemeMode, accent: string) {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && media.matches);
      const safeAccent = /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#f97316";
      root.style.setProperty("--accent", safeAccent);
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode, accent]);
}

function Dashboard() {
  const { settings, updateSettings, ready, apps } = useApp();
  const { openUrl, openInternal } = useNavigation();
  const [focusMode, setFocusMode] = useState(false);

  useTheme(settings.theme, settings.accent);

  /* A fresh wallpaper per tab (random mode) or the fixed Settings choice.
     Only the selected image is loaded, with a gradient underneath so the
     dashboard renders instantly and broken URLs degrade gracefully. */
  const dynamicWallpaper = useDynamicWallpaper({
    mode: settings.wallpaperMode,
    fixedId: settings.fixedWallpaperId,
  });
  const fallbackWallpaper = useMemo(() => getWallpaper("mesh"), []);

  const openApp = useCallback(
    (app: AppEntry) => {
      if (app.kind === "internal") {
        const meta = internalAppMeta(app.target);
        openInternal(app.target, meta.title);
      } else {
        openUrl(app.target);
      }
    },
    [openInternal, openUrl],
  );

  /* Pending actions handed over by the extension background worker. */
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const [pendingSearch, pendingAction] = await Promise.all([
        store.read<string | null>(StorageKeys.pendingSearch, null),
        store.read<string | null>(StorageKeys.pendingAction, null),
      ]);
      if (cancelled) return;
      const keys: string[] = [];
      if (typeof pendingSearch === "string" && pendingSearch.trim()) {
        keys.push(StorageKeys.pendingSearch);
      }
      if (typeof pendingAction === "string" && pendingAction) {
        keys.push(StorageKeys.pendingAction);
      }
      if (keys.length > 0) await store.remove(keys);
      if (cancelled) return;

      if (typeof pendingSearch === "string" && pendingSearch.trim()) {
        openUrl(buildSearchUrl(settings.searchEngine, pendingSearch));
        return;
      }
      if (pendingAction === "toggle-focus") {
        setFocusMode(true);
      } else if (pendingAction === "focus-search") {
        window.dispatchEvent(new Event("smrititab:focus-search"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openUrl, ready, settings.searchEngine]);

  /* Keyboard shortcuts: F toggles focus mode, Escape leaves it. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (event.key === "Escape" && focusMode) {
        setFocusMode(false);
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocusMode((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode]);

  const chromeHidden = focusMode;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* ------------------------------------------------------- wallpaper */}
      <div
        aria-hidden="true"
        className={cn("absolute inset-0 bg-cover bg-center", fallbackWallpaper.className)}
      />
      {dynamicWallpaper.layers.map((layer) => (
        <div
          key={layer.key}
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{
            backgroundImage: `url(${layer.url})`,
            opacity: layer.key === dynamicWallpaper.activeKey ? 1 : 0,
          }}
        />
      ))}
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/35" />

      {/* -------------------------------------------------- loading splash */}
      {!ready ? (
        <div className="absolute inset-0 z-[200] grid place-items-center bg-slate-950/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2 text-xs text-slate-600 shadow-lg dark:bg-slate-900/80 dark:text-slate-300">
            <Spinner /> Loading your dashboard…
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- top bar */}
      {!focusMode ? (
        <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-3 py-3 sm:px-4">
          <div className="glass-panel flex items-center gap-2 rounded-2xl py-1.5 pl-1.5 pr-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <Icon name="bookmark" className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              SmritiTab
            </span>
          </div>
          <div className="glass-panel flex items-center gap-0.5 rounded-2xl p-1">
            <IconButton
              icon="focus"
              label="Enter focus mode"
              size="sm"
              onClick={() => setFocusMode(true)}
            />
            <IconButton
              icon="user"
              label="Open profile"
              size="sm"
              onClick={() => openInternal("profile", "Profile")}
            />
            <IconButton
              icon="settings"
              label="Open settings"
              size="sm"
              onClick={() => openInternal("settings", "Settings")}
            />
          </div>
        </div>
      ) : null}

      {/* ----------------------------------------------------------- main */}
      <main
        className={cn(
          "relative z-10 flex h-full flex-col items-center justify-start overflow-y-auto px-4 pb-24 pt-28 transition-opacity duration-300 sm:px-6",
          settings.railVisible && "lg:pr-[21.5rem]",
          chromeHidden && "pointer-events-none opacity-0",
        )}
      >
        <WidgetLayer />
        <SearchBar onNavigate={openUrl} />
        <div className="mt-5 flex min-h-0 w-full flex-1 justify-center">
          <BookmarksPanel />
        </div>
      </main>

      {/* ---------------------------------------------------------- windows */}
      <div
        className={cn(
          "transition-opacity duration-300",
          chromeHidden && "pointer-events-none opacity-0",
        )}
      >
        <WindowLayer />
      </div>

      {/* ------------------------------------------------------- right rail */}
      <div
        className={cn(
          "transition-opacity duration-300",
          chromeHidden && "pointer-events-none opacity-0",
        )}
      >
        {settings.railVisible ? (
          <RightRail
            onOpenUrl={openUrl}
            onOpenInternal={openInternal}
            onClose={() => updateSettings({ railVisible: false })}
          />
        ) : null}
      </div>

      {/* ------------------------------------------------------------- dock */}
      {settings.dockVisible && !focusMode ? (
        <Dock
          onOpenApp={openApp}
          onOpenInternal={openInternal}
          onToggleVisible={() => updateSettings({ dockVisible: false })}
        />
      ) : null}

      {/* Hidden-panel affordances */}
      {!focusMode && !settings.railVisible ? (
        <IconButton
          icon="panel-right"
          label="Show the side panel"
          className="glass-panel fixed right-3 top-3 z-30"
          onClick={() => updateSettings({ railVisible: true })}
        />
      ) : null}
      {!focusMode && !settings.dockVisible ? (
        <IconButton
          icon="grid"
          label="Show the dock"
          className="glass-panel fixed bottom-4 left-1/2 z-30 -translate-x-1/2"
          onClick={() => updateSettings({ dockVisible: true })}
        />
      ) : null}

      {/* ------------------------------------------------------- focus mode */}
      {focusMode ? <FocusMode onExit={() => setFocusMode(false)} /> : null}

      {/* Keyboard shortcut hint */}
      {!focusMode ? (
        <p className="pointer-events-none fixed bottom-2 left-1/2 z-10 hidden -translate-x-1/2 text-[10px] text-white/60 lg:block">
          {apps.length} apps · press{" "}
          <kbd className="rounded bg-black/25 px-1 text-white/80">F</kbd> for focus
          mode
        </p>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <WindowProvider>
        <WeatherProvider>
          <NavigationProvider>
            <Dashboard />
          </NavigationProvider>
        </WeatherProvider>
      </WindowProvider>
    </AppProvider>
  );
}
