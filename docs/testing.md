# Testing and CI

## Local checks

Run these commands from the repository root:

```sh
npm ci
npm run typecheck
npm test
npm run build:extension
npm run validate:manifest
```

The package validator expects the generated `dist-extension/` directory. Do not run it against the repository root or the web-preview `dist/` directory.

## Test coverage

Vitest covers:

- Settings, categories, app, note, task, widget and dock normalization
- Storage namespace, migrations, serialized writes and failure recovery
- Bookmark tree operations and search behavior
- Calculator and weather helpers
- Wallpaper catalogue, URL resolution and offline packaging
- Fixed widget header order and dashboard placement
- Manifest permissions, MV3 service-worker handoff keys and PNG icon dimensions

The manifest validator also checks the generated package for its New Tab entry, background worker, CSP, permissions, host permissions, local wallpaper count and all declared icon files/dimensions.

## GitHub Actions

The Extension CI workflow runs dependency audit, typecheck, automated tests, extension build and package validation. It uploads the unpacked package as the `smrititab-extension` artifact. The artifact retention is 7 days; it is intended for testing, not permanent distribution.

Dependency audit findings must be reviewed. Do not use `npm audit fix --force` without reviewing breaking changes and rerunning the full test/build sequence.

## Real Chrome QA

CI cannot prove Chrome's New Tab override, browser API permissions, persisted user data or the visual layout in a real profile. Load `dist-extension/` through `chrome://extensions` and run the owner-side checklist in [release readiness](release-readiness.md).

Use a separate Chrome profile for isolated testing. Never clear the `smrititab:v1` storage namespace to work around a regression. A successful CI run is not a substitute for the manual Chrome smoke test.
