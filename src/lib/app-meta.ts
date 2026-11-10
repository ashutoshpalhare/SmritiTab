import type { IconName } from "../components/ui";
import type { InternalAppId } from "../types";

export interface AppMeta {
  title: string;
  icon: IconName;
  description: string;
}

/** Metadata for the applications that are built into the dashboard. */
export const INTERNAL_APP_META: Record<InternalAppId, AppMeta> = {
  notes: {
    title: "Notes",
    icon: "notes",
    description: "Quick scratch pad that saves as you type.",
  },
  todo: {
    title: "To-do",
    icon: "checklist",
    description: "Tasks with priorities and due dates.",
  },
  calculator: {
    title: "Calculator",
    icon: "calculator",
    description: "Evaluate expressions with keyboard support.",
  },
  bookmarks: {
    title: "Bookmarks",
    icon: "bookmark",
    description: "Your Chrome bookmarks, editable in place.",
  },
  history: {
    title: "History",
    icon: "history",
    description: "Recently visited pages.",
  },
  clipboard: {
    title: "Clipboard",
    icon: "clipboard",
    description: "Snippets you copied, kept locally.",
  },
  favorites: {
    title: "Favorites",
    icon: "star",
    description: "Pinned links you want one click away.",
  },
  weather: {
    title: "Weather",
    icon: "cloud",
    description: "Current conditions for your city.",
  },
  settings: {
    title: "Settings",
    icon: "settings",
    description: "Appearance, widgets and dashboard preferences.",
  },
  profile: {
    title: "Profile",
    icon: "user",
    description: "Your name and personal greeting.",
  },
};

export function internalAppMeta(appId: string): AppMeta {
  return (
    INTERNAL_APP_META[appId as InternalAppId] ?? {
      title: "App",
      icon: "grid",
      description: "",
    }
  );
}
