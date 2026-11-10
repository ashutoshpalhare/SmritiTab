import { internalAppMeta } from "../lib/app-meta";
import { cn } from "../lib/utils";
import { useApp } from "../state/app-state";
import { useWindows } from "../state/window-manager";
import type { AppEntry } from "../types";
import { Icon, type IconName } from "./ui";

export interface DockProps {
  onOpenApp: (app: AppEntry) => void;
  onOpenInternal: (appId: string, title: string) => void;
  onToggleVisible: () => void;
}

interface DockItem {
  key: string;
  label: string;
  icon: IconName;
  running: boolean;
  activate: () => void;
}

const SIZES = {
  sm: { button: "h-10 w-10", icon: "h-4 w-4" },
  md: { button: "h-12 w-12", icon: "h-5 w-5" },
  lg: { button: "h-14 w-14", icon: "h-6 w-6" },
} as const;

export function Dock({ onOpenApp, onOpenInternal, onToggleVisible }: DockProps) {
  const { dock, apps } = useApp();
  const { hasWindow } = useWindows();

  const items: DockItem[] = dock.appIds.map((id) => {
    const app = apps.find((entry) => entry.id === id);
    if (app) {
      return {
        key: app.id,
        label: app.name,
        icon: app.kind === "internal" ? internalAppMeta(app.target).icon : "external",
        running: app.kind === "internal" && hasWindow(app.target),
        activate: () => onOpenApp(app),
      };
    }
    const meta = internalAppMeta(id);
    return {
      key: id,
      label: meta.title,
      icon: meta.icon,
      running: hasWindow(id),
      activate: () => onOpenInternal(id, meta.title),
    };
  });

  const sizes = SIZES[dock.size] ?? SIZES.md;
  const vertical = dock.position === "left";

  return (
    <nav
      aria-label="Dock"
      className={cn(
        "glass-panel-strong fixed z-40 flex gap-1.5 rounded-2xl p-2",
        vertical
          ? "bottom-1/2 left-24 flex-col -translate-y-1/2 lg:left-20"
          : "bottom-4 left-1/2 flex-row -translate-x-1/2",
      )}
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.activate}
          title={item.label}
          aria-label={item.label}
          className={cn(
            "relative grid place-items-center rounded-xl bg-gradient-to-br from-slate-900/5 to-slate-900/10 text-slate-600 transition hover:from-violet-500/90 hover:to-indigo-600/90 hover:text-white dark:text-slate-300 dark:hover:text-white",
            sizes.button,
          )}
        >
          <Icon name={item.icon} className={sizes.icon} />
          {item.running ? (
            <span className="absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
          ) : null}
        </button>
      ))}

      <span className="mx-1 w-px self-stretch bg-slate-900/10 dark:bg-white/10" />

      <button
        type="button"
        onClick={onToggleVisible}
        title="Hide the dock"
        aria-label="Hide the dock"
        className={cn(
          "grid place-items-center rounded-xl text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100",
          sizes.button,
        )}
      >
        <Icon name="chevron-down" className={sizes.icon} />
      </button>
    </nav>
  );
}
