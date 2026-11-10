import { useCallback, useEffect, useRef, useState } from "react";
import { StorageKeys, store } from "../lib/storage";
import {
  cacheWeather,
  fetchWeather,
  geocodeCity,
  guessLocationFromTimeZone,
  loadCachedWeather,
  type GeocodeResult,
} from "../lib/weather";
import type { WeatherSnapshot } from "../types";

export type WeatherStatus = "idle" | "loading" | "ready" | "error";

export interface WeatherController {
  snapshot: WeatherSnapshot | null;
  status: WeatherStatus;
  error: string | null;
  /** True when the displayed reading comes from the offline cache. */
  stale: boolean;
  refresh: () => Promise<void>;
  setCity: (city: string) => Promise<boolean>;
  location: GeocodeResult | null;
}

const LOCATION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

/**
 * Loads the current weather.
 *
 * Falls back to the last cached reading when the network is unavailable so
 * the widget never shows an empty state after the first successful load.
 */
export function useWeather(): WeatherController {
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [status, setStatus] = useState<WeatherStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [location, setLocation] = useState<GeocodeResult | null>(null);
  const locationRef = useRef<GeocodeResult | null>(null);
  const locationLoaded = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const resolveLocation = useCallback(async (): Promise<GeocodeResult> => {
    if (locationRef.current) return locationRef.current;

    const stored = await store.read<unknown>(StorageKeys.location, null);
    if (stored && typeof stored === "object") {
      const value = stored as Partial<GeocodeResult> & { updatedAt?: number };
      if (
        typeof value.latitude === "number" &&
        typeof value.longitude === "number" &&
        typeof value.name === "string" &&
        (!value.updatedAt || Date.now() - value.updatedAt < LOCATION_TTL_MS)
      ) {
        const result: GeocodeResult = {
          name: value.name,
          country: value.country ?? "",
          latitude: value.latitude,
          longitude: value.longitude,
        };
        locationRef.current = result;
        setLocation(result);
        return result;
      }
    }

    const guess = guessLocationFromTimeZone();
    locationRef.current = guess;
    setLocation(guess);
    return guess;
  }, []);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const place = await resolveLocation();
      const reading = await fetchWeather({
        latitude: place.latitude,
        longitude: place.longitude,
        city: place.name,
      });
      if (!mounted.current) return;
      setSnapshot(reading);
      setStale(false);
      setStatus("ready");
      await cacheWeather(reading);
    } catch (caught) {
      const cached = await loadCachedWeather();
      if (!mounted.current) return;
      if (cached) {
        setSnapshot(cached);
        setStale(true);
        setStatus("ready");
        setError(
          caught instanceof Error
            ? `Showing the last reading — ${caught.message}`
            : "Showing the last reading.",
        );
      } else {
        setStatus("error");
        setError(
          caught instanceof Error ? caught.message : "Weather is unavailable right now.",
        );
      }
    }
  }, [resolveLocation]);

  useEffect(() => {
    if (locationLoaded.current) return;
    locationLoaded.current = true;
    void refresh();
  }, [refresh]);

  const setCity = useCallback(
    async (city: string) => {
      const query = city.trim();
      if (!query) return false;
      try {
        const found = await geocodeCity(query);
        if (!found) {
          setError(`No place called “${query}” was found.`);
          return false;
        }
        locationRef.current = found;
        setLocation(found);
        await store.write(StorageKeys.location, { ...found, updatedAt: Date.now() });
        await refresh();
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not look up that place.");
        return false;
      }
    },
    [refresh],
  );

  return { snapshot, status, error, stale, refresh, setCity, location };
}
