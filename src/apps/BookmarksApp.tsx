import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChromeApiError,
  createBookmark,
  deleteBookmark,
  getBookmarkTree,
  hasBookmarksApi,
  updateBookmark,
  type BookmarkNode,
} from "../lib/chrome";
import { domainOf } from "../lib/utils";
import { useApp } from "../state/app-state";
import { useNavigation } from "../state/navigation";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Modal,
  Select,
  Spinner,
  TextInput,
} from "../components/ui";

interface FlatBookmark {
  id: string;
  title: string;
  url?: string;
  path: string;
  isFolder: boolean;
  depth: number;
}

function flatten(nodes: BookmarkNode[], path = ""): FlatBookmark[] {
  const result: FlatBookmark[] = [];
  for (const node of nodes) {
    const nodePath = path ? `${path} / ${node.title}` : node.title;
    if (node.children) {
      result.push({
        id: node.id,
        title: node.title || "Untitled folder",
        path: nodePath,
        isFolder: true,
        depth: path.split(" / ").length,
      });
      result.push(...flatten(node.children, nodePath));
    } else {
      result.push({
        id: node.id,
        title: node.title || node.url || "Untitled",
        url: node.url,
        path: nodePath,
        isFolder: false,
        depth: path.split(" / ").length,
      });
    }
  }
  return result;
}

