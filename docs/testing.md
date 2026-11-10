# Testing and CI

## Local checks

```sh
npm ci
npm run typecheck
npm run test
npm run build:extension
npm run validate:manifest
```

## Test coverage

Vitest covers:

- Settings, categories, app, note, task, widget and dock normalization
- Storage namespace, migrations, serialized writes and failure recovery
- Bookmark tree operations and search behavior
- Calculator and weather helpers
- Wallpaper catalogue, URL resolution and offline packaging
- Fixed widget header order and dashboard placement
- Manifest permissions, MV3 service worker handoff keys and PNG icon dimensions

The manifest validator also checks the generated package for its New Tab entry, background worker, CSP, permissions, host permissions, local wallpaper count and all declared icon files/dimensions.

## GitHub Actions

The preserved Extension CI workflow runs typecheck (when available), tests, the extension build and package validation on the source branch and main. It uploads the unpacked package as the `smrititab-extension` artifact.

Dependency audit output is reviewed as a separate quality gate. Do not use `npm audit fix --force` without reviewing the breaking changes and rerunning the full test/build sequence.

## Real Chrome QA

CI cannot prove Chrome's New Tab override, browser API permissions, persisted user data or the visual layout in a real profile. Load `dist-extension/` through `chrome://extensions` and run the owner-side checklist in [release readiness](release-readiness.md). The earlier main-branch runtime QA does not substitute for testing the rebuilt source package.
