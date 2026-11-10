import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useClock } from "../hooks/useClock";
import { useDrag } from "../hooks/useDrag";
import { useViewportSize } from "../hooks/useViewport";
import { QUOTES } from "../lib/quotes";
import { cn, formatClock, greetingFor } from "../lib/utils";
import { describeWeather, formatTemperature } from "../lib/weather";
import { useApp } from "../state/app-state";
import { useWeatherController } from "../state/weather-state";
import type { WidgetId } from "../types";
import { Icon, IconButton, Spinner, type IconName } from "./ui";

interface FloatingWidgetProps {
  id: WidgetId;
  title: string;
  icon: IconName;
  children: ReactNode;
  className?: string;
}

const WIDGET_MIN_X = 0.14;
const WIDGET_MAX_X = 0.86;
const WIDGET_MIN_Y = 0.06;
const WIDGET_MAX_Y = 0.86;

/**
 * A draggable widget whose position is stored as a normalised (0..1) value so
 * it survives window resizes and different screen sizes.
 */
function FloatingWidget({
  id,
  title,
  icon,
  children,
  className,
}: FloatingWidgetProps) {
  const { widgets, updateWidget } = useApp();
  const placement = widgets[id];
  const { width, height } = useViewportSize();
  const [dragging, setDragging] = useState(false);
  const origin = useRef({ x: placement.x, y: placement.y });

  const onMove = useCallback(
    ({ dx, dy }: { dx: number; dy: number }) => {
      const nextX = origin.current.x + dx / Math.max(width, 1);
      const nextY = origin.current.y + dy / Math.max(height, 1);
      updateWidget(id, {
        x: Math.min(Math.max(nextX, WIDGET_MIN_X), WIDGET_MAX_X),
        y: Math.min(Math.max(nextY, WIDGET_MIN_Y), WIDGET_MAX_Y),
      });
    },
    [height, id, updateWidget, width],
  );

  const drag = useDrag({
    onStart: () => {
      origin.current = { x: placement.x, y: placement.y };
      setDragging(true);
    },
    onMove,
    onEnd: () => setDragging(false),
  });

  return (
    <div
      data-dragging={dragging ? "true" : "false"}
      className={cn(
        "glass-panel pointer-events-auto absolute w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-3 transition-shadow",
        className,
      )}
      style={{ left: `${placement.x * 100}%`, top: `${placement.y * 100}%` }}
    >
      <div
        onPointerDown={drag.onPointerDown}
        onDoubleClick={() => updateWidget(id, { visible: false })}
        className="flex cursor-grab items-center justify-between gap-2 active:cursor-grabbing"
        title="Drag to move · double click to hide"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Icon name={icon} className="h-3.5 w-3.5" />
          {title}
        </span>
        <IconButton
          icon="close"
          label={`Hide the ${title.toLowerCase()} widget`}
          size="sm"
          className="h-5 w-5"
          onClick={() => updateWidget(id, { visible: false })}
        />
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ClockWidget() {
  const { settings, profile } = useApp();
  const now = useClock(settings.showSecondsInClock ? 1000 : 15000);

  return (
    <FloatingWidget id="clock" title="Clock" icon="clock">
      <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {formatClock(now, {
          hour24: settings.clock24h,
          seconds: settings.showSecondsInClock,
        })}
      </div>
      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
        {settings.showGreeting ? `${greetingFor(now)}, ${profile.name}` : null}
        {settings.showGreeting ? " · " : null}
        {now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </div>
    </FloatingWidget>
  );
}

function WeatherWidget() {
  const { settings } = useApp();
  const weather = useWeatherController();
  const reading = weather.snapshot;
  const description = reading ? describeWeather(reading.code, reading.isDay) : null;

  return (
    <FloatingWidget id="weather" title="Weather" icon="cloud">
      {weather.status === "loading" && !reading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
          <Spinner /> Loading…
        </div>
      ) : reading ? (
        <>
          <div className="flex items-end justify-between gap-2">
            <span className="text-2xl font-semibold text-slate-900 dark:text-white">
              {formatTemperature(reading.temperature, settings.temperatureUnit)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {reading.city}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {description?.label} · feels{" "}
            {formatTemperature(reading.apparentTemperature, settings.temperatureUnit)}
          </p>
        </>
      ) : (
        <p className="py-2 text-xs text-slate-500 dark:text-slate-400">
          {weather.error ?? "Weather unavailable."}
        </p>
      )}
    </FloatingWidget>
  );
}

function QuoteWidget() {
  const [index, setIndex] = useState(0);
  const quote = useMemo(() => QUOTES[index % QUOTES.length], [index]);

  return (
    <FloatingWidget id="quote" title="Quote" icon="quote">
      <blockquote className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        “{quote.text}”
      </blockquote>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          — {quote.author}
        </span>
        <IconButton
          icon="refresh"
          label="Show another quote"
          size="sm"
          className="h-6 w-6"
          onClick={() => setIndex((value) => (value + 1) % QUOTES.length)}
        />
      </div>
    </FloatingWidget>
  );
}

export function WidgetLayer() {
  const { widgets, settings } = useApp();

  return (
    <div
      aria-label="Widgets"
      className="pointer-events-none absolute inset-0 z-20 hidden md:block"
    >
      {settings.showClockWidget && widgets.clock.visible ? <ClockWidget /> : null}
      {settings.showWeatherWidget && widgets.weather.visible ? (
        <WeatherWidget />
      ) : null}
      {settings.showQuoteWidget && widgets.quote.visible ? <QuoteWidget /> : null}
    </div>
  );
}
