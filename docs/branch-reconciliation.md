# Source branch reconciliation — historical record

This document records how the React/Vite source was brought into the original SmritiTab repository. It is retained for project history, not as current branch-selection instructions.

## Current source of truth

The React/Vite implementation was merged into the repository's `main` branch. Continue all ordinary maintenance, testing, documentation and release preparation from `main`.

The branch `React-Vite-source-muse` is a historical source-upload branch, not the current maintained source-of-truth branch. Do not switch to it simply because older notes below mention it.

## Compatibility constraints preserved

- Manifest V3 permissions and background-worker handoff
- The `smrititab:v1` storage namespace and pending-action keys
- Runtime audit and persisted-key compatibility records
- Accessibility and release-readiness documentation
- The dashboard widget header in normal document flow above search
- Offline packaging of the local wallpaper catalogue

## Archived fork separation

The branch `archive/alex302paul-smrititab-main` is a separate snapshot and is excluded from the original project's normal maintenance. Do not merge or import its changes without an explicit, separately reviewed request.

## Historical merge policy

The original branch reconciliation was gated on real Chrome testing because CI cannot prove New Tab override behavior, Chrome API permissions, profile data compatibility or visual behavior. The current project completion plan tracks the remaining owner-side browser QA.
