import type { BookmarkNode } from "./chrome";

/**
 * Pure helpers for working with the Chrome bookmark tree.
 *
 * Chrome remains the source of truth — these functions only *read* the tree
 * returned by `chrome.bookmarks.getTree()` and compute safe move operations.
 * Nothing here mutates the input or talks to the API, so all of it is unit
 * tested.
 */

export interface FolderTreeNode {
  id: string;
  title: string;
  parentId: string | null;
  /** Sub-folders in Chrome's stored order. */
  folders: FolderTreeNode[];
  /** Bookmarks directly inside this folder, in Chrome's stored order. */
  bookmarks: BookmarkNode[];
  /** Total bookmarks in this folder and all descendants. */
  totalBookmarks: number;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  parentId: string;
  /** Human readable folder path, e.g. "Bookmarks Bar / Work / Docs". */
  path: string;
}

export function isFolder(node: BookmarkNode): boolean {
  return Array.isArray(node.children);
}

export function isBookmark(node: BookmarkNode): boolean {
  return typeof node.url === "string" && node.url.length > 0;
}

/** Top-level Chrome folders (Bookmarks Bar, Other, Mobile) cannot be moved. */
export function isSystemFolder(node: BookmarkNode): boolean {
  return node.parentId === "0" || ["1", "2", "3"].includes(node.id);
}

function countBookmarks(node: BookmarkNode): number {
  if (isBookmark(node)) return 1;
  return (node.children ?? []).reduce((sum, child) => sum + countBookmarks(child), 0);
}

function toFolderNode(node: BookmarkNode): FolderTreeNode {
  const children = node.children ?? [];
  return {
    id: node.id,
    title: node.title || "Untitled folder",
    parentId: node.parentId ?? null,
    folders: children.filter(isFolder).map(toFolderNode),
    bookmarks: children.filter(isBookmark),
    totalBookmarks: countBookmarks(node),
  };
}

/**
 * Builds the navigable folder tree. The invisible Chrome root ("0") is
 * skipped; its children (Bookmarks Bar, Other Bookmarks, …) become the
 * top level.
 */
export function buildFolderTree(tree: BookmarkNode[]): FolderTreeNode[] {
  const root = tree[0];
  if (!root?.children) return [];
  return root.children.filter(isFolder).map(toFolderNode);
}

/** Depth-first search for any node (folder or bookmark) by id. */
export function findNode(nodes: BookmarkNode[], id: string): BookmarkNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Raw ordered children of a folder (folders and bookmarks mixed). */
export function getFolderChildren(
  tree: BookmarkNode[],
  folderId: string,
): BookmarkNode[] {
  const folder = findNode(tree, folderId);
  return folder?.children ? [...folder.children] : [];
}

/** Titles from the top-level folder down to `folderId` (inclusive). */
export function folderPath(tree: BookmarkNode[], folderId: string): string[] {
  const path: string[] = [];
  let current = findNode(tree, folderId);
  while (current && current.id !== "0") {
    path.unshift(current.title || "Untitled folder");
    current = current.parentId ? findNode(tree, current.parentId) : null;
  }
  return path;
}

/** All bookmarks in the tree, each with its folder path. */
export function flattenBookmarks(tree: BookmarkNode[]): SearchResult[] {
  const results: SearchResult[] = [];
  const walk = (nodes: BookmarkNode[], path: string[]) => {
    for (const node of nodes) {
      if (isBookmark(node) && node.url) {
        results.push({
          id: node.id,
          title: node.title || node.url,
          url: node.url,
          parentId: node.parentId ?? "",
          path: path.join(" / "),
        });
      }
      if (node.children) {
        walk(node.children, [...path, node.title || "Untitled folder"]);
      }
    }
  };
  const root = tree[0];
  if (root?.children) walk(root.children, []);
  return results;
}

/** Case-insensitive search across every folder, including nested ones. */
export function searchBookmarks(tree: BookmarkNode[], query: string): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return flattenBookmarks(tree).filter((item) => {
    let host = "";
    try {
      host = new URL(item.url).hostname;
    } catch {
      host = "";
    }
    return (
      item.title.toLowerCase().includes(needle) ||
      item.url.toLowerCase().includes(needle) ||
      host.includes(needle)
    );
  });
}

/** True when `candidateId` is `folderId` itself or one of its descendants. */
export function isWithinFolder(
  tree: BookmarkNode[],
  folderId: string,
  candidateId: string,
): boolean {
  const folder = findNode(tree, folderId);
  if (!folder) return false;
  if (folder.id === candidateId) return true;
  return findNode([folder], candidateId) !== null;
}

export interface MoveCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Validates a drag-and-drop / move operation before it reaches the API:
 * no moving system folders, no dropping onto bookmarks, and above all no
 * circular moves (a folder into itself or one of its descendants).
 */
export function canMoveNode(
  tree: BookmarkNode[],
  nodeId: string,
  targetFolderId: string,
): MoveCheck {
  const node = findNode(tree, nodeId);
  if (!node) return { ok: false, reason: "That item no longer exists." };
  const target = findNode(tree, targetFolderId);
  if (!target) return { ok: false, reason: "The destination folder no longer exists." };
  if (!isFolder(target)) return { ok: false, reason: "You can only move items into a folder." };
  if (node.id === target.id) return { ok: false, reason: "A folder cannot be moved into itself." };
  if (isSystemFolder(node)) {
    return { ok: false, reason: "Chrome's built-in folders cannot be moved." };
  }
  if (isFolder(node) && isWithinFolder(tree, node.id, target.id)) {
    return {
      ok: false,
      reason: "A folder cannot be moved into one of its own subfolders.",
    };
  }
  return { ok: true };
}

/**
 * Converts a desired *final* index (the position in the sibling list once
 * the move completes) into the index Chrome expects.
 *
 * Chrome measures the destination index in the pre-removal coordinate space
 * when reordering inside one folder, so moving down needs +1 (moving up and
 * cross-folder moves need no adjustment). See the Chromium discussion of
 * `bookmarks.move` unexpected behaviour.
 */
export function toChromeMoveIndex(options: {
  sameParent: boolean;
  oldIndex: number;
  finalIndex: number;
}): number {
  const { sameParent, oldIndex, finalIndex } = options;
  if (sameParent && finalIndex > oldIndex) return finalIndex + 1;
  return finalIndex;
}

/**
 * Given the ordered sibling ids of the destination folder, the dragged id
 * and the sibling the item should be inserted *before* (null = at the end),
 * returns the item's index in the final arrangement.
 */
export function insertionFinalIndex(
  siblingIds: string[],
  draggedId: string,
  insertBeforeId: string | null,
): number {
  const cleaned = siblingIds.filter((id) => id !== draggedId);
  if (insertBeforeId === null) return cleaned.length;
  const index = cleaned.indexOf(insertBeforeId);
  return index === -1 ? cleaned.length : index;
}

/**
 * The draggable list shows bookmarks only, but Chrome indices cover folders
 * too. This maps a gap in the bookmark-only list (0 = before the first
 * bookmark, n = after the last) to a final index in the full sibling list.
 */
export function bookmarkGapFinalIndex(
  children: BookmarkNode[],
  draggedId: string,
  gap: number,
): number {
  const bookmarkIds = children.filter(isBookmark).map((child) => child.id);
  const anchorId = gap < bookmarkIds.length ? bookmarkIds[gap] : null;
  return insertionFinalIndex(
    children.map((child) => child.id),
    draggedId,
    anchorId,
  );
}
