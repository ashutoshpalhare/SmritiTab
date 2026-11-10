import { useState } from "react";
import { domainOf, toAbsoluteUrl } from "../lib/utils";
import { useApp } from "../state/app-state";
import { useNavigation } from "../state/navigation";
import {
  Button,
  EmptyState,
  Field,
  IconButton,
  TextInput,
} from "../components/ui";

export function FavoritesApp() {
  const { favorites, toggleFavorite } = useApp();
  const { openUrl } = useNavigation();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter the address of the site.");
      return;
    }
    const absolute = toAbsoluteUrl(trimmed);
    if (!/^https?:\/\//i.test(absolute)) {
      setError("Only http and https addresses can be saved.");
      return;
    }
    toggleFavorite(absolute, title.trim() || domainOf(absolute));
    setTitle("");
    setUrl("");
    setError(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form onSubmit={add} className="space-y-2 border-b border-slate-900/10 p-3 dark:border-white/10">
        <div className="flex gap-2">
          <TextInput
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            aria-label="Site address"
            className="text-xs"
          />
          <Button type="submit" variant="primary" icon="plus" size="sm">
            Add
          </Button>
        </div>
        <Field label="Title (optional)" error={error}>
          {({ id }) => (
            <TextInput
              id={id}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example"
              className="text-xs"
            />
          )}
        </Field>
      </form>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2">
        {favorites.length === 0 ? (
          <EmptyState
            icon="star"
            title="No favorites yet"
            description="Pin the links you want one click away."
          />
        ) : (
          <ul className="space-y-1">
            {favorites.map((favorite) => (
              <li key={favorite.id} className="group flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openUrl(favorite.url)}
                  className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-900/5 dark:hover:bg-white/10"
                >
                  <span className="block truncate text-sm text-slate-700 dark:text-slate-200">
                    {favorite.title}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {domainOf(favorite.url)}
                  </span>
                </button>
                <IconButton
                  icon="star-filled"
                  label={`Remove ${favorite.title} from favorites`}
                  size="sm"
                  className="h-7 w-7 text-amber-400"
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
