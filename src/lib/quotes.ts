import type { WallpaperId } from "../types";

export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { text: "A calm mind brings inner strength and self-confidence.", author: "Dalai Lama" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Nothing is worth more than this day.", author: "Johann Wolfgang von Goethe" },
  { text: "You have power over your mind — not outside events.", author: "Marcus Aurelius" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Wherever you go, go with all your heart.", author: "Confucius" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Order your soul. Reduce your wants.", author: "Augustine" },
  { text: "Well begun is half done.", author: "Aristotle" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Attention is the beginning of devotion.", author: "Mary Oliver" },
  { text: "Be here now, and the whole world opens up.", author: "Thich Nhat Hanh" },
];

export interface Wallpaper {
  id: WallpaperId;
  label: string;
  /** Inline data URI / bundled asset for photographic wallpapers. */
  image?: string;
  /** Tailwind classes used for gradient wallpapers. */
  className: string;
  /** Scrim painted on top so UI text always stays readable. */
  overlay: string;
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: "aurora",
    label: "Aurora",
    className:
      "bg-[radial-gradient(at_20%_20%,#7c3aed_0px,transparent_55%),radial-gradient(at_80%_15%,#4f46e5_0px,transparent_50%),radial-gradient(at_55%_85%,#0ea5e9_0px,transparent_55%)] bg-slate-950",
    overlay: "bg-slate-950/35",
  },
  {
    id: "dune",
    label: "Dune",
    className:
      "bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950",
    overlay: "bg-zinc-950/35",
  },
  {
    id: "mesh",
    label: "Mesh",
    className:
      "bg-[radial-gradient(at_15%_15%,#6366f1_0px,transparent_55%),radial-gradient(at_85%_10%,#a855f7_0px,transparent_55%),radial-gradient(at_50%_85%,#0ea5e9_0px,transparent_55%)] bg-slate-950",
    overlay: "bg-slate-950/20",
  },
  {
    id: "mist",
    label: "Mist",
    className:
      "bg-gradient-to-br from-slate-100 via-sky-50 to-violet-100 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950",
    overlay: "bg-white/10 dark:bg-slate-950/20",
  },
  {
    id: "solid",
    label: "Solid",
    className: "bg-slate-100 dark:bg-slate-950",
    overlay: "bg-transparent",
  },
];

export function getWallpaper(id: WallpaperId): Wallpaper {
  return WALLPAPERS.find((wallpaper) => wallpaper.id === id) ?? WALLPAPERS[0];
}
