import type {
  AppEntry,
  Category,
  ClipboardEntry,
  DockConfig,
  Favorite,
  HistoryEntry,
  Note,
  Profile,
  SearchEngineId,
  Settings,
  Todo,
  WidgetMap,
  WidgetPlacement,
  WindowState,
} from "../types";

/**
 * Default data + normalisers.
 *
 * Normalisers are the only way data enters the app from storage, which means
 * a corrupt, legacy or hand-edited payload can never crash the dashboard:
 * invalid entries are dropped and missing fields fall back to a sane default.
 */

/* ------------------------------------------------------------------ guards */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asId(value: unknown, fallback: string): string {
  const str = asString(value);
  return str.trim() || fallback;
}

/* --------------------------------------------------------------- defaults */

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  wallpaper: "aurora",
  wallpaperMode: "random",
  fixedWallpaperId: "local-001",
  accent: "#f97316",
  searchEngine: "google",
  openInNewTab: true,
  temperatureUnit: "c",
  clock24h: false,
  clockSeconds: false,
  showSecondsInClock: false,
  showGreeting: true,
  showClockWidget: true,
  showWeatherWidget: true,
  showQuoteWidget: true,
  sidebarCollapsed: false,
  railVisible: true,
  dockVisible: true,
  voiceLanguage: "en-US",
};

export const DEFAULT_PROFILE: Profile = {
  name: "Guest",
  tagline: "Make space for what matters.",
  email: "",
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat_work", name: "Work", accent: "#f97316" },
  { id: "cat_daily", name: "Daily", accent: "#fb923c" },
];

export const DEFAULT_APPS: AppEntry[] = [
  {
    id: "app_gmail",
    name: "Gmail",
    target: "https://mail.google.com",
    kind: "web",
    categoryId: "cat_work",
    iconText: "M",
  },
  {
    id: "app_calendar",
    name: "Calendar",
    target: "https://calendar.google.com",
    kind: "web",
    categoryId: "cat_work",
    iconText: "C",
  },
  {
    id: "app_github",
    name: "GitHub",
    target: "https://github.com",
    kind: "web",
    categoryId: "cat_work",
    iconText: "G",
  },
  {
    id: "app_drive",
    name: "Drive",
    target: "https://drive.google.com",
    kind: "web",
    categoryId: "cat_work",
    iconText: "D",
  },
  {
    id: "app_reddit",
    name: "Reddit",
    target: "https://www.reddit.com",
    kind: "web",
    categoryId: "cat_daily",
    iconText: "R",
  },
  {
    id: "app_youtube",
    name: "YouTube",
    target: "https://www.youtube.com",
    kind: "web",
    categoryId: "cat_daily",
    iconText: "Y",
  },
  {
    id: "app_chatgpt",
    name: "ChatGPT",
    target: "https://chatgpt.com",
    kind: "web",
    categoryId: "cat_daily",
    iconText: "AI",
  },
  {
    id: "app_perplexity",
    name: "Perplexity",
    target: "https://www.perplexity.ai",
    kind: "web",
    categoryId: "cat_daily",
    iconText: "P",
  },
];

/** Widget coordinates are normalised (0..1) so they survive resizes. */
export const DEFAULT_WIDGETS: WidgetMap = {
  clock: { x: 0.5, y: 0.115, visible: true },
  weather: { x: 0.13, y: 0.115, visible: true },
  quote: { x: 0.87, y: 0.115, visible: true },
};

export const DEFAULT_DOCK: DockConfig = {
  appIds: ["notes", "todo", "calculator", "bookmarks", "history", "clipboard"],
  size: "md",
  position: "bottom",
  labels: false,
};

/* ----------------------------------------------------------- normalisers */

const THEMES = new Set(["light", "dark", "system"]);
const WALLPAPERS = new Set(["aurora", "dune", "mesh", "mist", "solid"]);
const ENGINES = new Set<SearchEngineId>([
  "google",
  "duckduckgo",
  "bing",
  "youtube",
  "chatgpt",
  "perplexity",
]);
const PRIORITIES = new Set(["low", "medium", "high"]);

