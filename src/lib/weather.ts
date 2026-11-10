import type { WeatherSnapshot } from "../types";
import { StorageKeys, store } from "./storage";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REQUEST_TIMEOUT_MS = 8000;

export interface GeocodeResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface WeatherDescription {
  label: string;
  icon: WeatherIcon;
}

export type WeatherIcon =
  | "sun"
  | "moon"
  | "cloud"
  | "cloud-sun"
  | "cloud-moon"
  | "rain"
  | "snow"
  | "fog"
  | "storm";

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    is_day?: number;
  };
}

interface GeocodeResponse {
  results?: Array<{
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Weather service responded with ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Resolves a city name to coordinates. */
export async function geocodeCity(city: string): Promise<GeocodeResult | null> {
  const query = city.trim();
  if (!query) return null;
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const data = await fetchJson<GeocodeResponse>(url);
  const first = data.results?.[0];
  if (!first) return null;
  return {
    name: first.name,
    country: first.country ?? "",
    latitude: first.latitude,
    longitude: first.longitude,
  };
}

/** Fetches the current weather for the given coordinates. */
export async function fetchWeather(params: {
  latitude: number;
  longitude: number;
  city: string;
}): Promise<WeatherSnapshot> {
  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
    timezone: "auto",
  });
  const data = await fetchJson<ForecastResponse>(`${FORECAST_URL}?${query.toString()}`);
  const current = data.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("Weather service returned an unexpected payload");
  }
  return {
    city: params.city,
    latitude: params.latitude,
    longitude: params.longitude,
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature ?? current.temperature_2m,
    humidity: current.relative_humidity_2m ?? 0,
    windSpeed: current.wind_speed_10m ?? 0,
    code: current.weather_code ?? 0,
    isDay: current.is_day !== 0,
    updatedAt: Date.now(),
  };
}

/** Returns the last successful reading (used as an offline fallback). */
export async function loadCachedWeather(): Promise<WeatherSnapshot | null> {
  try {
    const raw = await store.read<unknown>(StorageKeys.weather, null);
    if (!raw || typeof raw !== "object") return null;
    const value = raw as Partial<WeatherSnapshot>;
    if (typeof value.temperature !== "number" || typeof value.city !== "string") {
      return null;
    }
    return {
      city: value.city,
      latitude: Number(value.latitude ?? 0),
      longitude: Number(value.longitude ?? 0),
      temperature: value.temperature,
      apparentTemperature: Number(value.apparentTemperature ?? value.temperature),
      humidity: Number(value.humidity ?? 0),
      windSpeed: Number(value.windSpeed ?? 0),
      code: Number(value.code ?? 0),
      isDay: value.isDay !== false,
      updatedAt: Number(value.updatedAt ?? Date.now()),
    };
  } catch {
    return null;
  }
}

export async function cacheWeather(snapshot: WeatherSnapshot): Promise<void> {
  await store.write(StorageKeys.weather, snapshot);
}

/** Maps a WMO weather code to a human readable label and an icon key. */
export function describeWeather(code: number, isDay = true): WeatherDescription {
  if (code === 0) return { label: "Clear sky", icon: isDay ? "sun" : "moon" };
  if (code <= 2) return { label: "Partly cloudy", icon: isDay ? "cloud-sun" : "cloud-moon" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "rain" };
  if (code >= 61 && code <= 67) return { label: "Rain", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", icon: "rain" };
  if (code >= 85 && code <= 86) return { label: "Snow showers", icon: "snow" };
  if (code >= 95 && code <= 99) return { label: "Thunderstorm", icon: "storm" };
  return { label: "Unknown", icon: "cloud" };
}

export function formatTemperature(value: number, unit: "c" | "f"): string {
  const converted = unit === "f" ? value * 1.8 + 32 : value;
  return `${Math.round(converted)}°${unit.toUpperCase()}`;
}

/**
 * Uses the browser's explicit location permission instead of guessing a city
 * from the device timezone. If permission is denied, the caller can offer
 * manual city selection without silently showing a forecast for another place.
 */
export function getBrowserLocation(): Promise<GeocodeResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(
      new Error("Location is unavailable. Choose a city in Weather details."),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          name: "Your location",
          country: "",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        const message =
          error.code === 1
            ? "Location permission was denied. Choose a city in Weather details."
            : error.code === 3
              ? "Location request timed out. Choose a city in Weather details."
              : "Could not determine your location. Choose a city in Weather details.";
        reject(new Error(message));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}
