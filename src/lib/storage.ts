/**
 * Persistence layer.
 *
 * SmritiTab runs both as a packaged Chrome extension (where `chrome.storage.local`
 * is available and survives browser restarts) and as a plain web page during
 * development (where only `localStorage` exists). This module hides that
 * difference behind one small, well tested API and guarantees that:
 *
 *  - reads never throw (corrupt payloads fall back to a safe default),
 *  - writes for the same key are serialised so a slow write can never overwrite
 *    a newer value (no lost updates),
 *  - the backend is probed at runtime and degrades to memory if neither
 *    `chrome.storage` nor `localStorage` is usable.
 */

export const STORAGE_NAMESPACE = "smrititab:v1";

/** Bump when the persisted shape changes and add a migration in `MIGRATIONS`. */
export const SCHEMA_VERSION = 1;

export const StorageKeys = {
  meta: `${STORAGE_NAMESPACE}:__meta`,
  settings: `${STORAGE_NAMESPACE}:settings`,
  profile: `${STORAGE_NAMESPACE}:profile`,
  categories: `${STORAGE_NAMESPACE}:categories`,
  apps: `${STORAGE_NAMESPACE}:apps`,
  favorites: `${STORAGE_NAMESPACE}:favorites`,
  notes: `${STORAGE_NAMESPACE}:notes`,
  todos: `${STORAGE_NAMESPACE}:todos`,
  widgets: `${STORAGE_NAMESPACE}:widgets`,
  dock: `${STORAGE_NAMESPACE}:dock`,
  windows: `${STORAGE_NAMESPACE}:windows`,
  clipboard: `${STORAGE_NAMESPACE}:clipboard`,
  quotes: `${STORAGE_NAMESPACE}:quotes`,
  weather: `${STORAGE_NAMESPACE}:weather`,
  location: `${STORAGE_NAMESPACE}:location`,
  pendingSearch: `${STORAGE_NAMESPACE}:pending-search`,
  pendingAction: `${STORAGE_NAMESPACE}:pending-action`,
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export interface StorageBackend {
  readonly name: "chrome" | "local" | "memory";
  /** `null` requests every stored key (used by the migration pass). */
  get(keys: string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

const memoryStore = new Map<string, unknown>();

export const memoryBackend: StorageBackend = {
  name: "memory",
  async get(keys) {
    const result: Record<string, unknown> = {};
    if (keys === null) {
      for (const [key, value] of memoryStore.entries()) result[key] = value;
      return result;
    }
    for (const key of keys) {
      if (memoryStore.has(key)) result[key] = memoryStore.get(key);
    }
    return result;
  },
  async set(items) {
    for (const [key, value] of Object.entries(items)) memoryStore.set(key, value);
  },
  async remove(keys) {
    for (const key of keys) memoryStore.delete(key);
  },
};

export const chromeBackend: StorageBackend = {
  name: "chrome",
  async get(keys) {
    return (await chrome.storage.local.get(keys)) as Record<string, unknown>;
  },
  async set(items) {
    await chrome.storage.local.set(items);
  },
  async remove(keys) {
    await chrome.storage.local.remove(keys);
  },
};

export const localStorageBackend: StorageBackend = {
  name: "local",
  async get(keys) {
    const result: Record<string, unknown> = {};
    const names =
      keys === null
        ? Array.from({ length: window.localStorage.length }, (_, index) =>
            window.localStorage.key(index),
          ).filter((key): key is string => typeof key === "string")
        : keys;
    for (const key of names) {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          result[key] = JSON.parse(raw) as unknown;
        } catch {
          // Corrupt entry: drop it instead of poisoning the whole slice.
          window.localStorage.removeItem(key);
        }
      }
    }
    return result;
  },
  async set(items) {
    for (const [key, value] of Object.entries(items)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  },
  async remove(keys) {
    for (const key of keys) window.localStorage.removeItem(key);
  },
};

/** Probes the available backends, preferring extension storage. */
export function detectBackend(): StorageBackend {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      return chromeBackend;
    }
  } catch {
    /* extension context invalidated — fall through */
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const probe = `${STORAGE_NAMESPACE}:__probe__`;
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return localStorageBackend;
    }
  } catch {
    /* private mode / disabled storage — fall through */
  }
  return memoryBackend;
}

export interface StorageStatus {
  backend: StorageBackend["name"];
  error: string | null;
}

type Migration = {
  /** Schema version this migration upgrades *to*. */
  to: number;
  run: (data: Record<string, unknown>) => Record<string, unknown>;
};

/**
 * Migrations are applied in ascending order. Version 1 is the initial
 * namespaced layout; the hook exists so future shape changes stay non
 * destructive (user data is always carried forward, never dropped).
 */
