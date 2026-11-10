# Release readiness

**Manifest version:** `1.0.0` (unchanged)  
**Source candidate:** `React-Vite-source-muse`

## Original main-branch runtime

The original minified runtime received the Phase 1–5 hardening, documentation, CI and owner-side Chrome checks. The owner's confirmation that manual testing is complete applies to that original runtime.

## React/Vite source candidate

The React/Vite tree is a separate rebuilt implementation. Passing its typecheck, Vitest suite, build and manifest validation is necessary but does not prove that the generated package works in a real Chrome profile.

Before merging this source candidate into `main` or publishing a versioned release:

- [ ] Load `dist-extension/` through `chrome://extensions` → Developer mode → Load unpacked.
- [ ] Confirm the New Tab override loads without extension errors or console exceptions.
- [ ] Confirm the fixed Weather | Clock | Quote header is above search at desktop and mobile widths.
- [ ] Test 12/24-hour time, separate AM/PM, greeting, quote refresh and each widget visibility toggle.
- [ ] Test light, dark and system themes; confirm orange accent selection persists after restart.
- [ ] Test local wallpaper selection, random-per-tab mode and the optional remote wallpaper entries.
- [ ] Test bookmarks, tab groups, history, clipboard, search, notes, tasks, dock, focus mode and settings.
- [ ] Confirm existing `smrititab:v1` data is preserved and pending search/focus actions still work.

Do not clear extension storage to work around a regression. Keep the original main branch and its runtime audit available until this source candidate has passed Chrome QA.

## Automated release gate

The source CI must pass:

- TypeScript typecheck
- Vitest regression suite
- Vite extension build
- Manifest and permissions validation
- PNG icon signature and dimension validation
- Offline wallpaper packaging validation

Dependency audit findings must be reviewed; do not apply forceful major upgrades blindly.

## Release decision

**Original runtime:** owner-side QA confirmed complete.  
**React/Vite source candidate:** awaiting its own real-Chrome smoke test.  
**Public release:** do not tag or publish until the source candidate is tested and merged deliberately.

No GitHub Release or new version tag is created by this workflow.
