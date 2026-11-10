import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { cn } from "../utils/cn";

/** Small, dependency free helpers shared across the dashboard. */

/** Stable unique id (crypto.randomUUID when available). */
export function uid(prefix = "id"): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

/** Clamp `value` into the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/** True when the string looks like something the browser can navigate to. */
export function isLikelyUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(trimmed)) return true;
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(trimmed);
}

/** Normalises a user supplied URL, adding a scheme when it is missing. */
export function toAbsoluteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Domain of a URL, used for favicon fallbacks and labels. */
export function domainOf(value: string): string {
  try {
    return new URL(toAbsoluteUrl(value)).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

/** Deterministic brand colour derived from a string (used for favicon tiles). */
export function colorFromString(value: string): string {
  const palette = [
    "#f97316",
    "#ea580c",
    "#fb923c",
    "#f59e0b",
    "#c2410c",
    "#b45309",
    "#9a3412",
    "#e11d48",
    "#be123c",
    "#d97706",
  ];
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

export function formatClock(
  date: Date,
  options: { hour24?: boolean; seconds?: boolean } = {},
): string {
  const { hour24 = false, seconds = false } = options;
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  if (!hour24) {
    hours = hours % 12;
    if (hours === 0) hours = 12;
  }
  const base = hour24
    ? `${String(hours).padStart(2, "0")}:${minutes}`
    : `${hours}:${minutes}`;
  return seconds ? `${base}:${String(date.getSeconds()).padStart(2, "0")}` : base;
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return "Still awake";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initialsOf(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "S";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function classNames(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