export const MIGRATIONS: Migration[] = [
  {
    to: 1,
    run: (data) => {
      // v0 stored slices under flat keys. Re-key them instead of discarding.
      const legacy: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith("smrititab:") && !key.startsWith(STORAGE_NAMESPACE)) {
          legacy[`${STORAGE_NAMESPACE}:${key.slice("smrititab:".length)}`] = value;
        }
      }
      return { ...legacy, ...data };
    },
  },
];

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * A namespaced, self-healing view over a storage backend.
 */
export class Store {
  backend: StorageBackend;
  status: StorageStatus;

  private writeQueues = new Map<string, Promise<void>>();

  constructor(backend: StorageBackend = detectBackend()) {
    this.backend = backend;
    this.status = { backend: backend.name, error: null };
  }

  /** Re-probes the backends (used when an extension context is invalidated). */
  refreshBackend(): void {
    this.backend = detectBackend();
    this.status = { backend: this.backend.name, error: this.status.error };
  }

  getStorageStatus(): StorageStatus {
    return { ...this.status };
  }

  private recordError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.status = { ...this.status, error: message };
  }

  /**
   * True when the failure means the extension context is gone, in which case
   * the backend has to be re-probed. Any other failure (quota, permission)
   * must NOT silently switch the backend, otherwise the dashboard would read
   * from a different store than it writes to.
   */
  private isContextInvalidated(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /context invalidated|extension context/i.test(message);
  }

  /**
   * Reads the given keys, applying migrations once for the whole namespace.
   * Never throws: on failure an empty object is returned.
   */
  async readAll(keys: string[]): Promise<Record<string, unknown>> {
    const read = async (): Promise<Record<string, unknown>> => {
      // The whole namespace is read so that the migration pass can see legacy
      // keys; the result is filtered back down to the requested keys.
      const raw = await this.backend.get(null);
      const parsed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        const value2 = parseMaybeJson(value);
        if (value2 !== undefined) parsed[key] = value2;
      }
      return parsed;
    };

    let parsed: Record<string, unknown>;
    try {
      parsed = await read();
    } catch (error) {
      this.recordError(error);
      if (this.isContextInvalidated(error)) {
        this.refreshBackend();
        try {
          parsed = await read();
        } catch {
          parsed = {};
        }
      } else {
        parsed = {};
      }
    }

    const migrated = await this.applyMigrations(parsed);

    const filtered: Record<string, unknown> = {};
    for (const key of keys) {
      if (migrated[key] !== undefined) filtered[key] = migrated[key];
    }
    return filtered;
  }

  private async applyMigrations(
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const meta = data[StorageKeys.meta];
    const from =
      meta && typeof meta === "object" && "version" in meta
        ? Number((meta as { version: unknown }).version)
        : 0;
    if (!Number.isFinite(from) || from >= SCHEMA_VERSION) {
      return data;
    }

    let migrated = data;
    for (const migration of MIGRATIONS) {
      if (migration.to > from) {
        migrated = migration.run(migrated);
      }
    }

    try {
      // Only namespaced keys are written back — foreign keys are left alone.
      const namespaced: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(migrated)) {
        if (key.startsWith(STORAGE_NAMESPACE) && key !== StorageKeys.meta) {
          namespaced[key] = value;
        }
      }
      await this.backend.set(namespaced);
      await this.backend.set({
        [StorageKeys.meta]: { version: SCHEMA_VERSION, migratedAt: Date.now() },
      });
    } catch (error) {
      this.recordError(error);
    }
    return migrated;
  }

  /** Reads a single slice, returning `fallback` when the value is missing. */
  async read<T>(key: string, fallback: T): Promise<T> {
    const all = await this.readAll([key]);
    const value = all[key];
    if (value === undefined) return fallback;
    return value as T;
  }

  /**
   * Writes a slice. Writes for the same key are queued so the last value
   * always lands last (prevents out-of-order overwrites).
   */
  write(key: string, value: unknown): Promise<void> {
    const previous = this.writeQueues.get(key) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        try {
          await this.backend.set({ [key]: value });
          if (this.status.error) this.status = { ...this.status, error: null };
        } catch (error) {
          this.recordError(error);
          if (this.isContextInvalidated(error)) {
            // The extension context was invalidated — re-probe and retry once.
            this.refreshBackend();
            try {
              await this.backend.set({ [key]: value });
            } catch {
              /* keep the recorded error */
            }
          }
        }
      })
      .finally(() => {
        if (this.writeQueues.get(key) === next) this.writeQueues.delete(key);
      });
    this.writeQueues.set(key, next);
    return next;
  }

  /** Waits until every queued write has settled (used by tests / unload). */
  async flush(): Promise<void> {
    await Promise.all([...this.writeQueues.values()].map((p) => p.catch(() => undefined)));
  }

  async remove(keys: string[]): Promise<void> {
    try {
      await this.backend.remove(keys);
    } catch (error) {
      this.recordError(error);
    }
  }
}

/** Application wide store instance. */
export const store = new Store();
