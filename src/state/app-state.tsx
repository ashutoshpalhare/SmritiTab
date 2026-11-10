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
import {
  DEFAULT_APPS,
  DEFAULT_CATEGORIES,
  DEFAULT_DOCK,
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  DEFAULT_WIDGETS,
  normalizeApps,
  normalizeCategories,
  normalizeClipboard,
  normalizeDock,
  normalizeFavorites,
  normalizeNotes,
  normalizeProfile,
  normalizeSettings,
  normalizeTodos,
  normalizeWidgets,
} from "../lib/defaults";
import { StorageKeys, store, type StorageStatus } from "../lib/storage";
import { uid } from "../lib/utils";
import type {
  AppEntry,
  Category,
  ClipboardEntry,
  DockConfig,
  Favorite,
  Note,
  Profile,
  Settings,
  Todo,
  WidgetId,
  WidgetMap,
} from "../types";

interface AppData {
  settings: Settings;
  profile: Profile;
  categories: Category[];
  apps: AppEntry[];
  favorites: Favorite[];
  notes: Note[];
  todos: Todo[];
  widgets: WidgetMap;
  dock: DockConfig;
  clipboard: ClipboardEntry[];
}

export interface AppContextValue extends AppData {
  /** False until the persisted state has been read (avoids flashing defaults). */
  ready: boolean;
  storageStatus: StorageStatus;
  updateSettings: (patch: Partial<Settings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  createCategory: (input: { name: string; accent?: string }) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  createApp: (input: {
    name: string;
    target: string;
    kind: AppEntry["kind"];
    categoryId: string;
    iconText?: string;
  }) => AppEntry;
  updateApp: (id: string, patch: Partial<AppEntry>) => void;
  deleteApp: (id: string) => void;
  toggleFavorite: (url: string, title?: string) => void;
  isFavorite: (url: string) => boolean;
  addNote: (input: { title?: string; body?: string }) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addTodo: (input: {
    title: string;
    priority?: Todo["priority"];
    due?: string | null;
  }) => Todo;
  updateTodo: (id: string, patch: Partial<Todo>) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateWidget: (id: WidgetId, patch: Partial<WidgetMap[WidgetId]>) => void;
  updateDock: (patch: Partial<DockConfig>) => void;
  addClipboardEntry: (text: string) => void;
  removeClipboardEntry: (id: string) => void;
  clearClipboardEntries: () => void;
  resetDashboard: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const INITIAL_DATA: AppData = {
  settings: DEFAULT_SETTINGS,
  profile: DEFAULT_PROFILE,
  categories: DEFAULT_CATEGORIES,
  apps: DEFAULT_APPS,
  favorites: [],
  notes: [],
  todos: [],
  widgets: DEFAULT_WIDGETS,
  dock: DEFAULT_DOCK,
  clipboard: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [ready, setReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(() =>
    store.getStorageStatus(),
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* ------------------------------------------------------------ hydrate */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const keys = [
        StorageKeys.settings,
        StorageKeys.profile,
        StorageKeys.categories,
        StorageKeys.apps,
        StorageKeys.favorites,
        StorageKeys.notes,
        StorageKeys.todos,
        StorageKeys.widgets,
        StorageKeys.dock,
        StorageKeys.clipboard,
      ];
      const raw = await store.readAll(keys);
      if (cancelled) return;

      const categories = normalizeCategories(raw[StorageKeys.categories]);
      const apps = normalizeApps(raw[StorageKeys.apps], categories);
      const dock = normalizeDock(raw[StorageKeys.dock], apps);

      setData({
        settings: normalizeSettings(raw[StorageKeys.settings]),
        profile: normalizeProfile(raw[StorageKeys.profile]),
        categories,
        apps,
        favorites: normalizeFavorites(raw[StorageKeys.favorites]),
        notes: normalizeNotes(raw[StorageKeys.notes]),
        todos: normalizeTodos(raw[StorageKeys.todos]),
        widgets: normalizeWidgets(raw[StorageKeys.widgets]),
        dock,
        clipboard: normalizeClipboard(raw[StorageKeys.clipboard]),
      });
      setReady(true);
      setStorageStatus(store.getStorageStatus());
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ----------------------------------------------------------- persist */
  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.settings, data.settings);
  }, [ready, data.settings]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.profile, data.profile);
  }, [ready, data.profile]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.categories, data.categories);
  }, [ready, data.categories]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.apps, data.apps);
  }, [ready, data.apps]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.favorites, data.favorites);
  }, [ready, data.favorites]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.notes, data.notes);
  }, [ready, data.notes]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.todos, data.todos);
  }, [ready, data.todos]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.widgets, data.widgets);
  }, [ready, data.widgets]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.dock, data.dock);
  }, [ready, data.dock]);

  useEffect(() => {
    if (!ready) return;
    void store.write(StorageKeys.clipboard, data.clipboard);
  }, [ready, data.clipboard]);

  /* ----------------------------------------------------------- actions */
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({
      ...prev,
      settings: normalizeSettings({ ...prev.settings, ...patch }),
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setData((prev) => ({
      ...prev,
      profile: normalizeProfile({ ...prev.profile, ...patch }),
    }));
  }, []);

  const createCategory = useCallback(
    ({ name, accent }: { name: string; accent?: string }) => {
      const category: Category = {
        id: uid("cat"),
        name: name.trim() || "Untitled",
        accent: accent ?? "#6366f1",
      };
      setData((prev) => ({
        ...prev,
        categories: [...prev.categories, category],
      }));
      return category;
    },
    [],
  );

  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((category) =>
        category.id === id ? { ...category, ...patch } : category,
      ),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData((prev) => {
      const remaining = prev.categories.filter((category) => category.id !== id);
      const fallbackId = remaining[0]?.id ?? "";
      return {
        ...prev,
        categories: remaining.length ? remaining : prev.categories,
        // Apps are never deleted with their category — they are reassigned.
        apps: prev.apps.map((app) =>
          app.categoryId === id ? { ...app, categoryId: fallbackId } : app,
        ),
      };
    });
  }, []);

  const createApp = useCallback(
    (input: {
      name: string;
      target: string;
      kind: AppEntry["kind"];
      categoryId: string;
      iconText?: string;
    }) => {
      const app: AppEntry = {
        id: uid("app"),
        name: input.name.trim() || "Untitled",
        target: input.target.trim(),
        kind: input.kind,
        categoryId: input.categoryId,
        iconText: input.iconText?.trim() || input.name.trim().slice(0, 2) || "?",
      };
      setData((prev) => ({ ...prev, apps: [...prev.apps, app] }));
      return app;
    },
    [],
  );

  const updateApp = useCallback((id: string, patch: Partial<AppEntry>) => {
    setData((prev) => ({
      ...prev,
      apps: prev.apps.map((app) => (app.id === id ? { ...app, ...patch } : app)),
    }));
  }, []);

  const deleteApp = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      apps: prev.apps.filter((app) => app.id !== id),
      dock: {
        ...prev.dock,
        appIds: prev.dock.appIds.filter((dockId) => dockId !== id),
      },
    }));
  }, []);

  const toggleFavorite = useCallback((url: string, title?: string) => {
    setData((prev) => {
      const exists = prev.favorites.find((favorite) => favorite.url === url);
      if (exists) {
        return {
          ...prev,
          favorites: prev.favorites.filter((favorite) => favorite.id !== exists.id),
        };
      }
      return {
        ...prev,
        favorites: [
          {
            id: uid("fav"),
            url,
            title: title?.trim() || url,
            addedAt: Date.now(),
          },
          ...prev.favorites,
        ],
      };
    });
  }, []);

  const isFavorite = useCallback(
    (url: string) => data.favorites.some((favorite) => favorite.url === url),
    [data.favorites],
  );

  const addNote = useCallback(
    (input: { title?: string; body?: string }) => {
      const note: Note = {
        id: uid("note"),
        title: input.title?.trim() || "Untitled note",
        body: input.body ?? "",
        pinned: false,
        updatedAt: Date.now(),
      };
      setData((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
      return note;
    },
    [],
  );

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note,
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== id),
    }));
  }, []);

  const addTodo = useCallback(
    (input: { title: string; priority?: Todo["priority"]; due?: string | null }) => {
      const todo: Todo = {
        id: uid("todo"),
        title: input.title.trim(),
        done: false,
        priority: input.priority ?? "medium",
        due: input.due ?? null,
        createdAt: Date.now(),
      };
      setData((prev) => ({ ...prev, todos: [todo, ...prev.todos] }));
      return todo;
    },
    [],
  );

  const updateTodo = useCallback((id: string, patch: Partial<Todo>) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
    }));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    }));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.filter((todo) => todo.id !== id),
    }));
  }, []);

  const addClipboardEntry = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setData((prev) => {
      const withoutDuplicate = prev.clipboard.filter((entry) => entry.text !== trimmed);
      const entry: ClipboardEntry = {
        id: uid("clip"),
        text: trimmed,
        createdAt: Date.now(),
      };
      return { ...prev, clipboard: [entry, ...withoutDuplicate].slice(0, 50) };
    });
  }, []);

  const removeClipboardEntry = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      clipboard: prev.clipboard.filter((entry) => entry.id !== id),
    }));
  }, []);

  const clearClipboardEntries = useCallback(() => {
    setData((prev) => ({ ...prev, clipboard: [] }));
  }, []);

  const updateWidget = useCallback(
    (id: WidgetId, patch: Partial<WidgetMap[WidgetId]>) => {
      setData((prev) => ({
        ...prev,
        widgets: {
          ...prev.widgets,
          [id]: { ...prev.widgets[id], ...patch },
        },
      }));
    },
    [],
  );

  const updateDock = useCallback((patch: Partial<DockConfig>) => {
    setData((prev) => ({
      ...prev,
      dock: { ...prev.dock, ...patch },
    }));
  }, []);

  const resetDashboard = useCallback(async () => {
    await store.remove([
      StorageKeys.settings,
      StorageKeys.profile,
      StorageKeys.categories,
      StorageKeys.apps,
      StorageKeys.favorites,
      StorageKeys.notes,
      StorageKeys.todos,
      StorageKeys.widgets,
      StorageKeys.dock,
      StorageKeys.windows,
      StorageKeys.clipboard,
    ]);
    setData(INITIAL_DATA);
    setStorageStatus(store.getStorageStatus());
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...data,
      ready,
      storageStatus,
      updateSettings,
      updateProfile,
      createCategory,
      updateCategory,
      deleteCategory,
      createApp,
      updateApp,
      deleteApp,
      toggleFavorite,
      isFavorite,
      addNote,
      updateNote,
      deleteNote,
      addTodo,
      updateTodo,
      toggleTodo,
      deleteTodo,
      updateWidget,
      updateDock,
      addClipboardEntry,
      removeClipboardEntry,
      clearClipboardEntries,
      resetDashboard,
    }),
    [
      data,
      ready,
      storageStatus,
      updateSettings,
      updateProfile,
      createCategory,
      updateCategory,
      deleteCategory,
      createApp,
      updateApp,
      deleteApp,
      toggleFavorite,
      isFavorite,
      addNote,
      updateNote,
      deleteNote,
      addTodo,
      updateTodo,
      toggleTodo,
      deleteTodo,
      updateWidget,
      updateDock,
      addClipboardEntry,
      removeClipboardEntry,
      clearClipboardEntries,
      resetDashboard,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside <AppProvider>");
  }
  return context;
}
