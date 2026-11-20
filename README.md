# SmritiTab

**A local-first Chrome Manifest V3 New Tab dashboard.**

SmritiTab brings search, bookmarks, notes, tasks, history, clipboard, calculator, weather, favorites and focus mode into one customisable New Tab workspace.

[Project landing page](https://ashutoshpalhare.github.io/SmritiTab/) · [Source code](https://github.com/ashutoshpalhare/SmritiTab) · [Issues](https://github.com/ashutoshpalhare/SmritiTab/issues)

## Current source architecture

The maintained source of truth is the repository's `main` branch:

- React 19 + TypeScript
- Vite 7 + Tailwind CSS 4
- Chrome Manifest V3
- `chrome.storage.local` for extension persistence, with browser-local fallbacks during web development
- Open-Meteo for weather; no application backend, analytics or telemetry
- Local wallpaper assets bundled with the extension; optional remote wallpaper choices are loaded only when selected

Historical runtime audit and branch-reconciliation documents describe earlier project states and compatibility constraints. They are not instructions to switch to a separate source branch.

## Features

- Fixed Weather | hero Clock | Quote dashboard header
- 12/24-hour clock, separate orange AM/PM, date and personalised greeting
- Search providers, voice search and keyboard shortcuts
- Bookmark folders, favourites and browser history
- Notes, todos, clipboard and calculator apps
- Dock, right rail, draggable app windows and focus mode
- Light, dark and system themes
- Orange/charcoal visual identity with glass surfaces
- Offline local wallpaper library and optional remote wallpapers

## Requirements

- Node.js 20 or newer (CI currently uses Node.js 22)
- npm
- Google Chrome or a compatible Chromium browser for unpacked-extension testing

## Install and verify the source

```sh
git clone https://github.com/ashutoshpalhare/SmritiTab.git
cd SmritiTab
npm ci
npm run typecheck
npm test
npm run build:extension
npm run validate:manifest
```

The unpacked extension is generated in `dist-extension/`.

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the generated `dist-extension/` folder.
5. Open a new tab and inspect the extension's Errors panel and DevTools console.

For the web preview, run `npm run dev`. To create the single-file web build, run `npm run build:web`.

See the complete [installation guide](docs/installation.md) for local builds and CI artifacts.

## Data compatibility and privacy

- Keep the `smrititab:v1` storage namespace and pending-action keys stable.
- Existing settings, bookmarks, notes, todos, favourites and other dashboard data must not be cleared as a migration workaround.
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
website/                   GitHub Pages product landing page
dist-extension/            Generated unpacked extension (not committed)
docs/                      Architecture, build, testing, QA and release docs
```

## Quality checks

GitHub Actions runs:

- Dependency vulnerability audit
- TypeScript typecheck
- Vitest unit and regression tests
- MV3 extension build
- Manifest, icon, permission, background-worker and wallpaper validation

The CI workflow uploads an unpacked extension artifact named `smrititab-extension` (currently retained for 7 days). See [Testing and CI](docs/testing.md).

## Project status

Automated source checks are part of the delivery gate, not a substitute for testing the extension in Chrome. The React/Vite build still needs the final owner-side Load-unpacked smoke test before a versioned public release is declared ready. See [Release readiness](docs/release-readiness.md) and the [8-phase completion plan](docs/PROJECT-COMPLETION-PLAN.md).

## License

No license file is currently included. Add an explicit license before accepting external contributions.