export function normalizeSettings(raw: unknown): Settings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS };
  const theme = asString(raw.theme) as Settings["theme"];
  const wallpaper = asString(raw.wallpaper) as Settings["wallpaper"];
  const engine = asString(raw.searchEngine) as Settings["searchEngine"];
  return {
    theme: THEMES.has(theme) ? theme : DEFAULT_SETTINGS.theme,
    wallpaper: WALLPAPERS.has(wallpaper) ? wallpaper : DEFAULT_SETTINGS.wallpaper,
    wallpaperMode: raw.wallpaperMode === "fixed" ? "fixed" : "random",
    fixedWallpaperId: asString(raw.fixedWallpaperId, DEFAULT_SETTINGS.fixedWallpaperId),
    accent: asString(raw.accent, DEFAULT_SETTINGS.accent),
    searchEngine: ENGINES.has(engine) ? engine : DEFAULT_SETTINGS.searchEngine,
    openInNewTab: asBoolean(raw.openInNewTab, DEFAULT_SETTINGS.openInNewTab),
    temperatureUnit:
      raw.temperatureUnit === "f" ? "f" : DEFAULT_SETTINGS.temperatureUnit,
    clock24h: asBoolean(raw.clock24h, DEFAULT_SETTINGS.clock24h),
    clockSeconds: asBoolean(raw.clockSeconds, DEFAULT_SETTINGS.clockSeconds),
    showSecondsInClock: asBoolean(
      raw.showSecondsInClock,
      DEFAULT_SETTINGS.showSecondsInClock,
    ),
    showGreeting: asBoolean(raw.showGreeting, DEFAULT_SETTINGS.showGreeting),
    showClockWidget: asBoolean(
      raw.showClockWidget,
      DEFAULT_SETTINGS.showClockWidget,
    ),
    showWeatherWidget: asBoolean(
      raw.showWeatherWidget,
      DEFAULT_SETTINGS.showWeatherWidget,
    ),
    showQuoteWidget: asBoolean(raw.showQuoteWidget, DEFAULT_SETTINGS.showQuoteWidget),
    sidebarCollapsed: asBoolean(
      raw.sidebarCollapsed,
      DEFAULT_SETTINGS.sidebarCollapsed,
    ),
    railVisible: asBoolean(raw.railVisible, DEFAULT_SETTINGS.railVisible),
    dockVisible: asBoolean(raw.dockVisible, DEFAULT_SETTINGS.dockVisible),
    voiceLanguage: asString(raw.voiceLanguage, DEFAULT_SETTINGS.voiceLanguage),
  };
}

export function normalizeProfile(raw: unknown): Profile {
  if (!isRecord(raw)) return { ...DEFAULT_PROFILE };
  return {
    name: asString(raw.name, DEFAULT_PROFILE.name).slice(0, 60),
    tagline: asString(raw.tagline, DEFAULT_PROFILE.tagline).slice(0, 160),
    email: asString(raw.email, DEFAULT_PROFILE.email).slice(0, 120),
  };
}

export function normalizeCategories(raw: unknown): Category[] {
  const seen = new Set<string>();
  const result: Category[] = [];
  for (const item of asArray(raw)) {
    if (!isRecord(item)) continue;
    const id = asId(item.id, "");
    const name = asString(item.name).trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    result.push({
      id,
      name: name.slice(0, 40),
      accent: asString(item.accent, "#f97316"),
    });
  }
  return result.length ? result : DEFAULT_CATEGORIES.map((c) => ({ ...c }));
}

export function normalizeApps(raw: unknown, categories: Category[]): AppEntry[] {
  // A missing or corrupt payload falls back to the shipped apps, but an
  // explicitly empty list is respected (the user deleted every app).
  if (!Array.isArray(raw)) {
    return DEFAULT_APPS.map((app) => ({ ...app }));
  }
  const validCategories = new Set(categories.map((c) => c.id));
  const fallbackCategory = categories[0]?.id ?? "";
  const seen = new Set<string>();
  const result: AppEntry[] = [];
  for (const item of asArray(raw)) {
    if (!isRecord(item)) continue;
    const id = asId(item.id, "");
    const name = asString(item.name).trim();
    const target = asString(item.target).trim();
    if (!id || !name || !target || seen.has(id)) continue;
    seen.add(id);
    const kind = item.kind === "web" ? "web" : "internal";
    const categoryId = asString(item.categoryId);
    result.push({
      id,
      name: name.slice(0, 40),
      target,
      kind,
      categoryId: validCategories.has(categoryId)
        ? categoryId
        : fallbackCategory,
      iconText: asString(item.iconText, name.slice(0, 2)).slice(0, 3),
    });
  }
  return result;
}

export function normalizeFavorites(raw: unknown): Favorite[] {
  const seen = new Set<string>();
  const result: Favorite[] = [];
  for (const item of asArray(raw)) {
    if (!isRecord(item)) continue;
    const id = asId(item.id, "");
    const url = asString(item.url).trim();
    const title = asString(item.title).trim();
    if (!id || !url || seen.has(id)) continue;
    seen.add(id);
    result.push({
      id,
      url,
      title: title || url,
      addedAt: asNumber(item.addedAt, Date.now()),
    });
  }
  return result;
}

