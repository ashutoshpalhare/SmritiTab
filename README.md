# SmritiTab

**A local-first Chrome Manifest V3 New Tab dashboard.**

SmritiTab brings search, bookmarks, notes, tasks, history, clipboard, calculator, weather, favorites and focus mode into a customizable New Tab page.

## Current source architecture

The React/Vite source candidate is maintained in `React-Vite-source-muse`:

- React 19 + TypeScript
- Vite 7 + Tailwind CSS 4
- Chrome Manifest V3
- `chrome.storage.local` for extension persistence, with browser-local fallbacks during web development
- Open-Meteo for weather; no application backend, analytics or telemetry
- Local wallpaper assets are bundled with the extension; optional remote wallpaper choices are loaded only when selected

The previous `main` runtime hardening, permission audit, accessibility work and release documentation have been retained in this branch. The original runtime audit documents the pre-source bundle; it is historical compatibility evidence, not the React build architecture.

## Features

- Fixed Weather | hero Clock | Quote dashboard header
- 12/24-hour clock, separate orange AM/PM, date and personalized greeting
- Search providers, voice search and keyboard shortcuts
- Bookmark folders, favorites and browser history
- Notes, todos, clipboard and calculator apps
- Dock, right rail, draggable app windows and focus mode
- Light, dark and system themes
- Orange/charcoal visual identity with glass surfaces
- Offline local wallpaper library and optional remote wallpapers

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run typecheck
npm run test
npm run build:extension
npm run validate:manifest
```

The unpacked Chrome extension is generated in `dist-extension/`.

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the generated `dist-extension/` folder.
5. Open a new tab.

For the web preview, run `npm run dev`. To create the single-file web build, run `npm run build:web`.

## Data compatibility and privacy

- Keep the `smrititab:v1` storage namespace and pending-action keys stable.
- Existing settings, bookmarks, notes, todos, favorites and other dashboard data must not be cleared as a migration workaround.
- The extension uses only the Chrome permissions declared in `public/manifest.json`.
- Weather requests go to Open-Meteo. No SmritiTab backend, telemetry or analytics service is included.
- The built-in wallpaper library is local. Optional external wallpaper entries require an internet connection when selected.

## Repository layout

```text
src/                       React dashboard source
src/apps/                  Dashboard applications
src/components/            Widgets, search, dock, bookmark panel and windows
src/state/                 App, weather, navigation and window state
src/lib/                   Storage, APIs, helpers and unit tests
public/manifest.json       Chrome Manifest V3 manifest
public/background.js       MV3 service worker
public/icons/              16, 32, 48 and 128 px extension icons
assets/                    Curated local wallpaper sources
scripts/                   Extension build and manifest validation
wallpapers.js              Local and optional external wallpaper catalogue
dist-extension/            Generated unpacked extension (not committed)
docs/                      Architecture, build, QA and historical runtime records
```

## Quality checks

GitHub Actions runs:

- TypeScript typecheck
- Vitest unit and regression tests
- MV3 extension build
- Manifest, icon, permission, background-worker and wallpaper validation

See [Source build guide](docs/source-build.md), [Architecture](docs/architecture.md), [Testing](docs/testing.md), [Accessibility](docs/accessibility.md) and [Release readiness](docs/release-readiness.md).

## Preserved main-branch project history

The Phase 1–5 runtime hardening, compatibility baseline, accessibility and release-readiness records from the previous `main` branch remain under `docs/`. In particular, [runtime audit](docs/runtime-audit.md) and [runtime baseline](docs/runtime-baseline.md) describe the original bundled extension and the data/permission constraints that the source build must respect.

## License

No license file is currently included. Add an explicit license before accepting external contributions.
