import { useState } from "react";
import { useClock } from "../hooks/useClock";
import { QUOTES } from "../lib/quotes";
import { formatClock, greetingFor } from "../lib/utils";
import { describeWeather, formatTemperature } from "../lib/weather";
import { useApp } from "../state/app-state";
import { useWeatherController } from "../state/weather-state";
import { cn } from "../utils/cn";
import { Icon, IconButton, Spinner } from "./ui";

/**
 * Fixed dashboard header: compact weather and quote cards frame a prominent
 * clock. Widget visibility remains controlled by the existing Settings toggles.
 */
function ClockWidget() {
  const { settings, profile } = useApp();
  const now = useClock(settings.showSecondsInClock ? 1000 : 15000);
  const time = formatClock(now, {
    hour24: settings.clock24h,
    seconds: settings.showSecondsInClock,
  });
  const period = settings.clock24h ? null : now.getHours() >= 12 ? "PM" : "AM";

  return (
    <section
      aria-label="Clock"
      className="widget-clock-panel relative flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-3xl px-5 py-5 text-center sm:min-h-44 sm:px-8"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"
      />
      <div className="flex items-baseline justify-center gap-2 tabular-nums">
        <time dateTime={now.toISOString()} className="text-5xl font-semibold leading-none tracking-[-0.075em] text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
          {time}
        </time>
        {period ? (
          <span className="text-sm font-bold tracking-[0.16em] text-orange-500 sm:text-base">
            {period}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400 sm:text-sm">
        {now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      {settings.showGreeting ? (
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          {greetingFor(now)}, <span className="font-semibold text-orange-500">{profile.name}</span>
        </p>
      ) : null}
    </section>
  );
}

function WeatherWidget() {
  const { settings } = useApp();
  const weather = useWeatherController();
  const reading = weather.snapshot;
  const description = reading ? describeWeather(reading.code, reading.isDay) : null;

  return (
    <section
      aria-label="Weather"
      className="glass-panel flex min-h-32 min-w-0 flex-col justify-center rounded-2xl border-l-2 border-l-orange-500 px-4 py-3 sm:min-h-36 sm:px-5"
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        <Icon name="cloud" className="h-3.5 w-3.5 text-orange-500" />
        Weather
      </div>
      {weather.status === "loading" && !reading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
          <Spinner /> Loading…
        </div>
      ) : reading ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {formatTemperature(reading.temperature, settings.temperatureUnit)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{reading.city}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description?.label} · feels {formatTemperature(reading.apparentTemperature, settings.temperatureUnit)}
          </p>
        </>
      ) : (
        <p className="py-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {weather.error ?? "Weather unavailable."}
        </p>
      )}
    </section>
  );
}

function QuoteWidget() {
  const [index, setIndex] = useState(0);
  const quote = QUOTES.length > 0 ? QUOTES[index % QUOTES.length] : { text: "Make space for what matters.", author: "SmritiTab" };

  return (
    <section
      aria-label="Daily quote"
      className="glass-panel flex min-h-32 min-w-0 flex-col justify-center rounded-2xl border-l-2 border-l-orange-500 px-4 py-3 sm:min-h-36 sm:px-5"
    >
      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        <Icon name="quote" className="h-3.5 w-3.5 text-orange-500" />
        Thought for today
      </div>
      <blockquote className="line-clamp-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200 sm:text-sm">
        “{quote.text}”
      </blockquote>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[11px] font-semibold text-orange-500">
          — {quote.author}
        </span>
        <IconButton
          icon="refresh"
          label="Show another quote"
          size="sm"
          className="h-7 w-7 shrink-0 text-orange-500 hover:bg-orange-500/10"
          onClick={() => setIndex((value) => (value + 1) % Math.max(QUOTES.length, 1))}
        />
      </div>
    </section>
  );
}

export function WidgetLayer() {
  const { settings } = useApp();
  const showWeather = settings.showWeatherWidget;
  const showClock = settings.showClockWidget;
  const showQuote = settings.showQuoteWidget;
  const visibleCount = Number(showWeather) + Number(showClock) + Number(showQuote);

  if (visibleCount === 0) return null;

  const columns =
    showWeather && showClock && showQuote
      ? "grid-cols-[minmax(0,0.78fr)_minmax(0,2fr)_minmax(0,0.78fr)]"
      : showWeather && showClock
        ? "grid-cols-[minmax(0,0.78fr)_minmax(0,2fr)]"
        : showClock && showQuote
          ? "grid-cols-[minmax(0,2fr)_minmax(0,0.78fr)]"
          : "grid-cols-2";

  return (
    <section
      aria-label="Dashboard widgets"
      className="mb-6 w-full max-w-6xl overflow-x-auto pb-1 no-scrollbar"
    >
      <div
        className={cn(
          "grid items-center gap-3 md:gap-4",
          visibleCount > 1 && "min-w-[680px] md:min-w-0",
          visibleCount === 1 && "grid-cols-1",
          columns,
        )}
      >
        {showWeather ? <WeatherWidget /> : null}
        {showClock ? <ClockWidget /> : null}
        {showQuote ? <QuoteWidget /> : null}
      </div>
    </section>
  );
}
