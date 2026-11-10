import type { ComponentType } from "react";
import { BookmarksApp } from "./BookmarksApp";
import { CalculatorApp } from "./CalculatorApp";
import { ClipboardApp } from "./ClipboardApp";
import { FavoritesApp } from "./FavoritesApp";
import { HistoryApp } from "./HistoryApp";
import { NotesApp } from "./NotesApp";
import { ProfileApp } from "./ProfileApp";
import { SettingsApp } from "./SettingsApp";
import { TodoApp } from "./TodoApp";
import { WeatherApp } from "./WeatherApp";

/** Built-in applications that can be opened inside a dashboard window. */
export const APP_REGISTRY: Record<string, ComponentType> = {
  notes: NotesApp,
  todo: TodoApp,
  calculator: CalculatorApp,
  bookmarks: BookmarksApp,
  history: HistoryApp,
  clipboard: ClipboardApp,
  favorites: FavoritesApp,
  weather: WeatherApp,
  settings: SettingsApp,
  profile: ProfileApp,
};
