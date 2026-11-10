import { useCallback, useEffect, useState } from "react";
import {
  ChromeApiError,
  hasHistoryApi,
  searchHistory,
} from "../lib/chrome";
import { formatRelativeTime, domainOf } from "../lib/utils";
import { useNavigation } from "../state/navigation";
import type { HistoryEntry } from "../types";
import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Select,
  Spinner,
  TextInput,
} from "../components/ui";

type Range = "day" | "week" | "month" | "all";

const RANGE_LABELS: Record<Range, string> = {
  day: "Last 24 hours",
  week: "Last 7 days",
  month: "Last 30 days",
  all: "All time",
};

const RANGE_MS: Record<Range, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  all: 0,
};

export function HistoryApp() {
  const { openUrl } = useNavigation();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<Range>("day");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const supported = hasHistoryApi();

  const load = useCallback(
    async (text: string, selectedRange: Range) => {
      if (!supported) return;
      setStatus("loading");
      try {
        const startTime =
          selectedRange === "all" ? undefined : Date.now() - RANGE_MS[selectedRange];
        const results = await searchHistory({
          text,
          maxResults: 80,
          ...(startTime ? { startTime } : {}),
        });
        setEntries(results);
        setStatus("ready");
        setError(null);
      } catch (caught) {
        setStatus("error");
        setError(
          caught instanceof ChromeApiError
            ? caught.message
            : "The history could not be loaded.",
        );
      }
    },
    [supported],
  );

  useEffect(() => {
    if (!supported) return;
    void load(query, range);
    // Only reload when the range changes — typing filters the list locally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, supported]);

  const visible = query.trim()
    ? entries.filter((entry) =>
        `${entry.title} ${entry.url}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : entries;

  if (!supported) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon="history"
          title="History is only available in the extension"
          description="The Chrome history API needs the packaged extension build."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-slate-900/10 p-3 dark:border-white/10">
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter history…"
          aria-label="Filter history"
          className="py-1.5 text-xs"
        />
        <Select
          value={range}
          onChange={(event) => setRange(event.target.value as Range)}
          aria-label="Time range"
          className="w-auto py-1 text-xs"
        >
          {(Object.keys(RANGE_LABELS) as Range[]).map((key) => (
            <option key={key} value={key}>
              {RANGE_LABELS[key]}
            </option>
          ))}
        </Select>
        <IconButton
          icon="refresh"
          label="Reload history"
          size="sm"
          onClick={() => void load(query, range)}
        />
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2">
        {status === "loading" ? (
          <div className="flex items-center gap-2 p-4 text-xs text-slate-500">
            <Spinner /> Loading history…
          </div>
        ) : null}

        {status === "error" ? (
          <div className="p-2">
            <ErrorState
              title="History is unavailable"
              description={error ?? "The history API could not be reached."}
              action={
                <Button size="sm" icon="refresh" onClick={() => void load(query, range)}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : null}

        {status === "ready" && visible.length === 0 ? (
          <EmptyState
            icon="history"
            title="Nothing here yet"
            description="Browse a few pages and they will show up in this list."
          />
        ) : null}

        {status === "ready"
          ? visible.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => openUrl(entry.url)}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-900/5 dark:hover:bg-white/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-700 dark:text-slate-200">
                    {entry.title}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {domainOf(entry.url)} · {formatRelativeTime(entry.lastVisitTime)}
                  </span>
                </span>
                {entry.visitCount > 1 ? (
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {entry.visitCount}×
                  </span>
                ) : null}
              </button>
            ))
          : null}
      </div>
    </div>
  );
}
