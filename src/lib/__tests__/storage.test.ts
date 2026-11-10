import { describe, expect, it } from "vitest";
import {
  SCHEMA_VERSION,
  STORAGE_NAMESPACE,
  StorageKeys,
  Store,
  memoryBackend,
  type StorageBackend,
} from "../storage";

/** A backend whose writes can be made to fail on demand. */
function createFlakyBackend(): StorageBackend & {
  failWrites: boolean;
  snapshot: () => Record<string, unknown>;
} {
  const data = new Map<string, unknown>();
  return {
    name: "memory",
    failWrites: false,
    async get(keys) {
      const result: Record<string, unknown> = {};
      if (keys === null) {
        for (const [key, value] of data.entries()) result[key] = value;
        return result;
      }
      for (const key of keys) {
        if (data.has(key)) result[key] = data.get(key);
      }
      return result;
    },
    async set(items) {
      if (this.failWrites) throw new Error("storage unavailable");
      for (const [key, value] of Object.entries(items)) data.set(key, value);
    },
    async remove(keys) {
      for (const key of keys) data.delete(key);
    },
    snapshot: () => Object.fromEntries(data.entries()),
  };
}

describe("store", () => {
  it("round-trips a value", async () => {
    const store = new Store(memoryBackend);
    await store.write(StorageKeys.notes, [{ id: "n1" }]);
    await store.flush();
    expect(await store.read(StorageKeys.notes, [])).toEqual([{ id: "n1" }]);
  });

  it("returns the fallback for a missing key", async () => {
    const store = new Store(memoryBackend);
    expect(await store.read(StorageKeys.todos, [])).toEqual([]);
  });

  it("serialises concurrent writes so the newest value wins", async () => {
    const backend = createFlakyBackend();
    const store = new Store(backend);
    await Promise.all([
      store.write(StorageKeys.settings, { theme: "light" }),
      store.write(StorageKeys.settings, { theme: "dark" }),
      store.write(StorageKeys.settings, { theme: "system" }),
    ]);
    await store.flush();
    expect(await store.read(StorageKeys.settings, null)).toEqual({ theme: "system" });
  });

  it("keeps the last written value when a write fails", async () => {
    const backend = createFlakyBackend();
    const store = new Store(backend);
    await store.write(StorageKeys.profile, { name: "Ada" });
    await store.flush();
    backend.failWrites = true;
    await store.write(StorageKeys.profile, { name: "Grace" });
    await store.flush();
    expect(store.getStorageStatus().error).toBeTruthy();
    expect(await store.read(StorageKeys.profile, null)).toEqual({ name: "Ada" });
  });

  it("migrates legacy keys to the namespaced layout without losing data", async () => {
    const backend = createFlakyBackend();
    await backend.set({
      "smrititab:notes": [{ id: "legacy" }],
      "smrititab:profile": { name: "Legacy" },
    });
    const store = new Store(backend);
    const notes = await store.read(StorageKeys.notes, []);
    expect(notes).toEqual([{ id: "legacy" }]);
    expect(await store.read(StorageKeys.profile, null)).toEqual({ name: "Legacy" });
    // The migration is written back so it only ever runs once.
    expect(backend.snapshot()[StorageKeys.meta]).toMatchObject({
      version: SCHEMA_VERSION,
    });
  });

  it("survives a corrupt JSON payload", async () => {
    const backend = createFlakyBackend();
    await backend.set({ [StorageKeys.notes]: "{not json" });
    const store = new Store(backend);
    expect(await store.read(StorageKeys.notes, "fallback")).toBe("fallback");
  });

  it("only returns the requested keys", async () => {
    const backend = createFlakyBackend();
    await backend.set({
      [StorageKeys.notes]: [1],
      [StorageKeys.todos]: [2],
    });
    const store = new Store(backend);
    const all = await store.readAll([StorageKeys.notes]);
    expect(Object.keys(all)).toEqual([StorageKeys.notes]);
  });

  it("uses a namespaced key format", () => {
    expect(StorageKeys.notes.startsWith(STORAGE_NAMESPACE)).toBe(true);
  });
});
