import { useState } from "react";
import {
  ChromeApiError,
  hasClipboardApi,
  readClipboardText,
  readClipboardViaPasteEvent,
  writeClipboardText,
} from "../lib/chrome";
import { formatRelativeTime } from "../lib/utils";
import { useApp } from "../state/app-state";
import {
  Button,
  EmptyState,
  IconButton,
  TextArea,
} from "../components/ui";

export function ClipboardApp() {
  const { clipboard, addClipboardEntry, removeClipboardEntry, clearClipboardEntries } =
    useApp();
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supported = hasClipboardApi();

  const paste = async () => {
    setStatus("busy");
    setMessage(null);
    try {
      const text = await readClipboardText();
      if (!text.trim()) {
        setStatus("idle");
        setMessage("The clipboard is empty.");
        return;
      }
      addClipboardEntry(text);
      setStatus("idle");
    } catch (caught) {
      if (caught instanceof ChromeApiError && caught.reason === "permission") {
        setStatus("error");
        setMessage(
          `${caught.message} Press the button below and then press Ctrl+V / ⌘V to paste manually.`,
        );
        return;
      }
      setStatus("error");
      setMessage(
        caught instanceof Error ? caught.message : "The clipboard could not be read.",
      );
    }
  };

  const pasteWithKeyboard = async () => {
    setStatus("busy");
    setMessage("Press Ctrl+V / ⌘V now…");
    try {
      const text = await readClipboardViaPasteEvent();
      addClipboardEntry(text);
      setStatus("idle");
      setMessage(null);
    } catch (caught) {
      setStatus("error");
      setMessage(
        caught instanceof Error ? caught.message : "The paste was cancelled.",
      );
    }
  };

  const copy = async (id: string, text: string) => {
    try {
      await writeClipboardText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch (caught) {
      setStatus("error");
      setMessage(
        caught instanceof Error ? caught.message : "The text could not be copied.",
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-slate-900/10 p-3 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon="paste"
            onClick={() => void paste()}
            disabled={status === "busy"}
          >
            Paste from clipboard
          </Button>
          {status === "error" ? (
            <Button size="sm" icon="clipboard" onClick={() => void pasteWithKeyboard()}>
              Press Ctrl+V to paste
            </Button>
          ) : null}
          {clipboard.length > 0 ? (
            <Button size="sm" variant="ghost" icon="trash" onClick={clearClipboardEntries}>
              Clear all
            </Button>
          ) : null}
        </div>
        {!supported ? (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            This browser does not expose the clipboard API — add snippets manually below.
          </p>
        ) : null}
        {message ? (
          <p role="status" className="text-[11px] text-slate-500 dark:text-slate-400">
            {message}
          </p>
        ) : null}
        <TextArea
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          placeholder="Paste or type a snippet…"
          aria-label="Clipboard snippet"
          rows={2}
        />
        <Button
          size="sm"
          icon="plus"
          onClick={() => {
            if (!manual.trim()) return;
            addClipboardEntry(manual);
            setManual("");
          }}
        >
          Save snippet
        </Button>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
        {clipboard.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No snippets yet"
            description="Copied text is stored locally so you can paste it back later."
          />
        ) : (
          <ul className="space-y-1.5">
            {clipboard.map((entry) => (
              <li
                key={entry.id}
                className="group rounded-xl border border-transparent px-2.5 py-2 transition hover:border-slate-900/10 hover:bg-slate-900/5 dark:hover:border-white/10 dark:hover:bg-white/5"
              >
                <p className="whitespace-pre-wrap break-words text-xs text-slate-700 dark:text-slate-200">
                  {entry.text}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <IconButton
                      icon={copiedId === entry.id ? "check" : "copy"}
                      label="Copy to clipboard"
                      size="sm"
                      className="h-6 w-6"
                      onClick={() => void copy(entry.id, entry.text)}
                    />
                    <IconButton
                      icon="trash"
                      label="Delete snippet"
                      size="sm"
                      className="h-6 w-6 hover:text-rose-500"
                      onClick={() => removeClipboardEntry(entry.id)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
