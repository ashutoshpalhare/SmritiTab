import { useEffect, useMemo, useState } from "react";
import { formatRelativeTime } from "../lib/utils";
import { useApp } from "../state/app-state";
import type { Note } from "../types";
import { Button, EmptyState, IconButton, TextArea, TextInput } from "../components/ui";

export function NotesApp() {
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(() => notes[0]?.id ?? null);
  const [draft, setDraft] = useState({ title: "", body: "" });

  const sorted = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      }),
    [notes],
  );

  const selected = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId],
  );

  /* Commit the draft shortly after the user stops typing. */
  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      const current = notes.find((note) => note.id === selectedId);
      if (!current) return;
      if (current.title !== draft.title || current.body !== draft.body) {
        updateNote(selectedId, { title: draft.title, body: draft.body });
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, notes, selectedId, updateNote]);

  const selectNote = (note: Note) => {
    setSelectedId(note.id);
    setDraft({ title: note.title, body: note.body });
  };

  const createNote = () => {
    const note = addNote({ title: "Untitled note", body: "" });
    setSelectedId(note.id);
    setDraft({ title: note.title, body: "" });
  };

  const removeSelected = () => {
    if (!selectedId) return;
    deleteNote(selectedId);
    const fallback = sorted.find((note) => note.id !== selectedId);
    setSelectedId(fallback?.id ?? null);
    setDraft(fallback ? { title: fallback.title, body: fallback.body } : { title: "", body: "" });
  };

  const togglePinned = () => {
    if (!selected) return;
    updateNote(selected.id, { pinned: !selected.pinned });
  };

  if (notes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon="notes"
          title="No notes yet"
          description="Notes are stored locally and survive a browser restart."
          action={
            <Button variant="primary" icon="plus" onClick={createNote}>
              New note
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex w-44 shrink-0 flex-col border-r border-slate-900/10 dark:border-white/10">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {notes.length} note{notes.length === 1 ? "" : "s"}
          </span>
          <IconButton icon="plus" label="New note" size="sm" onClick={createNote} />
        </div>
        <ul className="scroll-thin flex-1 overflow-y-auto px-2 pb-2">
          {sorted.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => selectNote(note)}
                className={`mb-1 w-full rounded-xl px-2.5 py-2 text-left transition ${
                  note.id === selectedId
                    ? "bg-slate-900/5 dark:bg-white/10"
                    : "hover:bg-slate-900/5 dark:hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-1">
                  {note.pinned ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  ) : null}
                  <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                    {note.title || "Untitled note"}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {note.body ? note.body.slice(0, 40) : "Empty note"} ·{" "}
                  {formatRelativeTime(note.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <div className="flex items-center gap-2 border-b border-slate-900/10 px-3 py-2 dark:border-white/10">
              <TextInput
                value={draft.title}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Title"
                aria-label="Note title"
                className="border-transparent bg-transparent px-1 text-sm font-semibold shadow-none focus:border-transparent dark:bg-transparent"
              />
              <IconButton
                icon="pin"
                label={selected.pinned ? "Unpin note" : "Pin note"}
                size="sm"
                active={selected.pinned}
                onClick={togglePinned}
              />
              <IconButton
                icon="trash"
                label="Delete note"
                size="sm"
                className="hover:text-rose-500"
                onClick={removeSelected}
              />
            </div>
            <TextArea
              value={draft.body}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, body: event.target.value }))
              }
              placeholder="Write something…"
              aria-label="Note body"
              className="flex-1 rounded-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed shadow-none focus:border-transparent dark:bg-transparent"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState icon="notes" title="Select a note" />
          </div>
        )}
      </div>
    </div>
  );
}
