# Release readiness

**Manifest version:** `1.0.0` (unchanged)  
**Maintained source:** `main`  
**Public versioned release:** Not published by this project-completion workflow

## Current source

The React/Vite source is already merged into `main` and is the maintained source of truth. The older `React-Vite-source-muse` branch is historical source-upload context, not a separate release candidate.

The original minified runtime's owner-side testing does not substitute for testing the current React/Vite package. The current source must be tested from a freshly generated `dist-extension/` build.

## Required Chrome smoke test

Before declaring a public release ready:

- [ ] Run `npm ci`, typecheck, tests, extension build and manifest validation from current `main`.
- [ ] Load `dist-extension/` through `chrome://extensions` → Developer mode → Load unpacked.
- [ ] Confirm the New Tab override loads without extension errors or console exceptions.
- [ ] Confirm the fixed Weather | Clock | Quote header is above search at desktop and narrow/mobile widths.
- [ ] Test 12/24-hour time, separate AM/PM, greeting, quote refresh and each widget visibility toggle.
- [ ] Test light, dark and system themes; confirm theme selection persists after restart.
- [ ] Test local wallpaper selection, random-per-tab mode and optional remote wallpaper entries.
- [ ] Test bookmarks, tab groups, history, clipboard, search, notes, tasks, dock, focus mode and settings.
- [ ] Confirm existing `smrititab:v1` data is preserved and pending search/focus actions still work.
- [ ] Check Chrome's extension Errors panel and browser console after the smoke test.

Do not clear extension storage to work around a regression. Use a test Chrome profile if a clean-profile check is needed.

## Automated release gate

The source CI must pass:

- Dependency vulnerability audit
- TypeScript typecheck
- Vitest regression suite
- Vite extension build
- Manifest and permissions validation
- PNG icon signature and dimension validation
- Offline wallpaper packaging validation

Dependency audit findings must be reviewed; do not apply forceful major upgrades blindly.

## Packaging and publication

The Extension CI workflow uploads an unpacked `smrititab-extension` artifact with a 7-day retention window. It is a CI artifact for testing, not a permanent public release package.

No GitHub Release or new version tag is created by this completion workflow. After Chrome QA passes, prepare a versioned ZIP from the validated `dist-extension/` output, review the manifest version and changelog, and publish deliberately. A Chrome Web Store listing must not be implied until one exists.

## Release decision

**Source build:** automated checks are tracked by CI.  
**Real Chrome QA:** remains a manual release gate until owner confirmation.  
**Public release:** not ready to be declared complete until the smoke-test checklist above passes.
