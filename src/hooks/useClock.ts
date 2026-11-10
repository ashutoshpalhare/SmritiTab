import { useEffect, useState } from "react";

/**
 * A ticking clock. The interval is only created while the component is
 * mounted and is always cleared on unmount.
 */
export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
