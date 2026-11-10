import { describe, expect, it } from "vitest";
import type { BookmarkNode } from "../chrome";
import {
  bookmarkGapFinalIndex,
  buildFolderTree,
  canMoveNode,
  folderPath,
  insertionFinalIndex,
  searchBookmarks,
  toChromeMoveIndex,
} from "../bookmark-tree";

/**
 * Fixture:
 * root(0)
 * ├─ Bookmarks Bar(1)
 * │   ├─ Work(10)
 * │   │   ├─ Docs(11)
 * │   │   │   └─ Spec(b1)
 * │   │   └─ Mail(b2)
 * │   └─ News(b3)
 * └─ Other Bookmarks(2)
 *     └─ Later(b4)
 */
const tree: BookmarkNode[] = [
  {
    id: "0",
    title: "",
    children: [
      {
        id: "1",
        title: "Bookmarks Bar",
        parentId: "0",
        children: [
          {
            id: "10",
            title: "Work",
            parentId: "1",
            children: [
              {
                id: "11",
                title: "Docs",
                parentId: "10",
                children: [
                  { id: "b1", title: "Spec", url: "https://docs.example.com/spec", parentId: "11" },
                ],
              },
              { id: "b2", title: "Mail", url: "https://mail.example.com", parentId: "10" },
            ],
          },
          { id: "b3", title: "News", url: "https://news.example.com", parentId: "1" },
        ],
      },
      {
        id: "2",
        title: "Other Bookmarks",
        parentId: "0",
        children: [
          { id: "b4", title: "Later", url: "https://later.example.com", parentId: "2" },
        ],
      },
    ],
  },
];

describe("bookmark tree", () => {
  it("builds the folder tree without the invisible root", () => {
    const folders = buildFolderTree(tree);
    expect(folders.map((folder) => folder.id)).toEqual(["1", "2"]);
    const bar = folders[0];
    expect(bar.folders[0].id).toBe("10");
    expect(bar.folders[0].folders[0].id).toBe("11");
    expect(bar.bookmarks.map((bookmark) => bookmark.id)).toEqual(["b3"]);
  });

  it("counts bookmarks recursively", () => {
    const folders = buildFolderTree(tree);
    expect(folders[0].totalBookmarks).toBe(3);
    expect(folders[0].folders[0].totalBookmarks).toBe(2);
  });

  it("computes folder paths", () => {
    expect(folderPath(tree, "11")).toEqual(["Bookmarks Bar", "Work", "Docs"]);
    expect(folderPath(tree, "1")).toEqual(["Bookmarks Bar"]);
  });
});

describe("bookmark search", () => {
  it("finds bookmarks in nested folders with their path", () => {
    const results = searchBookmarks(tree, "spec");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("b1");
    expect(results[0].path).toBe("Bookmarks Bar / Work / Docs");
  });

  it("matches hostnames and is case-insensitive", () => {
    expect(searchBookmarks(tree, "MAIL.example").map((r) => r.id)).toEqual(["b2"]);
    expect(searchBookmarks(tree, "example.com")).toHaveLength(4);
  });

  it("returns nothing for a blank query", () => {
    expect(searchBookmarks(tree, "  ")).toEqual([]);
  });
});

describe("move validation", () => {
  it("allows moving a bookmark between folders", () => {
    expect(canMoveNode(tree, "b3", "2").ok).toBe(true);
    expect(canMoveNode(tree, "b1", "10").ok).toBe(true);
  });

  it("prevents circular folder movements", () => {
    expect(canMoveNode(tree, "10", "11").ok).toBe(false); // Work into its own Docs
    expect(canMoveNode(tree, "10", "10").ok).toBe(false); // into itself
    expect(canMoveNode(tree, "11", "10").ok).toBe(true); // Docs up into Work is fine
  });

  it("prevents moving Chrome's built-in folders", () => {
    expect(canMoveNode(tree, "1", "2").ok).toBe(false);
    expect(canMoveNode(tree, "2", "1").ok).toBe(false);
  });

  it("rejects drops onto bookmarks and missing nodes", () => {
    expect(canMoveNode(tree, "b3", "b4").ok).toBe(false);
    expect(canMoveNode(tree, "missing", "1").ok).toBe(false);
  });
});

describe("move index math", () => {
  it("adds one when moving down inside the same folder (Chrome quirk)", () => {
    expect(toChromeMoveIndex({ sameParent: true, oldIndex: 1, finalIndex: 3 })).toBe(4);
  });

  it("uses the final index when moving up or across folders", () => {
    expect(toChromeMoveIndex({ sameParent: true, oldIndex: 3, finalIndex: 1 })).toBe(1);
    expect(toChromeMoveIndex({ sameParent: false, oldIndex: -1, finalIndex: 2 })).toBe(2);
  });

  it("computes final indices excluding the dragged item", () => {
    expect(insertionFinalIndex(["a", "b", "c", "d"], "a", "c")).toBe(1);
    expect(insertionFinalIndex(["a", "b", "c", "d"], "a", null)).toBe(3);
    expect(insertionFinalIndex(["a", "b", "c"], "b", "a")).toBe(0);
  });

  it("maps bookmark-list gaps onto full sibling indices (folders included)", () => {
    const children: BookmarkNode[] = [
      { id: "f1", title: "Folder", children: [] },
      { id: "b1", title: "One", url: "https://one.example.com" },
      { id: "b2", title: "Two", url: "https://two.example.com" },
    ];
    // Dropping after the last bookmark lands at the end of the folder.
    expect(bookmarkGapFinalIndex(children, "b1", 2)).toBe(2);
    // Dropping before the first bookmark lands right after the folder row.
    expect(bookmarkGapFinalIndex(children, "b2", 0)).toBe(1);
  });
});
