/**
 * Shared domain types for SmritiTab.
 *
 * Everything that is persisted to storage is described here so the normalisers
 * in `src/lib/defaults.ts` can validate untrusted/legacy payloads safely.
 */

export type ThemeMode = "light" | "dark" | "system";

export type WallpaperId = "aurora" | "dune" | "mesh" | "mist" | "solid";

export type SearchEngineId =
  | "google"
  | "duckduckgo"
  | "bing"
  | "youtube"
  | "chatgpt"
  | "perplexity";

export type TemperatureUnit = "c" | "f";

export type Priority = "low" | "medium" | "high";

/** Applications that ship with the dashboard and open in a draggable window. */
export type InternalAppId =
  | "notes"
  | "todo"
  | "calculator"
  | "bookmarks"
  | "history"
  | "clipboard"
  | "favorites"
  | "weather"
  | "settings"
  | "profile";

export type AppKind = "internal" | "web";

export interface Settings {
  theme: ThemeMode;
  /** Legacy fixed wallpaper (kept for backward-compatible stored data). */
  wallpaper: WallpaperId;
  /** Dynamic wallpapers: a fresh random pick per tab, or one fixed choice. */
  wallpaperMode: "random" | "fixed";
  fixedWallpaperId: string;
  accent: string;
  searchEngine: SearchEngineId;
  openInNewTab: boolean;
  temperatureUnit: TemperatureUnit;
  clock24h: boolean;
  clockSeconds: boolean;
  showSecondsInClock: boolean;
  showGreeting: boolean;
  showClockWidget: boolean;
  showWeatherWidget: boolean;
  showQuoteWidget: boolean;
  sidebarCollapsed: boolean;
  railVisible: boolean;
  dockVisible: boolean;
  voiceLanguage: string;
}

export interface Profile {
  name: string;
  tagline: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  accent: string;
}

export interface AppEntry {
  id: string;
  name: string;
  /** For `internal` apps this is the built-in app id, otherwise an https URL. */
  target: string;
  kind: AppKind;
  categoryId: string;
  iconText: string;
}

export interface Favorite {
  id: string;
  title: string;
  url: string;
  addedAt: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: number;
}

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  due: string | null;
  createdAt: number;
}

export interface WidgetPlacement {
  x: number;
  y: number;
  visible: boolean;
}

export type WidgetId = "clock" | "weather" | "quote";

export type WidgetMap = Record<WidgetId, WidgetPlacement>;

export interface DockConfig {
  appIds: string[];
  size: "sm" | "md" | "lg";
  position: "bottom" | "left";
  labels: boolean;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
}

export interface WeatherSnapshot {
  city: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  code: number;
  isDay: boolean;
  updatedAt: number;
}

export interface ClipboardEntry {
  id: string;
  text: string;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  lastVisitTime: number;
  visitCount: number;
}
