import { useState } from "react";
import { internalAppMeta } from "../lib/app-meta";
import { QUOTES } from "../lib/quotes";
import { SEARCH_PROVIDERS } from "../lib/search";
import { cn } from "../lib/utils";
import { ALL_WALLPAPERS, resolveWallpaperUrl } from "../lib/wallpaper";
import { useApp } from "../state/app-state";
import type { ThemeMode } from "../types";
import {
  Button,
  Modal,
  Select,
  TextInput,
  Toggle,
} from "../components/ui";

const THEMES: Array<{ id: ThemeMode; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

const ACCENTS = [
  { value: "#f97316", label: "Orange" },
  { value: "#ea580c", label: "Burnt orange" },
  { value: "#fb923c", label: "Soft orange" },
  { value: "#f59e0b", label: "Amber" },
] as const;

export function SettingsApp() {
  const {
    settings,
    updateSettings,
    apps,
    dock,
    updateDock,
    storageStatus,
    resetDashboard,
  } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const toggleDockItem = (id: string) => {
    const present = dock.appIds.includes(id);
    updateDock({
      appIds: present
        ? dock.appIds.filter((item) => item !== id)
        : [...dock.appIds, id],
    });
  };

  const dockCandidates = [
    ...INTERNAL_APP_IDS.map((id) => ({
      id: id as string,
      label: internalAppMeta(id).title,
    })),
    ...apps.map((app) => ({ id: app.id, label: app.name })),
  ];

  return (
    <div className="scroll-thin h-full min-h-0 overflow-y-auto">
      <div className="space-y-6 p-4">
        {/* ------------------------------------------------------ appearance */}
        <section aria-label="Appearance" className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Appearance
          </h3>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-200">Theme</span>
            <div className="flex gap-1">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => updateSettings({ theme: theme.id })}
                  aria-pressed={settings.theme === theme.id}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                    settings.theme === theme.id
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                      : "text-slate-500 hover:bg-slate-900/5 dark:text-slate-400 dark:hover:bg-white/10",
                  )}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-200">Accent color</span>
            <div className="flex items-center gap-2" role="group" aria-label="Accent color">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.value}
                  type="button"
                  aria-label={accent.label}
                  aria-pressed={settings.accent === accent.value}
                  title={accent.label}
                  onClick={() => updateSettings({ accent: accent.value })}
                  style={{ backgroundColor: accent.value }}
                  className={cn(
                    "h-7 w-7 rounded-full border border-black/10 transition",
                    settings.accent === accent.value
                      ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                      : "hover:scale-110",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-700 dark:text-slate-200">
                Wallpaper
              </span>
              <div className="flex gap-1" role="group" aria-label="Wallpaper mode">
                {(
                  [
                    { id: "random", label: "Random per tab" },
                    { id: "fixed", label: "Fixed" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateSettings({ wallpaperMode: option.id })}
                    aria-pressed={settings.wallpaperMode === option.id}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                      settings.wallpaperMode === option.id
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : "text-slate-500 hover:bg-slate-900/5 dark:text-slate-400 dark:hover:bg-white/10",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {ALL_WALLPAPERS.length} wallpapers configured in wallpapers.js. In
              random mode a different one is picked for every new tab.
            </p>
            <div className="scroll-thin grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {ALL_WALLPAPERS.map((wallpaper) => (
                <button
                  key={wallpaper.id}
                  type="button"
                  onClick={() =>
                    updateSettings({
                      wallpaperMode: "fixed",
                      fixedWallpaperId: wallpaper.id,
                    })
                  }
                  aria-pressed={
                    settings.wallpaperMode === "fixed" &&
                    settings.fixedWallpaperId === wallpaper.id
                  }
                  title={wallpaper.title}
                  className={cn(
                    "group relative h-16 overflow-hidden rounded-xl border-2 transition",
                    settings.wallpaperMode === "fixed" &&
                      settings.fixedWallpaperId === wallpaper.id
                      ? "border-orange-500"
                      : "border-transparent hover:border-slate-400/40",
                  )}
                >
                  <img
                    src={resolveWallpaperUrl(wallpaper, import.meta.env.BASE_URL)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-slate-950/45 px-1 py-0.5 text-left text-[10px] text-white">
                    {wallpaper.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-200">Clock format</span>
            <Select
              value={settings.clock24h ? "24" : "12"}
              onChange={(event) =>
                updateSettings({ clock24h: event.target.value === "24" })
              }
              aria-label="Clock format"
              className="w-auto py-1 text-xs"
            >
              <option value="12">12 hour</option>
              <option value="24">24 hour</option>
            </Select>
          </div>

          <Toggle
            label="Show seconds"
            description="Display seconds in the clock widget."
            checked={settings.showSecondsInClock}
            onChange={(value) => updateSettings({ showSecondsInClock: value })}
          />
          <Toggle
            label="Show greeting"
            description="Greet you by name under the clock."
            checked={settings.showGreeting}
            onChange={(value) => updateSettings({ showGreeting: value })}
          />
        </section>

        {/* ------------------------------------------------------- dashboard */}
        <section aria-label="Dashboard" className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Dashboard
          </h3>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-200">
              Default search engine
            </span>
            <Select
              value={settings.searchEngine}
              onChange={(event) =>
                updateSettings({
                  searchEngine: event.target
                    .value as (typeof SEARCH_PROVIDERS)[number]["id"],
                })
              }
              aria-label="Default search engine"
              className="w-auto py-1 text-xs"
            >
              {SEARCH_PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </Select>
          </div>

          <Toggle
            label="Open results in a new tab"
            description="Keeps the dashboard open while you browse."
            checked={settings.openInNewTab}
            onChange={(value) => updateSettings({ openInNewTab: value })}
          />
          <Toggle
            label="Show the clock widget"
            checked={settings.showClockWidget}
            onChange={(value) => updateSettings({ showClockWidget: value })}
          />
          <Toggle
            label="Show the weather widget"
            checked={settings.showWeatherWidget}
            onChange={(value) => updateSettings({ showWeatherWidget: value })}
          />
          <Toggle
            label="Show the quote widget"
            checked={settings.showQuoteWidget}
            onChange={(value) => updateSettings({ showQuoteWidget: value })}
          />
          <Toggle
            label="Show the side panel"
            checked={settings.railVisible}
            onChange={(value) => updateSettings({ railVisible: value })}
          />
          <Toggle
            label="Show the dock"
            checked={settings.dockVisible}
            onChange={(value) => updateSettings({ dockVisible: value })}
          />
        </section>

        {/* ------------------------------------------------------------- dock */}
        <section aria-label="Dock" className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Dock
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {dockCandidates.map((candidate) => {
              const active = dock.appIds.includes(candidate.id);
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => toggleDockItem(candidate.id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                    active
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                      : "bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20",
                  )}
                >
                  {candidate.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-200">Dock size</span>
            <Select
              value={dock.size}
              onChange={(event) =>
                updateDock({ size: event.target.value as typeof dock.size })
              }
              aria-label="Dock size"
              className="w-auto py-1 text-xs"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-200">Dock position</span>
            <Select
              value={dock.position}
              onChange={(event) =>
                updateDock({ position: event.target.value as typeof dock.position })
              }
              aria-label="Dock position"
              className="w-auto py-1 text-xs"
            >
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
            </Select>
          </div>
        </section>

        {/* ---------------------------------------------------------- storage */}
        <section aria-label="Storage" className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Storage
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Data is stored in <strong>{storageStatus.backend}</strong>
            {storageStatus.backend === "chrome"
              ? " (chrome.storage.local)"
              : storageStatus.backend === "local"
                ? " (localStorage)"
                : " (in memory only — it will not survive a restart)"}
            .
          </p>
          {storageStatus.error ? (
            <p role="alert" className="text-xs text-rose-500">
              {storageStatus.error}
            </p>
          ) : null}
          <TextInput readOnly value={QUOTES.length + " quotes bundled"} className="text-xs" />
          <Button
            size="sm"
            variant="danger"
            icon="trash"
            onClick={() => setConfirmReset(true)}
            disabled={resetting}
          >
            Reset dashboard data
          </Button>
        </section>
      </div>

      <Modal
        open={confirmReset}
        title="Reset all dashboard data?"
        description="Settings, notes, tasks, favorites, widgets and windows are removed. This cannot be undone."
        size="sm"
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                setResetting(true);
                void resetDashboard().finally(() => {
                  setResetting(false);
                  setConfirmReset(false);
                });
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Your browser bookmarks and history are never touched.
        </p>
      </Modal>
    </div>
  );
}

const INTERNAL_APP_IDS = [
  "notes",
  "todo",
  "calculator",
  "bookmarks",
  "history",
  "clipboard",
  "favorites",
  "weather",
  "settings",
  "profile",
] as const;
