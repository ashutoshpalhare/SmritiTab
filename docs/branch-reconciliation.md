# Source branch reconciliation

## Why this branch exists

The original `main` branch contained a minified dashboard runtime without the original React/Vite source. The React/Vite source was uploaded separately to `React-Vite-source-muse` and is maintained as the readable source candidate.

## Main-branch work retained

The source branch preserves the work completed on `main` before the source upload:

- Manifest V3 permissions and background-worker hardening
- The `smrititab:v1` storage namespace and pending action handoff
- Runtime audit and persisted-key compatibility documentation
- Accessibility and release-readiness documentation
- Repository formatting conventions and CI quality gates

The original minified bundle is not copied over the React/Vite source. Historical runtime documents remain available to explain the original permission, storage and behavior constraints.

## Source branch safeguards

- The extension manifest declares the existing bookmarks, history, clipboard, context menu, tab and tab-group capabilities.
- The service worker uses the hardened lifecycle registration behavior from the original main branch.
- The source build emits a separate, loadable `dist-extension/` directory.
- The widget header is in normal dashboard flow, above search; it is not an absolute floating layer.
- The wallpaper generator packages the complete local catalogue offline.
- CI validates typecheck, tests, build, manifest permissions, icon PNG dimensions and wallpaper assets.

## Merge policy

Keep this branch as the source candidate until its unpacked build has been smoke-tested in Chrome. Merge it into `main` only after reviewing the complete PR diff and confirming existing profile data and Chrome API features remain available. Never delete the original runtime audit or clear user storage to force compatibility.
