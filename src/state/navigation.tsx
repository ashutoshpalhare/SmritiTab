import { createContext, useCallback, useContext, type ReactNode } from "react";
import { openUrl as openUrlInBrowser } from "../lib/chrome";
import { toAbsoluteUrl } from "../lib/utils";
import { useApp } from "./app-state";
import { useWindows } from "./window-manager";

export interface NavigationValue {
  /** Opens a URL in a new tab (or the current tab when configured). */
  openUrl: (url: string) => void;
  /** Opens a built-in app in a draggable window. */
  openInternal: (appId: string, title: string) => void;
}

const NavigationContext = createContext<NavigationValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { settings } = useApp();
  const { openWindow } = useWindows();

  const openUrl = useCallback(
    (url: string) => {
      const safeUrl = toAbsoluteUrl(url);
      if (!safeUrl) return;
      if (settings.openInNewTab) {
        void openUrlInBrowser(safeUrl, true).catch(() => {
          window.open(safeUrl, "_blank", "noopener,noreferrer");
        });
      } else {
        window.location.href = safeUrl;
      }
    },
    [settings.openInNewTab],
  );

  const openInternal = useCallback(
    (appId: string, title: string) => {
      openWindow(appId, title);
    },
    [openWindow],
  );

  return (
    <NavigationContext.Provider value={{ openUrl, openInternal }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used inside <NavigationProvider>");
  }
  return context;
}
