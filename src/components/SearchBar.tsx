import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import {
  SEARCH_PROVIDERS,
  buildDirectUrl,
  buildSearchUrl,
  getProvider,
  providerIcon,
} from "../lib/search";
import { cn } from "../lib/utils";
import { useApp } from "../state/app-state";
import { Icon, IconButton } from "./ui";

export interface SearchBarProps {
  onNavigate: (url: string) => void;
}

export function SearchBar({ onNavigate }: SearchBarProps) {
  const { settings, updateSettings } = useApp();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const provider = getProvider(settings.searchEngine);

  const submit = useCallback(
    (rawQuery: string, engineId = settings.searchEngine) => {
      const trimmed = rawQuery.trim();
      if (!trimmed) return;
      const direct = buildDirectUrl(trimmed);
      const url = direct ?? buildSearchUrl(engineId, trimmed);
      setQuery("");
      setMenuOpen(false);
      onNavigate(url);
    },
    [onNavigate, settings.searchEngine],
  );

  const voice = useVoiceSearch({
    lang: settings.voiceLanguage,
    onResult: (transcript, isFinal) => {
      if (!transcript) return;
      setQuery(transcript);
      if (isFinal) submit(transcript);
    },
    onError: (message) => setVoiceError(message),
  });

  /* Keep the listening indicator in sync with the hook. */
  useEffect(() => {
    setListening(voice.listening);
  }, [voice.listening]);

  useEffect(() => {
    if (voice.error) setVoiceError(voice.error);
  }, [voice.error]);

  /* Close the provider menu when clicking outside of it. */
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  /* The extension background worker asks the dashboard to focus the field. */
  useEffect(() => {
    const onFocusRequest = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("smrititab:focus-search", onFocusRequest);
    return () => window.removeEventListener("smrititab:focus-search", onFocusRequest);
  }, []);

  /* Focus the search field with "/" or Ctrl/Cmd + K. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;
      if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const chooseProvider = useCallback(
    (id: string) => {
      updateSettings({ searchEngine: id as typeof settings.searchEngine });
      setMenuOpen(false);
      setActiveIndex(0);
      inputRef.current?.focus();
    },
    [updateSettings, settings.searchEngine],
  );

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && !menuOpen) {
      event.preventDefault();
      setMenuOpen(true);
      return;
    }
    if (event.key === "Escape") {
      if (menuOpen) {
        event.preventDefault();
        setMenuOpen(false);
      } else if (query) {
        event.preventDefault();
        setQuery("");
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      submit(query);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % SEARCH_PROVIDERS.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + SEARCH_PROVIDERS.length) % SEARCH_PROVIDERS.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = SEARCH_PROVIDERS[activeIndex];
      if (selected) chooseProvider(selected.id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
      inputRef.current?.focus();
    }
  };

  const providers = useMemo(() => SEARCH_PROVIDERS, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
        className="glass-panel-strong flex items-center gap-2 rounded-2xl px-3 py-2 transition focus-within:ring-2 focus-within:ring-indigo-400/60"
        role="search"
      >
        <Icon name="search" className="ml-1 h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKeyDown}
          type="search"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search the web"
          placeholder="Search the web…  (press / to focus)"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />

        {query ? (
          <IconButton
            icon="close"
            label="Clear search"
            size="sm"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          />
        ) : null}

        <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-label={`Search engine: ${provider.label}. Change search engine`}
            onClick={() => {
              setMenuOpen((open) => !open);
              setActiveIndex(Math.max(0, providers.findIndex((p) => p.id === provider.id)));
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-900/5 dark:hover:bg-white/10"
          >
            <img
              src={providerIcon(provider.id)}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 rounded-[6px]"
            />
          </button>
        </div>

        <button
          type="button"
          aria-label={listening ? "Stop voice search" : "Start voice search"}
          aria-pressed={listening}
          disabled={!voice.supported}
          title={
            voice.supported
              ? listening
                ? "Stop voice search"
                : "Voice search"
              : "Voice search is not supported in this browser"
          }
          onClick={() => {
            setVoiceError(null);
            voice.toggle();
          }}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl transition",
            voice.supported
              ? "text-slate-500 hover:bg-slate-900/5 hover:text-indigo-500 dark:text-slate-300 dark:hover:bg-white/10"
              : "cursor-not-allowed text-slate-300 dark:text-slate-600",
            listening && "animate-pulse-ring bg-indigo-500/15 text-indigo-500",
          )}
        >
          <Icon name="mic" className="h-5 w-5" />
        </button>
      </form>

      {voiceError ? (
        <p role="alert" className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {voiceError}
        </p>
      ) : null}

      {menuOpen ? (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Search engines"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="glass-panel-strong animate-scale-in absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl p-1.5"
        >
          {providers.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={item.id === provider.id}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => chooseProvider(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                index === activeIndex
                  ? "bg-slate-900/5 dark:bg-white/10"
                  : "hover:bg-slate-900/5 dark:hover:bg-white/10",
              )}
            >
              <img
                src={providerIcon(item.id)}
                alt=""
                width={22}
                height={22}
                className="h-5 w-5 rounded-[6px]"
              />
              <span className="flex-1 truncate text-slate-700 dark:text-slate-200">
                {item.label}
              </span>
              {item.id === provider.id ? (
                <Icon name="check" className="h-4 w-4 text-indigo-500" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
