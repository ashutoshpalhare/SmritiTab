import { useClock } from "../hooks/useClock";
import { formatClock, greetingFor } from "../lib/utils";
import { useApp } from "../state/app-state";
import { Icon } from "./ui";

export interface FocusModeProps {
  onExit: () => void;
}

/**
 * Focus mode keeps only the wallpaper, a large clock and a single control to
 * leave again. Every other dashboard element is hidden by the parent.
 */
export function FocusMode({ onExit }: FocusModeProps) {
  const { settings, profile } = useApp();
  const now = useClock(settings.showSecondsInClock ? 1000 : 15000);

  return (
    <div className="animate-fade-in absolute inset-0 z-[60] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <p className="text-6xl font-semibold tracking-tight text-white drop-shadow-lg sm:text-7xl">
          {formatClock(now, {
            hour24: settings.clock24h,
            seconds: settings.showSecondsInClock,
          })}
        </p>
        {settings.showGreeting ? (
          <p className="mt-2 text-sm text-white/80">
            {greetingFor(now)}, {profile.name}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-white/60">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <button
        type="button"
        onClick={onExit}
        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/25"
      >
        <Icon name="focus" className="h-4 w-4" />
        Exit focus mode
        <kbd className="rounded bg-black/25 px-1 text-[10px]">Esc</kbd>
      </button>
    </div>
  );
}