export function BookmarksApp() {
  const { favorites, toggleFavorite } = useApp();
  const { openUrl } = useNavigation();
  const [tree, setTree] = useState<BookmarkNode[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "unsupported">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [dialog, setDialog] = useState<
    | { mode: "create"; parentId: string }
    | { mode: "edit"; node: FlatBookmark }
    | null
  >(null);
  const [confirm, setConfirm] = useState<FlatBookmark | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [parentId, setParentId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const supported = hasBookmarksApi();

  const load = useCallback(async () => {
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    try {
      const result = await getBookmarkTree();
      setTree(result);
      setStatus("ready");
      setError(null);
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ChromeApiError
          ? caught.message
          : "The bookmarks could not be loaded.",
      );
    }
  }, [supported]);

  useEffect(() => {
    void load();
  }, [load]);

  const flat = useMemo(() => (tree ? flatten(tree) : []), [tree]);
  const folders = useMemo(() => flat.filter((node) => node.isFolder), [flat]);
  const links = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return flat.filter((node) => {
      if (node.isFolder) return false;
      if (!needle) return true;
      return (
        node.title.toLowerCase().includes(needle) ||
        (node.url ?? "").toLowerCase().includes(needle)
      );
    });
  }, [flat, filter]);

  const defaultParent = useMemo(() => {
    const other = folders.find((folder) => /other bookmarks/i.test(folder.title));
    return other?.id ?? folders[0]?.id ?? "";
  }, [folders]);

  useEffect(() => {
    if (parentId) return;
    setParentId(defaultParent);
  }, [defaultParent, parentId]);

  const openCreate = () => {
    setTitle("");
    setUrl("");
    setParentId(defaultParent);
    setFormError(null);
    setDialog({ mode: "create", parentId: defaultParent });
  };

  const openEdit = (node: FlatBookmark) => {
    setTitle(node.title);
    setUrl(node.url ?? "");
    setFormError(null);
    setDialog({ mode: "edit", node });
  };

  const submit = async () => {
    if (!dialog) return;
    if (!title.trim()) {
      setFormError("Give the bookmark a title.");
      return;
    }
    try {
      if (dialog.mode === "create") {
        if (!url.trim()) {
          setFormError("Enter the address to bookmark.");
          return;
        }
        await createBookmark({
          parentId: dialog.parentId || defaultParent,
          title: title.trim(),
          url: url.trim(),
        });
      } else {
        await updateBookmark(dialog.node.id, {
          title: title.trim(),
          ...(dialog.node.url ? { url: url.trim() } : {}),
        });
      }
      setDialog(null);
      await load();
    } catch (caught) {
      setFormError(
        caught instanceof ChromeApiError ? caught.message : "The bookmark could not be saved.",
      );
    }
  };

  const remove = async () => {
    if (!confirm) return;
    try {
      await deleteBookmark(confirm.id, confirm.isFolder);
      setConfirm(null);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ChromeApiError ? caught.message : "The bookmark could not be removed.",
      );
      setConfirm(null);
    }
  };

  /* --------------------------------------------- local fallback (no API) */
  if (!supported) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-900/10 p-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
          The Chrome bookmarks API is only available inside the packaged
          extension. These are your saved favorites instead.
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
          {favorites.length === 0 ? (
            <EmptyState
              icon="bookmark"
              title="No saved links"
              description="Add links from the Favorites app to see them here."
            />
          ) : (
            <ul className="space-y-1">
              {favorites.map((favorite) => (
                <li key={favorite.id} className="group flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openUrl(favorite.url)}
                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <span className="block truncate">{favorite.title}</span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {domainOf(favorite.url)}
                    </span>
                  </button>
                  <IconButton
                    icon="trash"
                    label={`Remove ${favorite.title}`}
                    size="sm"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => toggleFavorite(favorite.url, favorite.title)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-slate-900/10 p-3 dark:border-white/10">
        <TextInput
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter bookmarks…"
          aria-label="Filter bookmarks"
          className="py-1.5 text-xs"
        />
        <Button size="sm" variant="primary" icon="plus" onClick={openCreate}>
          Add
        </Button>
        <IconButton icon="refresh" label="Reload bookmarks" size="sm" onClick={() => void load()} />
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2">
        {status === "loading" ? (
          <div className="flex items-center gap-2 p-4 text-xs text-slate-500">
            <Spinner /> Loading bookmarks…
          </div>
        ) : null}

        {status === "error" ? (
          <div className="p-2">
            <ErrorState
              title="Bookmarks are unavailable"
              description={error ?? "The bookmarks API could not be reached."}
              action={
                <Button size="sm" icon="refresh" onClick={() => void load()}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : null}

        {status === "ready" && links.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="No bookmarks match"
            description="Try a different filter or add a new bookmark."
          />
        ) : null}

        {status === "ready"
          ? links.map((node) => (
              <div
                key={node.id}
                className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-900/5 dark:hover:bg-white/5"
              >
                <button
                  type="button"
                  onClick={() => node.url && openUrl(node.url)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm text-slate-700 dark:text-slate-200">
                    {node.title}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {node.url ? domainOf(node.url) : node.path}
                  </span>
                </button>
                <div className="hidden items-center gap-0.5 group-hover:flex">
                  <IconButton
                    icon="edit"
                    label={`Edit ${node.title}`}
                    size="sm"
                    className="h-6 w-6"
                    onClick={() => openEdit(node)}
                  />
                  <IconButton
                    icon="trash"
                    label={`Delete ${node.title}`}
                    size="sm"
                    className="h-6 w-6 hover:text-rose-500"
                    onClick={() => setConfirm(node)}
                  />
                </div>
              </div>
            ))
          : null}
      </div>

      <Modal
        open={dialog !== null}
        title={dialog?.mode === "edit" ? "Edit bookmark" : "Add bookmark"}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submit()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" error={formError}>
            {({ id }) => (
              <TextInput
                id={id}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Documentation"
                autoFocus
              />
            )}
          </Field>
          {dialog?.mode === "create" ? (
            <>
              <Field label="Address">
                {({ id }) => (
                  <TextInput
                    id={id}
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                  />
                )}
              </Field>
              <Field label="Folder">
                {({ id }) => (
                  <Select
                    id={id}
                    value={parentId}
                    onChange={(event) => setParentId(event.target.value)}
                  >
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.path}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={confirm !== null}
        title="Delete bookmark?"
        description={
          confirm?.isFolder
            ? "The folder and everything inside it will be removed."
            : "The bookmark will be removed from Chrome."
        }
        size="sm"
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => void remove()}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">{confirm?.title}</p>
      </Modal>
    </div>
  );
}