export function normalizeNotes(raw: unknown): Note[] {
  const seen = new Set<string>();
  const result: Note[] = [];
  for (const item of asArray(raw)) {
    if (!isRecord(item)) continue;
    const id = asId(item.id, "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push({
      id,
      title: asString(item.title, "Untitled").slice(0, 120),
      body: asString(item.body),
      pinned: asBoolean(item.pinned, false),
      updatedAt: asNumber(item.updatedAt, Date.now()),
    });
  }
  return result;
}

export function normalizeTodos(raw: unknown): Todo[] {
  const seen = new Set<string>();
  const result: Todo[] = [];
  for (const item of asArray(raw)) {
    if (!isRecord(item)) continue;
    const id = asId(item.id, "");
    const title = asString(item.title).trim();
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    const priority = asString(item.priority, "medium");
    result.push({
      id,
      title: title.slice(0, 200),
      done: asBoolean(item.done, false),
      priority: PRIORITIES.has(priority)
        ? (priority as Todo["priority"])
        : "medium",
      due:
        typeof item.due === "string" && item.due.trim()
          ? item.due
          : null,
      createdAt: asNumber(item.createdAt, Date.now()),
    });
  }
  return result;
}

function normalizePlacement(raw: unknown, fallback: WidgetPlacement): WidgetPlacement {
  if (!isRecord(raw)) return { ...fallback };
  const x = asNumber(raw.x, fallback.x);
  const y = asNumber(raw.y, fallback.y);
  return {
    x: Math.min(Math.max(x, 0), 1),
    y: Math.min(Math.max(y, 0), 1),
    visible: asBoolean(raw.visible, fallback.visible),
  };
}

export function normalizeWidgets(raw: unknown): WidgetMap {
  const base = isRecord(raw) ? raw : {};
  return {
    clock: normalizePlacement(base.clock, DEFAULT_WIDGETS.clock),
    weather: normalizePlacement(base.weather, DEFAULT_WIDGETS.weather),
    quote: normalizePlacement(base.quote, DEFAULT_WIDGETS.quote),
  };
}

export function normalizeDock(raw: unknown, apps: AppEntry[]): DockConfig {
  const base = isRecord(raw) ? raw : {};
  const known = new Set<string>([...apps.map((a) => a.id), ...INTERNAL_APP_IDS]);
  const appIds: string[] = [];
  for (const id of asArray(base.appIds)) {
    const str = asString(id);
    if (str && known.has(str) && !appIds.includes(str)) appIds.push(str);
  }
  return {
    appIds: appIds.length ? appIds : [...DEFAULT_DOCK.appIds],
    size: base.size === "sm" || base.size === "lg" ? base.size : DEFAULT_DOCK.size,
    position: base.position === "left" ? "left" : DEFAULT_DOCK.position,
    labels: asBoolean(base.labels, DEFAULT_DOCK.labels),
  };
}

export function normalizeWindows(raw: unknown): WindowState[] {
  const seen = new Set<string>();
  const result: WindowState[] = [];
  for (const item of asArray(raw)) {
    if (!isRecord(item)) continue;
    const id = asId(item.id, "");
    const appId = asString(item.appId);
    if (!id || !appId || seen.has(id)) continue;
    seen.add(id);
    result.push({
      id,
      appId,
      title: asString(item.title, "Window").slice(0, 60),
      x: asNumber(item.x, 120),
      y: asNumber(item.y, 120),
      width: Math.max(260, asNumber(item.width, 420)),
      height: Math.max(200, asNumber(item.height, 360)),
      z: asNumber(item.z, 1),
      minimized: asBoolean(item.minimized, false),
    });
  }
  return result;
}

export function normalizeClipboard(raw: unknown): ClipboardEntry[] {
  const seen = new Set<string>();
  const result: ClipboardEntry[] = [];
  for (const item of asArray(raw)) {
    if (!isRecord(item)) continue;
    const id = asId(item.id, "");
    const text = asString(item.text);
    if (!id || !text || seen.has(id)) continue;
    seen.add(id);
    result.push({
      id,
      text: text.slice(0, 5000),
      createdAt: asNumber(item.createdAt, Date.now()),
    });
  }
  return result.slice(0, 50);
}

export function normalizeHistory(raw: unknown): HistoryEntry[] {
  const result: HistoryEntry[] = [];
  for (const item of asArray(raw)) {
    if (!isRecord(item)) continue;
    const url = asString(item.url);
    if (!url) continue;
    result.push({
      id: asId(item.id, url),
      title: asString(item.title, url),
      url,
      lastVisitTime: asNumber(item.lastVisitTime, Date.now()),
      visitCount: asNumber(item.visitCount, 0),
    });
  }
  return result;
}

/** Built-in application ids that can be pinned to the dock. */
export const INTERNAL_APP_IDS = [
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
