# Architecture

## Current React/Vite source candidate

SmritiTab is a Chrome Manifest V3 New Tab extension built from React 19, TypeScript, Vite 7 and Tailwind CSS 4.

```text
src/
├── apps/          # Bookmarks, notes, todo, history, calculator, clipboard, settings, weather, profile, favorites
├── components/    # Dashboard widgets, search, bookmark panel, dock, right rail, windows and focus mode
├── hooks/         # Chrome bookmarks, clock, weather, voice search, viewport and wallpaper hooks
├── lib/           # Chrome API adapter, storage, data normalizers, search, weather, wallpaper and tests
├── state/         # App, navigation, weather and window-manager providers
└── types.ts       # Shared application types

public/
├── manifest.json
├── background.js
└── icons/

assets/             # Curated local wallpaper source images
scripts/            # Extension packaging and manifest validation
wallpapers.js       # Local and optional external wallpaper catalogue
```

## Dashboard composition

The dashboard renders the fixed Weather | Clock | Quote header inside the main document flow, immediately above search. The clock is the visual hero; side widgets remain compact glass panels. The header is not a draggable or absolutely positioned full-screen layer.

The application dock, right rail and app windows remain separate dashboard layers. Individual app windows may be draggable; the top widget row is not.

## State and persistence

- `AppProvider` hydrates and persists settings, profile, categories, apps, favorites, notes, todos, widget preferences, dock and clipboard.
- `WindowProvider` owns app-window state.
- `WeatherProvider` owns weather status and readings.
- `NavigationProvider` routes external URLs and internal apps.
- `src/lib/storage.ts` prefers `chrome.storage.local` in the extension and falls back to localStorage/memory for web development.

The storage namespace remains `smrititab:v1`. Pending background-worker values use the same namespaced `pending-search` and `pending-action` keys. Do not rename these keys or clear stored data as a migration shortcut.

## Chrome integration

The MV3 service worker creates the selection-search context menu and hands keyboard/context-menu actions to the dashboard through `chrome.storage.local`. Chrome API access is isolated in the storage and Chrome adapter modules.

The manifest retains storage, bookmarks, history, clipboard, context-menu, tabs and tab-groups permissions, with explicit HTTPS hosts for Open-Meteo, Unsplash and Google Fonts.

## Network and privacy

No SmritiTab application backend, analytics or telemetry is included. Weather uses Open-Meteo. The wallpaper catalogue works locally; optional external wallpaper entries are only fetched when selected.

## Historical runtime baseline

The original main-branch minified bundle and its audit are preserved in [runtime audit](runtime-audit.md) and [runtime baseline](runtime-baseline.md). Those documents describe the earlier production runtime and the constraints used when reconstructing this readable source tree; they are not the current build instructions.
