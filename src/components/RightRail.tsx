import { useState } from "react";
import { QUOTES } from "../lib/quotes";
import { describeWeather, formatTemperature } from "../lib/weather";
import { cn } from "../lib/utils";
import { useApp } from "../state/app-state";
import { useWeatherController } from "../state/weather-state";
import { Button, EmptyState, Icon, IconButton, Spinner } from "./ui";

export interface RightRailProps {
  onOpenUrl: (url: string) => void;
  onOpenInternal: (appId: string, title: string) => void;
  onClose: () => void;
}

export function RightRail({ onOpenUrl, onOpenInternal, onClose }: RightRailProps) {
  const { favorites, toggleFavorite, settings } = useApp();
  const weather = useWeatherController();
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quote = QUOTES[quoteIndex % QUOTES.length];
  const reading = weather.snapshot;
  const description = reading ? describeWeather(reading.code, reading.isDay) : null;

  return (
    <aside
      aria-label="Dashboard information"
      className="glass-panel fixed inset-y-0 right-0 z-30 hidden w-80 flex-col gap-3 overflow-y-auto rounded-none border-y-0 border-r-0 p-4 lg:flex"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
          At a glance
        </h2>
        <IconButton
          icon="panel-right"
          label="Hide the side panel"
          size="sm"
          onClick={() => settings.railVisible && onClose()}
        />
      </header>

      {/* ------------------------------------------------------------ weather */}
      <section
        aria-label="Weather"
        className="glass-panel rounded-2xl p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Weather
            </p>
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {reading?.city ?? weather.location?.name ?? "Locating…"}
            </p>
          </div>
          <IconButton
            icon="refresh"
            label="Refresh weather"
            size="sm"
            onClick={() => void weather.refresh()}
            disabled={weather.status === "loading"}
          />
        </div>

        {weather.status === "loading" && !reading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
            <Spinner /> Loading forecast…
          </div>
        ) : null}

        {reading ? (
          <>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-semibold text-slate-900 dark:text-white">
                {formatTemperature(reading.temperature, settings.temperatureUnit)}
              </span>
              <span className="pb-1 text-xs text-slate-500 dark:text-slate-400">
                {description?.label}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-between rounded-lg bg-slate-900/5 px-2 py-1 dark:bg-white/5">
                <dt>Feels</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">
                  {formatTemperature(reading.apparentTemperature, settings.temperatureUnit)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-900/5 px-2 py-1 dark:bg-white/5">
                <dt>Humidity</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">
                  {reading.humidity}%
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-900/5 px-2 py-1 dark:bg-white/5">
                <dt>Wind</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">
                  {Math.round(reading.windSpeed)} km/h
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-900/5 px-2 py-1 dark:bg-white/5">
                <dt>Updated</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">
                  {new Date(reading.updatedAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>
            {weather.stale ? (
              <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                {weather.error}
              </p>
            ) : null}
          </>
        ) : null}

        {weather.status === "error" && weather.error ? (
          <p role="alert" className="mt-2 text-[11px] text-rose-500">
            {weather.error}
          </p>
        ) : null}

        <Button
          size="sm"
          variant="ghost"
          icon="cloud"
          className="mt-2 w-full"
          onClick={() => onOpenInternal("weather", "Weather")}
        >
          Weather details
        </Button>
      </section>

      {/* ------------------------------------------------------------- quote */}
      <section aria-label="Daily quote" className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Quote
          </p>
          <IconButton
            icon="refresh"
            label="Show another quote"
            size="sm"
            onClick={() => setQuoteIndex((index) => (index + 1) % QUOTES.length)}
          />
        </div>
        <blockquote className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          “{quote.text}”
        </blockquote>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          — {quote.author}
        </p>
      </section>

      {/* --------------------------------------------------------- favorites */}
      <section aria-label="Favorites" className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Favorites
          </p>
          <IconButton
            icon="star"
            label="Manage favorites"
            size="sm"
            onClick={() => onOpenInternal("favorites", "Favorites")}
          />
        </div>

        {favorites.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon="star"
              title="No favorites yet"
              description="Star a link in the favorites app to pin it here."
            />
          </div>
        ) : (
          <ul className="mt-2 space-y-1">
            {favorites.slice(0, 6).map((favorite) => (
              <li key={favorite.id} className="group flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenUrl(favorite.url)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 transition hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <Icon name="star-filled" className="h-3.5 w-3.5 text-amber-400" />
                  <span className="truncate">{favorite.title}</span>
                </button>
                <IconButton
                  icon="close"
                  label={`Remove ${favorite.title} from favorites`}
                  size="sm"
                  className="h-6 w-6 opacity-0 transition group-hover:opacity-100"
                  onClick={() => toggleFavorite(favorite.url, favorite.title)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p
        className={cn(
          "mt-auto px-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-500",
        )}
      >
        Press <kbd className="rounded bg-slate-900/10 px-1 dark:bg-white/10">F</kbd> to
        enter focus mode.
      </p>
    </aside>
  );
}
