import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChromeApiError,
  createBookmark,
  deleteBookmark,
  getActiveTabInfo,
  getBookmarkTree,
  hasBookmarksApi,
  moveBookmark,
  subscribeToBookmarkChanges,
  updateBookmark,
  type BookmarkNode,
} from "../lib/chrome";
import { canMoveNode, findNode, toChromeMoveIndex } from "../lib/bookmark-tree";

export type BookmarksStatus = "loading" | "ready" | "error" | "unsupported";

export interface ChromeBookmarksController {
  supported: boolean;
  status: BookmarksStatus;
  error: string | null;
  /** The raw Chrome tree (`tree[0]` is the invisible root). */
  tree: BookmarkNode[];
  refresh: () => Promise<void>;
  createBookmarkItem: (input: {
    parentId: string;
    title: string;
    url?: string;
  }) => Promise<void>;
  updateBookmarkItem: (
    id: string,
    changes: { title?: string; url?: string },
  ) => Promise<void>;
  removeBookmarkItem: (id: string, isFolder: boolean) => Promise<void>;
  /**
   * Moves an item so it ends up at `finalIndex` in the destination folder.
   * Validates the move (including circular folder moves) before calling the
   * API; resolves with an error message instead of throwing on validation
   * failures so the UI can explain why a drop was rejected.
   */
  moveItem: (
    id: string,
    targetFolderId: string,
    finalIndex?: number,
  ) => Promise<string | null>;
  saveCurrentTab: (parentId: string) => Promise<string | null>;
}

/**
 * Chrome bookmarks with live synchronisation.
 *
 * The Chrome tree is the single source of truth: every mutation goes through
 * the API and the tree is re-read afterwards. External changes (bookmark
 * manager, other extensions, sync) arrive via the native bookmark events
 * and trigger the same reload.
 */
export function useChromeBookmarks(): ChromeBookmarksController {
  const supported = hasBookmarksApi();
  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [status, setStatus] = useState<BookmarksStatus>(
    supported ? "loading" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const reloadTimer = useRef<number | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    try {
      const result = await getBookmarkTree();
      if (!mounted.current) return;
      setTree(result);
      setStatus("ready");
      setError(null);
    } catch (caught) {
      if (!mounted.current) return;
      setStatus("error");
      setError(
        caught instanceof ChromeApiError
          ? caught.message
          : "Chrome bookmarks could not be loaded.",
      );
    }
  }, [supported]);

  /* Initial load. */
  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* Live sync: any external bookmark change reloads the tree (debounced,
     because imports and sync bursts fire many events at once). */
  useEffect(() => {
    if (!supported) return;
    const schedule = () => {
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
      reloadTimer.current = window.setTimeout(() => void refresh(), 150);
    };
    const unsubscribe = subscribeToBookmarkChanges(schedule);
    return unsubscribe;
  }, [refresh, supported]);

  const createBookmarkItem = useCallback(
    async (input: { parentId: string; title: string; url?: string }) => {
      await createBookmark(input);
      await refresh();
    },
    [refresh],
  );

  const updateBookmarkItem = useCallback(
    async (id: string, changes: { title?: string; url?: string }) => {
      await updateBookmark(id, changes);
      await refresh();
    },
    [refresh],
  );

  const removeBookmarkItem = useCallback(
    async (id: string, isFolder: boolean) => {
      await deleteBookmark(id, isFolder);
      await refresh();
    },
    [refresh],
  );

  const moveItem = useCallback(
    async (id: string, targetFolderId: string, finalIndex?: number) => {
      const check = canMoveNode(tree, id, targetFolderId);
      if (!check.ok) return check.reason ?? "That move is not allowed.";

      const node = findNode(tree, id);
      if (!node) return "That item no longer exists.";
      const target = findNode(tree, targetFolderId);
      const siblings = target?.children ?? [];
      const sameParent = node.parentId === targetFolderId;
      const oldIndex = sameParent
        ? siblings.findIndex((child) => child.id === id)
        : -1;
      const desiredFinal =
        finalIndex === undefined
          ? siblings.filter((child) => child.id !== id).length
          : Math.max(
              0,
              Math.min(
                finalIndex,
                siblings.filter((child) => child.id !== id).length,
              ),
            );

      if (sameParent && desiredFinal === oldIndex) return null; // no-op drop

      const chromeIndex = toChromeMoveIndex({
        sameParent,
        oldIndex,
        finalIndex: desiredFinal,
      });

      try {
        await moveBookmark(id, targetFolderId, chromeIndex);
        await refresh();
        return null;
      } catch (caught) {
        return caught instanceof ChromeApiError
          ? caught.message
          : "The item could not be moved.";
      }
    },
    [refresh, tree],
  );

  const saveCurrentTab = useCallback(
    async (parentId: string) => {
      const tab = await getActiveTabInfo();
      if (!tab) {
        return "No web tab was found to save. Open a page first, then try again.";
      }
      try {
        await createBookmark({ parentId, title: tab.title, url: tab.url });
        await refresh();
        return null;
      } catch (caught) {
        return caught instanceof ChromeApiError
          ? caught.message
          : "The tab could not be saved.";
      }
    },
    [refresh],
  );

  return {
    supported,
    status,
    error,
    tree,
    refresh,
    createBookmarkItem,
    updateBookmarkItem,
    removeBookmarkItem,
    moveItem,
    saveCurrentTab,
  };
}
