/**
 * Thin, defensive wrappers around the Chrome extension APIs SmritiTab uses.
 *
 * Every function resolves with a predictable shape and never throws raw
 * `chrome.runtime.lastError` objects at the UI. When an API is unavailable
 * (web preview, permission denied, invalidated extension context) the caller
 * receives a typed `ChromeApiError` so it can render an honest empty state.
 */

import type { HistoryEntry } from "../types";
import { toAbsoluteUrl } from "./utils";

export type ChromeApiErrorReason = "unsupported" | "permission" | "failed";

export class ChromeApiError extends Error {
  reason: ChromeApiErrorReason;

  constructor(reason: ChromeApiErrorReason, message: string) {
    super(message);
    this.name = "ChromeApiError";
    this.reason = reason;
  }
}

function lastErrorMessage(): string | null {
  try {
    const err = chrome.runtime.lastError;
    return err?.message ?? null;
  } catch {
    return null;
  }
}

/** True when running inside a real extension page. */
export function isExtensionContext(): boolean {
  try {
    return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

export function hasBookmarksApi(): boolean {
  try {
    return typeof chrome !== "undefined" && Boolean(chrome.bookmarks?.getTree);
  } catch {
    return false;
  }
}

export function hasHistoryApi(): boolean {
  try {
    return typeof chrome !== "undefined" && Boolean(chrome.history?.search);
  } catch {
    return false;
  }
}

export function hasTabsApi(): boolean {
  try {
    return typeof chrome !== "undefined" && Boolean(chrome.tabs?.create);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------- bookmarks */

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
  parentId?: string;
}

export async function getBookmarkTree(): Promise<BookmarkNode[]> {
  if (!hasBookmarksApi()) {
    throw new ChromeApiError("unsupported", "The bookmarks API is not available.");
  }
  try {
    const tree = await chrome.bookmarks.getTree();
    return (tree ?? []) as BookmarkNode[];
  } catch (error) {
    const message = lastErrorMessage() ?? (error instanceof Error ? error.message : "Unknown error");
    throw new ChromeApiError(
      /permission/i.test(message) ? "permission" : "failed",
      message,
    );
  }
}

export async function createBookmark(input: {
  parentId?: string;
  title: string;
  url?: string;
}): Promise<BookmarkNode> {
  if (!hasBookmarksApi()) {
    throw new ChromeApiError("unsupported", "The bookmarks API is not available.");
  }
  try {
    const created = await chrome.bookmarks.create(input);
    return created as BookmarkNode;
  } catch (error) {
    const message = lastErrorMessage() ?? (error instanceof Error ? error.message : "Unknown error");
    throw new ChromeApiError(
      /permission/i.test(message) ? "permission" : "failed",
      message,
    );
  }
}

export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string; parentId?: string },
): Promise<BookmarkNode> {
  if (!hasBookmarksApi()) {
    throw new ChromeApiError("unsupported", "The bookmarks API is not available.");
  }
  try {
    const updated = await chrome.bookmarks.update(id, changes);
    return updated as BookmarkNode;
  } catch (error) {
    const message = lastErrorMessage() ?? (error instanceof Error ? error.message : "Unknown error");
    throw new ChromeApiError(
      /permission/i.test(message) ? "permission" : "failed",
      message,
    );
  }
}

export async function moveBookmark(
  id: string,
  parentId: string,
  index?: number,
): Promise<BookmarkNode> {
  if (!hasBookmarksApi()) {
    throw new ChromeApiError("unsupported", "The bookmarks API is not available.");
  }
  try {
    const moved = await chrome.bookmarks.move(id, parentId, index);
    return moved as BookmarkNode;
  } catch (error) {
    const message = lastErrorMessage() ?? (error instanceof Error ? error.message : "Unknown error");
    throw new ChromeApiError(
      /permission/i.test(message) ? "permission" : "failed",
      message,
    );
  }
}

export async function deleteBookmark(id: string, isFolder: boolean): Promise<void> {
  if (!hasBookmarksApi()) {
    throw new ChromeApiError("unsupported", "The bookmarks API is not available.");
  }
  try {
    if (isFolder) await chrome.bookmarks.removeTree(id);
    else await chrome.bookmarks.remove(id);
  } catch (error) {
    const message = lastErrorMessage() ?? (error instanceof Error ? error.message : "Unknown error");
    throw new ChromeApiError(
      /permission/i.test(message) ? "permission" : "failed",
      message,
    );
  }
}

/**
 * Subscribes to every bookmark mutation event (created, changed, moved,
 * removed, reordered, import finished) so the UI can re-read the tree when
 * the user edits bookmarks elsewhere in Chrome. Returns an unsubscribe
 * function; a no-op when the API is unavailable.
 */
export function subscribeToBookmarkChanges(callback: () => void): () => void {
  if (!hasBookmarksApi()) return () => undefined;
  try {
    const events = [
      chrome.bookmarks.onCreated,
      chrome.bookmarks.onRemoved,
      chrome.bookmarks.onChanged,
      chrome.bookmarks.onMoved,
      chrome.bookmarks.onChildrenReordered,
      chrome.bookmarks.onImportEnded,
    ] as const;
    for (const event of events) {
      (event as { addListener: (cb: () => void) => void }).addListener(callback);
    }
    return () => {
      for (const event of events) {
        (event as { removeListener: (cb: () => void) => void }).removeListener(callback);
      }
    };
  } catch {
    return () => undefined;
  }
}

/* --------------------------------------------------------------- history */

export async function searchHistory(params: {
  text: string;
  maxResults?: number;
  startTime?: number;
}): Promise<HistoryEntry[]> {
  if (!hasHistoryApi()) {
    throw new ChromeApiError("unsupported", "The history API is not available.");
  }
  try {
    const items = await chrome.history.search({
      text: params.text,
      maxResults: params.maxResults ?? 50,
      ...(params.startTime ? { startTime: params.startTime } : {}),
    });
    return (items ?? [])
      .filter((item) => Boolean(item.url))
      .map((item, index) => ({
        id: item.id ?? `${item.url}-${index}`,
        title: item.title?.trim() || item.url || "Untitled",
        url: item.url ?? "",
        lastVisitTime: item.lastVisitTime ?? 0,
        visitCount: item.visitCount ?? 0,
      }));
  } catch (error) {
    const message = lastErrorMessage() ?? (error instanceof Error ? error.message : "Unknown error");
    throw new ChromeApiError(
      /permission/i.test(message) ? "permission" : "failed",
      message,
    );
  }
}

/* ------------------------------------------------------------------ tabs */

export interface ActiveTabInfo {
  title: string;
  url: string;
}

/**
 * The tab the user most likely means by "the current tab". Inside a new-tab
 * page the active tab is SmritiTab itself, so in that case the most
 * recently used regular web tab is returned instead.
 */
export async function getActiveTabInfo(): Promise<ActiveTabInfo | null> {
  if (!hasTabsApi()) return null;
  try {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (active?.url && /^https?:\/\//i.test(active.url)) {
      return { title: active.title?.trim() || active.url, url: active.url };
    }
    const all = await chrome.tabs.query({});
    const webTabs = all
      .filter((tab) => tab.url && /^https?:\/\//i.test(tab.url))
      .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
    const recent = webTabs[0];
    if (!recent?.url) return null;
    return { title: recent.title?.trim() || recent.url, url: recent.url };
  } catch {
    return null;
  }
}

/**
 * Opens a URL. Uses the tabs API inside the extension (which avoids the
 * "the page is navigating itself" restriction of extension pages) and falls
 * back to `window.open` on the web.
 */
export async function openUrl(url: string, newTab = true): Promise<void> {
  const absolute = toAbsoluteUrl(url);
  if (!absolute) return;
  if (hasTabsApi()) {
    try {
      await chrome.tabs.create({ url: absolute, active: true });
      return;
    } catch (error) {
      const message = lastErrorMessage() ?? (error instanceof Error ? error.message : "Unknown error");
      throw new ChromeApiError("failed", message);
    }
  }
  const opened = window.open(absolute, newTab ? "_blank" : "_self", "noopener,noreferrer");
  if (!opened) {
    window.location.href = absolute;
  }
}

/* ------------------------------------------------------------- clipboard */

export function hasClipboardApi(): boolean {
  try {
    return typeof navigator !== "undefined" && Boolean(navigator.clipboard);
  } catch {
    return false;
  }
}

export async function readClipboardText(): Promise<string> {
  if (!hasClipboardApi()) {
    throw new ChromeApiError("unsupported", "The clipboard API is not available.");
  }
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Clipboard read failed";
    throw new ChromeApiError(
      /permission|not allowed|denied/i.test(message) ? "permission" : "failed",
      message,
    );
  }
}

export async function writeClipboardText(text: string): Promise<void> {
  if (!hasClipboardApi()) {
    throw new ChromeApiError("unsupported", "The clipboard API is not available.");
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Clipboard write failed";
    throw new ChromeApiError(
      /permission|not allowed|denied/i.test(message) ? "permission" : "failed",
      message,
    );
  }
}

/**
 * Fallback for browsers/permissions where programmatic clipboard reads are
 * blocked: the user presses the paste key and we read the event payload.
 */
export function readClipboardViaPasteEvent(timeoutMs = 12_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const onPaste = (event: Event) => {
      const pasteEvent = event as ClipboardEvent;
      cleanup();
      const text = pasteEvent.clipboardData?.getData("text/plain") ?? "";
      if (!text) {
        reject(new ChromeApiError("failed", "The clipboard did not contain any text."));
        return;
      }
      resolve(text);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cleanup();
        reject(new ChromeApiError("failed", "Paste cancelled."));
      }
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(
        new ChromeApiError(
          "failed",
          "Timed out waiting for a paste. Press Ctrl+V / ⌘V to paste.",
        ),
      );
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKeyDown);
    };
    document.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKeyDown);
  });
}

/* --------------------------------------------------------- runtime msgs */

export async function sendRuntimeMessage(message: unknown): Promise<unknown> {
  if (!isExtensionContext()) return undefined;
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return undefined;
  }
}
