import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useChromeBookmarks } from "../hooks/useChromeBookmarks";
import {
  bookmarkGapFinalIndex,
  buildFolderTree,
  canMoveNode,
  findNode,
  folderPath,
  getFolderChildren,
  isBookmark,
  isFolder,
  isSystemFolder,
  searchBookmarks,
  type FolderTreeNode,
} from "../lib/bookmark-tree";
import type { BookmarkNode } from "../lib/chrome";
import {
  cn,
  colorFromString,
  domainOf,
  toAbsoluteUrl,
} from "../lib/utils";
import { useApp } from "../state/app-state";
import { useNavigation } from "../state/navigation";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  IconButton,
  Modal,
  Select,
  Spinner,
  TextInput,
} from "./ui";

/* ---------------------------------------------------------------- favicon */

function Favicon({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const host = domainOf(url);

  if (failed || !host) {
    return (
      <span
        aria-hidden="true"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-semibold text-white"
        style={{ backgroundColor: colorFromString(host || title) }}
      >
        {(host || title).slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
      alt=""
      width={28}
      height={28}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-7 w-7 shrink-0 rounded-lg bg-white/70 p-1 dark:bg-white/10"
    />
  );
}

/* -------------------------------------------------------------- folder tree */

interface FolderTreeProps {
  folders: FolderTreeNode[];
  selectedId: string | null;
  expanded: Set<string>;
  dropTargetId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onContextMenu: (node: BookmarkNode, x: number, y: number) => void;
  dragHandlers: {
    start: (event: DragEvent, node: BookmarkNode) => void;
    end: () => void;
    overFolder: (event: DragEvent, folderId: string) => void;
    leaveFolder: () => void;
    dropOnFolder: (event: DragEvent, folderId: string) => void;
  };
  depth?: number;
}

function FolderTree({
  folders,
  selectedId,
  expanded,
  dropTargetId,
  onSelect,
  onToggle,
  onContextMenu,
  dragHandlers,
  depth = 0,
}: FolderTreeProps) {
  return (
    <ul className={depth > 0 ? "ml-3 border-l border-slate-900/10 pl-1 dark:border-white/10" : ""}>
      {folders.map((folder) => {
        const isOpen = expanded.has(folder.id);
        const raw: BookmarkNode = {
          id: folder.id,
          title: folder.title,
          parentId: folder.parentId ?? undefined,
          children: [],
        };
        return (
          <li key={folder.id}>
            <div
              draggable={!isSystemFolder(raw)}
              onDragStart={(event) => dragHandlers.start(event, raw)}
              onDragEnd={dragHandlers.end}
              onDragOver={(event) => dragHandlers.overFolder(event, folder.id)}
              onDragLeave={dragHandlers.leaveFolder}
              onDrop={(event) => dragHandlers.dropOnFolder(event, folder.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                onContextMenu(raw, event.clientX, event.clientY);
              }}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-sm transition",
                selectedId === folder.id
                  ? "bg-gradient-to-br from-violet-500/15 to-indigo-600/15 text-slate-900 dark:text-white"
                  : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10",
                dropTargetId === folder.id &&
                  "bg-indigo-500/20 outline outline-2 outline-indigo-400",
              )}
            >
              <button
                type="button"
                aria-label={isOpen ? `Collapse ${folder.title}` : `Expand ${folder.title}`}
                aria-expanded={isOpen}
                onClick={() => onToggle(folder.id)}
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {folder.folders.length > 0 ? (
                  <Icon
                    name="chevron-down"
                    className={cn("h-3.5 w-3.5 transition-transform", !isOpen && "-rotate-90")}
                  />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => onSelect(folder.id)}
                aria-current={selectedId === folder.id ? "true" : undefined}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
              >
                <Icon name="folder" className="h-4 w-4 shrink-0 text-indigo-400" />
                <span className="truncate text-[13px]">{folder.title}</span>
              </button>
              <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                {folder.totalBookmarks}
              </span>
            </div>
            {isOpen && folder.folders.length > 0 ? (
              <FolderTree
                folders={folder.folders}
                selectedId={selectedId}
                expanded={expanded}
                dropTargetId={dropTargetId}
                onSelect={onSelect}
                onToggle={onToggle}
                onContextMenu={onContextMenu}
                dragHandlers={dragHandlers}
                depth={depth + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------- panel */

interface MenuState {
  node: BookmarkNode;
  folder: boolean;
  x: number;
  y: number;
}

export function BookmarksPanel() {
  const controller = useChromeBookmarks();
  const { tree, status, error, supported } = controller;
  const { toggleFavorite, isFavorite } = useApp();
  const { openUrl } = useNavigation();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [savingTab, setSavingTab] = useState(false);

  const [bookmarkDialog, setBookmarkDialog] = useState<
    | { mode: "create" }
    | { mode: "edit"; node: BookmarkNode }
    | null
  >(null);
  const [folderDialog, setFolderDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState<BookmarkNode | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    node: BookmarkNode;
    folder: boolean;
  } | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState("");

  const dragRef = useRef<{ id: string; folder: boolean } | null>(null);
  const [dropGap, setDropGap] = useState<number | null>(null);
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);

  const folderTree = useMemo(() => buildFolderTree(tree), [tree]);

  /* Keep a valid folder selected as the tree loads / changes externally. */
  useEffect(() => {
    if (folderTree.length === 0) return;
    setExpanded((prev) => {
      if (prev.size > 0) return prev;
      return new Set(folderTree.map((folder) => folder.id));
    });
    if (!selectedFolderId || !findNode(tree, selectedFolderId)) {
      setSelectedFolderId(folderTree[0].id);
    }
  }, [folderTree, selectedFolderId, tree]);

  /* Transient feedback messages. */
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedChildren = useMemo(
    () => (selectedFolderId ? getFolderChildren(tree, selectedFolderId) : []),
    [selectedFolderId, tree],
  );
  const subfolders = useMemo(
    () => selectedChildren.filter(isFolder),
    [selectedChildren],
  );
  const bookmarks = useMemo(
    () => selectedChildren.filter(isBookmark),
    [selectedChildren],
  );
  const breadcrumb = useMemo(
    () => (selectedFolderId ? folderPath(tree, selectedFolderId) : []),
    [selectedFolderId, tree],
  );
  const results = useMemo(
    () => (query.trim() ? searchBookmarks(tree, query) : null),
    [query, tree],
  );

  /** Every folder as a flat, indented option (for selects and move targets). */
  const flatFolders = useMemo(() => {
    const options: Array<{ id: string; label: string }> = [];
    const walk = (folders: FolderTreeNode[], prefix: string) => {
      for (const folder of folders) {
        const label = prefix ? `${prefix} / ${folder.title}` : folder.title;
        options.push({ id: folder.id, label });
        walk(folder.folders, label);
      }
    };
    walk(folderTree, "");
    return options;
  }, [folderTree]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ------------------------------------------------------------ drag&drop */

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDropGap(null);
    setDropFolderId(null);
  }, []);

  const onDragStart = useCallback((event: DragEvent, node: BookmarkNode) => {
    dragRef.current = { id: node.id, folder: isFolder(node) };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", node.id);
  }, []);

  const onRowDragOver = useCallback(
    (event: DragEvent, index: number) => {
      const drag = dragRef.current;
      if (!drag || drag.folder) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const rect = event.currentTarget.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      setDropGap(after ? index + 1 : index);
    },
    [],
  );

  const onListDragOver = useCallback((event: DragEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.folder) return;
    event.preventDefault();
    setDropGap((current) => current ?? bookmarks.length);
  }, [bookmarks.length]);

  const onListDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const drag = dragRef.current;
      const gap = dropGap;
      endDrag();
      if (!drag || drag.folder || !selectedFolderId || gap === null) return;
      const finalIndex = bookmarkGapFinalIndex(selectedChildren, drag.id, gap);
      void controller
        .moveItem(drag.id, selectedFolderId, finalIndex)
        .then((message) => {
          if (message) setNotice(message);
        });
    },
    [controller, dropGap, endDrag, selectedChildren, selectedFolderId],
  );

  const onFolderDragOver = useCallback((event: DragEvent, folderId: string) => {
    if (!dragRef.current) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropFolderId(folderId);
  }, []);

  const onFolderDrop = useCallback(
    (event: DragEvent, folderId: string) => {
      event.preventDefault();
      const drag = dragRef.current;
      endDrag();
      if (!drag) return;
      void controller.moveItem(drag.id, folderId).then((message) => {
        if (message) setNotice(message);
        else setSelectedFolderId(folderId);
      });
    },
    [controller, endDrag],
  );

  /* ---------------------------------------------------------------- menus */

  const openMenu = useCallback((node: BookmarkNode, x: number, y: number) => {
    setMenu({ node, folder: isFolder(node), x, y });
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const copyLink = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        setNotice("Link copied to the clipboard.");
      } catch {
        setNotice("The link could not be copied.");
      }
    },
    [],
  );

  /* --------------------------------------------------------------- dialogs */

  const openCreateBookmark = () => {
    setFormTitle("");
    setFormUrl("");
    setFormParentId(selectedFolderId ?? flatFolders[0]?.id ?? "");
    setFormError(null);
    setBookmarkDialog({ mode: "create" });
  };

  const openEditBookmark = (node: BookmarkNode) => {
    setFormTitle(node.title);
    setFormUrl(node.url ?? "");
    setFormError(null);
    setBookmarkDialog({ mode: "edit", node });
  };

  const submitBookmark = async () => {
    if (!bookmarkDialog) return;
    const title = formTitle.trim();
    const rawUrl = formUrl.trim();
    if (!rawUrl) {
      setFormError("Enter the address to bookmark.");
      return;
    }
    const url = rawUrl ? toAbsoluteUrl(rawUrl) : "";
    try {
      if (bookmarkDialog.mode === "create") {
        if (!formParentId) {
          setFormError("Choose a folder for the bookmark.");
          return;
        }
        await controller.createBookmarkItem({
          parentId: formParentId,
          title: title || url,
          url,
        });
        setNotice("Bookmark added.");
      } else {
        await controller.updateBookmarkItem(bookmarkDialog.node.id, { title, url });
        setNotice("Bookmark updated.");
      }
      setBookmarkDialog(null);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "The bookmark could not be saved.");
    }
  };

  const submitFolder = async () => {
    const name = formTitle.trim();
    if (!name) {
      setFormError("Give the folder a name.");
      return;
    }
    try {
      await controller.createBookmarkItem({
        parentId: formParentId || selectedFolderId || flatFolders[0]?.id || "",
        title: name,
      });
      setFolderDialog(false);
      setNotice("Folder created.");
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "The folder could not be created.");
    }
  };

  const submitMove = async () => {
    if (!moveDialog || !moveTargetId) return;
    const message = await controller.moveItem(moveDialog.id, moveTargetId);
    if (message) {
      setFormError(message);
      return;
    }
    setMoveDialog(null);
    setSelectedFolderId(moveTargetId);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await controller.removeBookmarkItem(confirmDelete.node.id, confirmDelete.folder);
      setNotice(confirmDelete.folder ? "Folder deleted." : "Bookmark deleted.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "The item could not be deleted.");
    }
    setConfirmDelete(null);
  };

  const saveTab = async () => {
    const parentId = selectedFolderId ?? flatFolders[0]?.id;
    if (!parentId) return;
    setSavingTab(true);
    const message = await controller.saveCurrentTab(parentId);
    setSavingTab(false);
    setNotice(message ?? "Current tab saved to this folder.");
  };

  /* ---------------------------------------------------------------- render */

  return (
    <section
      aria-label="Chrome bookmarks"
      className="glass-panel flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-3xl"
    >
      {/* ------------------------------------------------------------ header */}
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-900/10 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <Icon name="bookmark" className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            Bookmarks
          </h2>
          {status === "ready" ? (
            <Badge tone="violet">{flatFolders.length} folders</Badge>
          ) : null}
        </div>

        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Icon
            name="search"
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            aria-label="Search all bookmarks"
            placeholder="Search all folders…"
            className="w-full rounded-xl border border-slate-900/10 bg-white/60 py-1.5 pl-8 pr-8 text-xs outline-none placeholder:text-slate-400 focus:border-indigo-400 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear bookmark search"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" variant="primary" icon="plus" onClick={openCreateBookmark} disabled={!supported}>
            Add
          </Button>
          <Button
            size="sm"
            icon="folder"
            onClick={() => {
              setFormTitle("");
              setFormParentId(selectedFolderId ?? flatFolders[0]?.id ?? "");
              setFormError(null);
              setFolderDialog(true);
            }}
            disabled={!supported}
          >
            Folder
          </Button>
          <Button
            size="sm"
            icon="bookmark"
            onClick={() => void saveTab()}
            disabled={!supported || savingTab}
            title={supported ? "Save the current web tab here" : "Available in the Chrome extension"}
          >
            {savingTab ? "Saving…" : "Save tab"}
          </Button>
          <IconButton
            icon="refresh"
            label="Reload bookmarks"
            size="sm"
            onClick={() => void controller.refresh()}
            disabled={!supported}
          />
        </div>
      </header>

      {notice ? (
        <p role="status" className="border-b border-slate-900/10 px-4 py-2 text-xs text-indigo-600 dark:border-white/10 dark:text-indigo-300">
          {notice}
        </p>
      ) : null}

      {/* -------------------------------------------------------------- body */}
      {!supported ? (
        <div className="grid flex-1 place-items-center p-6">
          <EmptyState
            icon="bookmark"
            title="Bookmarks live in Chrome"
            description="The Chrome bookmarks API is only available in the packaged extension. Load SmritiTab via chrome://extensions to manage your real bookmark folders here."
          />
        </div>
      ) : status === "loading" && tree.length === 0 ? (
        <div className="flex flex-1 items-center justify-center gap-2 p-6 text-xs text-slate-500">
          <Spinner /> Loading your Chrome bookmarks…
        </div>
      ) : status === "error" ? (
        <div className="flex-1 p-4">
          <ErrorState
            title="Bookmarks could not be loaded"
            description={error ?? "The bookmarks API did not respond."}
            action={
              <Button size="sm" icon="refresh" onClick={() => void controller.refresh()}>
                Try again
              </Button>
            }
          />
        </div>
      ) : folderTree.length === 0 ? (
        <div className="grid flex-1 place-items-center p-6">
          <EmptyState
            icon="folder"
            title="No bookmark folders yet"
            description="Bookmark a page in Chrome and it will appear here."
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Folder navigation */}
          <nav
            aria-label="Bookmark folders"
            className="scroll-thin hidden w-60 shrink-0 overflow-y-auto border-r border-slate-900/10 p-2 sm:block dark:border-white/10"
          >
            <FolderTree
              folders={folderTree}
              selectedId={selectedFolderId}
              expanded={expanded}
              dropTargetId={dropFolderId}
              onSelect={(id) => {
                setSelectedFolderId(id);
                setQuery("");
              }}
              onToggle={toggleExpanded}
              onContextMenu={openMenu}
              dragHandlers={{
                start: onDragStart,
                end: endDrag,
                overFolder: onFolderDragOver,
                leaveFolder: () => setDropFolderId(null),
                dropOnFolder: onFolderDrop,
              }}
            />
          </nav>

          {/* Bookmark list */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Folder picker for small screens (the tree is hidden there) */}
            <div className="border-b border-slate-900/10 px-3 py-2 sm:hidden dark:border-white/10">
              <Select
                aria-label="Bookmark folder"
                value={selectedFolderId ?? ""}
                onChange={(event) => {
                  setSelectedFolderId(event.target.value);
                  setQuery("");
                }}
                className="py-1.5 text-xs"
              >
                {flatFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-900/10 px-4 py-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
              {results ? (
                <span>
                  {results.length} result{results.length === 1 ? "" : "s"} for “{query.trim()}”
                </span>
              ) : (
                breadcrumb.map((part, index) => (
                  <span key={`${part}-${index}`} className="flex items-center gap-1">
                    {index > 0 ? <Icon name="chevron-right" className="h-3 w-3" /> : null}
                    <span className={index === breadcrumb.length - 1 ? "font-medium text-slate-800 dark:text-slate-100" : ""}>
                      {part}
                    </span>
                  </span>
                ))
              )}
              {!results && subfolders.length > 0 ? (
                <span className="ml-auto hidden gap-1 md:flex">
                  {subfolders.slice(0, 4).map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="flex items-center gap-1 rounded-lg bg-slate-900/5 px-2 py-1 text-[11px] transition hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/15"
                    >
                      <Icon name="folder" className="h-3 w-3 text-indigo-400" />
                      {folder.title || "Folder"}
                    </button>
                  ))}
                </span>
              ) : null}
            </div>

            <div
              className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2"
              onDragOver={onListDragOver}
              onDrop={onListDrop}
            >
              {results ? (
                results.length === 0 ? (
                  <EmptyState
                    icon="search"
                    title="No bookmarks match"
                    description="Try a different title, site name or address."
                  />
                ) : (
                  <ul>
                    {results.map((item) => (
                      <li key={item.id} className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-900/5 dark:hover:bg-white/5">
                        <Favicon url={item.url} title={item.title} />
                        <button
                          type="button"
                          onClick={() => openUrl(item.url)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate text-sm text-slate-700 dark:text-slate-200">{item.title}</span>
                          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {domainOf(item.url)}
                            {item.path ? ` · ${item.path}` : ""}
                          </span>
                        </button>
                        <IconButton
                          icon={isFavorite(item.url) ? "star-filled" : "star"}
                          label={isFavorite(item.url) ? "Remove from favorites" : "Add to favorites"}
                          size="sm"
                          className={cn("h-7 w-7", isFavorite(item.url) && "text-amber-400")}
                          onClick={() => toggleFavorite(item.url, item.title)}
                        />
                      </li>
                    ))}
                  </ul>
                )
              ) : bookmarks.length === 0 ? (
                <EmptyState
                  icon="bookmark"
                  title="This folder is empty"
                  description="Add a bookmark, save the current tab, or drag one here from another folder."
                  action={
                    <Button size="sm" variant="primary" icon="plus" onClick={openCreateBookmark}>
                      Add bookmark
                    </Button>
                  }
                />
              ) : (
                <ul>
                  {bookmarks.map((node, index) => (
                    <li key={node.id}>
                      {dropGap === index ? (
                        <div aria-hidden="true" className="mx-2 my-0.5 h-0.5 rounded bg-indigo-500" />
                      ) : null}
                      <div
                        draggable
                        onDragStart={(event) => onDragStart(event, node)}
                        onDragEnd={endDrag}
                        onDragOver={(event) => onRowDragOver(event, index)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          openMenu(node, event.clientX, event.clientY);
                        }}
                        className="group flex cursor-grab items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-900/5 active:cursor-grabbing dark:hover:bg-white/5"
                      >
                        <Icon name="drag" className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                        <Favicon url={node.url ?? ""} title={node.title} />
                        <button
                          type="button"
                          onClick={() => node.url && openUrl(node.url)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate text-sm text-slate-700 dark:text-slate-200">
                            {node.title || node.url}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {domainOf(node.url ?? "")}
                          </span>
                        </button>
                        <IconButton
                          icon={isFavorite(node.url ?? "") ? "star-filled" : "star"}
                          label={isFavorite(node.url ?? "") ? "Remove from favorites" : "Add to favorites"}
                          size="sm"
                          className={cn(
                            "h-7 w-7",
                            isFavorite(node.url ?? "")
                              ? "text-amber-400"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                          onClick={() => node.url && toggleFavorite(node.url, node.title)}
                        />
                        <IconButton
                          icon="dots"
                          label={`More actions for ${node.title || "bookmark"}`}
                          size="sm"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={(event) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            openMenu(node, rect.right - 180, rect.bottom + 4);
                          }}
                        />
                      </div>
                      {dropGap === bookmarks.length && index === bookmarks.length - 1 ? (
                        <div aria-hidden="true" className="mx-2 my-0.5 h-0.5 rounded bg-indigo-500" />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- context menu */}
      {menu ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[300] cursor-default"
            onClick={() => setMenu(null)}
          />
          <div
            role="menu"
            aria-label="Bookmark actions"
            className="glass-panel-strong animate-scale-in fixed z-[310] w-48 overflow-hidden rounded-xl p-1"
            style={{
              left: Math.min(menu.x, window.innerWidth - 200),
              top: Math.min(menu.y, window.innerHeight - 260),
            }}
          >
            {!menu.folder ? (
              <>
                <MenuItem icon="external" label="Open" onClick={() => { if (menu.node.url) openUrl(menu.node.url); setMenu(null); }} />
                <MenuItem icon="copy" label="Copy link" onClick={() => { if (menu.node.url) void copyLink(menu.node.url); setMenu(null); }} />
                <MenuItem
                  icon="star"
                  label={menu.node.url && isFavorite(menu.node.url) ? "Remove from favorites" : "Add to favorites"}
                  onClick={() => { if (menu.node.url) toggleFavorite(menu.node.url, menu.node.title); setMenu(null); }}
                />
              </>
            ) : (
              <MenuItem icon="folder" label="Open folder" onClick={() => { setSelectedFolderId(menu.node.id); setMenu(null); }} />
            )}
            <MenuItem
              icon="edit"
              label={menu.folder ? "Rename folder" : "Edit…"}
              onClick={() => {
                if (menu.folder) {
                  setFormTitle(menu.node.title);
                  setFormError(null);
                  setBookmarkDialog({ mode: "edit", node: menu.node });
                } else {
                  openEditBookmark(menu.node);
                }
                setMenu(null);
              }}
            />
            <MenuItem
              icon="folder"
              label="Move to…"
              onClick={() => {
                setMoveTargetId(menu.node.parentId ?? flatFolders[0]?.id ?? "");
                setFormError(null);
                setMoveDialog(menu.node);
                setMenu(null);
              }}
            />
            <MenuItem
              icon="trash"
              label="Delete"
              danger
              onClick={() => {
                setConfirmDelete({ node: menu.node, folder: menu.folder });
                setMenu(null);
              }}
            />
          </div>
        </>
      ) : null}

      {/* ------------------------------------------------------ bookmark form */}
      <Modal
        open={bookmarkDialog !== null}
        title={
          bookmarkDialog?.mode === "edit"
            ? isFolder(bookmarkDialog.node)
              ? "Rename folder"
              : "Edit bookmark"
            : "Add bookmark"
        }
        onClose={() => setBookmarkDialog(null)}
        footer={
          <>
            <Button onClick={() => setBookmarkDialog(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (bookmarkDialog?.mode === "edit" && isFolder(bookmarkDialog.node)) {
                  void controller
                    .updateBookmarkItem(bookmarkDialog.node.id, { title: formTitle.trim() })
                    .then(() => setBookmarkDialog(null))
                    .catch((caught) =>
                      setFormError(caught instanceof Error ? caught.message : "Rename failed."),
                    );
                } else {
                  void submitBookmark();
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={bookmarkDialog?.mode === "edit" && bookmarkDialog.node && isFolder(bookmarkDialog.node) ? "Folder name" : "Title"} error={formError}>
            {({ id }) => (
              <TextInput
                id={id}
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder="Example site"
                autoFocus
              />
            )}
          </Field>
          {!(bookmarkDialog?.mode === "edit" && bookmarkDialog.node && isFolder(bookmarkDialog.node)) ? (
            <>
              <Field label="Address">
                {({ id }) => (
                  <TextInput
                    id={id}
                    value={formUrl}
                    onChange={(event) => setFormUrl(event.target.value)}
                    placeholder="https://example.com"
                  />
                )}
              </Field>
              {bookmarkDialog?.mode === "create" ? (
                <Field label="Folder">
                  {({ id }) => (
                    <Select id={id} value={formParentId} onChange={(event) => setFormParentId(event.target.value)}>
                      {flatFolders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              ) : null}
            </>
          ) : null}
        </div>
      </Modal>

      {/* -------------------------------------------------------- folder form */}
      <Modal
        open={folderDialog}
        title="New folder"
        onClose={() => setFolderDialog(false)}
        footer={
          <>
            <Button onClick={() => setFolderDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitFolder()}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Folder name" error={formError}>
            {({ id }) => (
              <TextInput
                id={id}
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder="Reading list"
                autoFocus
              />
            )}
          </Field>
          <Field label="Create inside">
            {({ id }) => (
              <Select id={id} value={formParentId} onChange={(event) => setFormParentId(event.target.value)}>
                {flatFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Modal>

      {/* ------------------------------------------------------------ move to */}
      <Modal
        open={moveDialog !== null}
        title="Move to folder"
        description={moveDialog?.title}
        onClose={() => setMoveDialog(null)}
        footer={
          <>
            <Button onClick={() => setMoveDialog(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitMove()}>
              Move
            </Button>
          </>
        }
      >
        <Field label="Destination folder" error={formError}>
          {({ id }) => (
            <Select id={id} value={moveTargetId} onChange={(event) => setMoveTargetId(event.target.value)}>
              {flatFolders.map((folder) => {
                const check = moveDialog
                  ? canMoveNode(tree, moveDialog.id, folder.id)
                  : { ok: true as const };
                return (
                  <option key={folder.id} value={folder.id} disabled={!check.ok}>
                    {folder.label}
                    {check.ok ? "" : " (not allowed)"}
                  </option>
                );
              })}
            </Select>
          )}
        </Field>
      </Modal>

      {/* ------------------------------------------------------------- delete */}
      <Modal
        open={confirmDelete !== null}
        title={confirmDelete?.folder ? "Delete folder?" : "Delete bookmark?"}
        description={
          confirmDelete?.folder
            ? "The folder and every bookmark inside it will be removed from Chrome."
            : "The bookmark will be removed from Chrome."
        }
        size="sm"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">{confirmDelete?.node.title}</p>
      </Modal>
    </section>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: "external" | "copy" | "star" | "edit" | "folder" | "trash";
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition",
        danger
          ? "text-rose-500 hover:bg-rose-500/10"
          : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10",
      )}
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
