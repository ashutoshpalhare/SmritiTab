import { useState } from "react";
import { describeWeather, formatTemperature } from "../lib/weather";
import { useApp } from "../state/app-state";
import { useWeatherController } from "../state/weather-state";
import { Button, ErrorState, Field, Spinner, TextInput } from "../components/ui";

export function WeatherApp() {
  const { settings, updateSettings } = useApp();
  const weather = useWeatherController();
  const [city, setCity] = useState("");
  const [lookup, setLookup] = useState(false);

  const reading = weather.snapshot;
  const description = reading ? describeWeather(reading.code, reading.isDay) : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!city.trim()) return;
    setLookup(true);
    const ok = await weather.setCity(city);
    setLookup(false);
    if (ok) setCity("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form onSubmit={submit} className="flex items-end gap-2 border-b border-slate-900/10 p-3 dark:border-white/10">
        <Field label="City">
          {({ id }) => (
            <TextInput
              id={id}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Lisbon"
            />
          )}
        </Field>
        <Button type="submit" variant="primary" size="sm" disabled={lookup}>
          {lookup ? <Spinner /> : null}
          Set city
        </Button>
      </form>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4">
        {weather.status === "loading" && !reading ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Spinner /> Loading the forecast…
          </div>
        ) : null}

        {reading ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {formatTemperature(reading.temperature, settings.temperatureUnit)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {description?.label}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {reading.city}
                </p>
              </div>
              <Button
                size="sm"
                icon="refresh"
                onClick={() => void weather.refresh()}
                disabled={weather.status === "loading"}
              >
                Refresh
              </Button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-900/5 px-3 py-2 dark:bg-white/5">
                <dt className="text-slate-500 dark:text-slate-400">Feels like</dt>
                <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
                  {formatTemperature(reading.apparentTemperature, settings.temperatureUnit)}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-900/5 px-3 py-2 dark:bg-white/5">
                <dt className="text-slate-500 dark:text-slate-400">Humidity</dt>
                <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
                  {reading.humidity}%
                </dd>
              </div>
              <div className="rounded-xl bg-slate-900/5 px-3 py-2 dark:bg-white/5">
                <dt className="text-slate-500 dark:text-slate-400">Wind</dt>
                <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
                  {Math.round(reading.windSpeed)} km/h
                </dd>
              </div>
              <div className="rounded-xl bg-slate-900/5 px-3 py-2 dark:bg-white/5">
                <dt className="text-slate-500 dark:text-slate-400">Updated</dt>
                <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
                  {new Date(reading.updatedAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900/5 px-3 py-2 dark:bg-white/5">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Temperature unit
              </span>
              <div className="flex gap-1">
                {(["c", "f"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => updateSettings({ temperatureUnit: unit })}
                    aria-pressed={settings.temperatureUnit === unit}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      settings.temperatureUnit === unit
                        ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                        : "text-slate-500 hover:bg-slate-900/5 dark:text-slate-400 dark:hover:bg-white/10"
                    }`}
                  >
                    °{unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {weather.status === "error" && weather.error ? (
          <ErrorState
            title="Weather is unavailable"
            description={weather.error}
            action={
              <Button size="sm" icon="refresh" onClick={() => void weather.refresh()}>
                Try again
              </Button>
            }
          />
        ) : null}

        {weather.stale && weather.error ? (
          <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
            {weather.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
