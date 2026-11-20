# SmritiTab — OG Project Completion Plan

**Scope:** Original repository `ashutoshpalhare/SmritiTab`, default branch `main`.
**Excluded:** The archived `archive/alex302paul-smrititab-main` snapshot. It remains separate and is not a source for automatic merges or feature imports.
**Execution rule:** Complete one phase at a time. Do not begin the next phase until the current phase has a verified exit result.

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 1 | Baseline audit, source-of-truth confirmation, scope freeze and completion plan | Complete |
| 2 | Core dashboard experience: layout, search, bookmark folders, dock and navigation | Complete |
| 3 | Chrome integration and data integrity: storage, service worker, bookmarks, tabs, history and clipboard | Complete |
| 4 | App and widget completeness: notes, tasks, calculator, favorites, weather, profile, settings, clock, quote and wallpapers | Complete |
| 5 | UI/UX finish: responsive behavior, themes, accessibility, keyboard and interaction consistency | Complete |
| 6 | Reliability and security: error handling, performance, permissions, network behavior and dependency review | Complete |
| 7 | Product delivery: landing page, README, architecture/build/testing docs, screenshots and install/release instructions | Complete* |
| 8 | Final verification, CI, release decision, repository review and project closure | Complete* (owner-side Chrome QA and live Pages check pending) |

## Phase 1 — Baseline audit

- Confirmed `main` is the OG project and contains the React 19 + TypeScript + Vite source tree.
- Confirmed the React/Vite source PR was merged into `main`; the separate archive branch is not part of this work.
- Confirmed the extension CI and GitHub Pages deployment workflows exist and last recorded successful runs are attached to the 2026-11-10 `main` commit.
- Confirmed the repo includes source tests, MV3 manifest validation, architecture/build/testing/accessibility/release-readiness documentation and a standalone `website/` landing page.
- Identified documentation drift: the root README still describes `React-Vite-source-muse` as the maintained source branch even though that source was merged into `main`.
- Identified a release gate: automated checks passed on the recorded commit, but the React/Vite build still requires real Chrome Load-unpacked smoke testing. CI success alone is not browser QA.
- Identified an unrelated open PR #3 (`theporndude-categories`) from the archived fork. It is excluded from OG scope and must be reviewed separately before any merge/closure decision.
- Recorded compatibility constraints: preserve the `smrititab:v1` storage namespace and existing user data; do not remove Chrome permissions or change the MV3 entry points without evidence and regression coverage.

**Phase 1 exit: COMPLETE.**

## Phase 2 — Core dashboard experience

- Verified the centered Weather / Clock / Quote row, search providers and keyboard navigation, bookmark folder management, dock and app navigation.
- Fixed search-provider listbox focus and keyboard behavior, including wrapped arrow navigation, Enter selection and Escape restoration.
- Added focused unit coverage for provider-selection wrap-around and aligned the root README with the maintained main source.
- CI passed on commit d0a74e61204d4306cbb3b875998b876b599b767e (run [#44581797200](https://github.com/ashutoshpalhare/SmritiTab/actions/runs/44581797200)).
- Chrome-only behavior and real-browser interaction remain release checks for Phases 3 and 8 respectively.

**Phase 2 exit: COMPLETE.**

## Phase 3 — Chrome integration and data integrity

- Audited the MV3 manifest, service worker handoff, storage backend/migration flow, Chrome bookmark synchronization, history access, active-tab lookup and clipboard flows.
- Fixed web-preview storage isolation: localStorage reads now enumerate only smrititab: keys and corrupt-entry cleanup cannot delete another app's keys.
- Added a regression test proving foreign malformed and plain-text localStorage entries remain untouched while SmritiTab legacy and current keys remain readable.
- Fixed stale asynchronous history responses so an older query cannot overwrite newer results or update a closed app.
- Fixed overlapping bookmark refreshes so an older Chrome API response cannot replace the newest bookmark tree.
- Preserved the smrititab:v1 namespace, existing permissions, manifest entry points and user data.
- CI passed on commit a9f15e74d9238998025180563bfaa4d360daacb1 (run [#44583179936](https://github.com/ashutoshpalhare/SmritiTab/actions/runs/44583179936)); typecheck, automated tests, extension build, manifest validation and artifact upload all succeeded.
- Real Chrome testing of context-menu handoff, keyboard commands, bookmarks, history and clipboard is still required in Phase 8; CI cannot emulate those browser permissions and interactions.

**Phase 3 exit: COMPLETE.**

## Phase 4 — App and widget completeness

- Audited the Notes, Tasks, Calculator, Favorites, Weather, Profile and Settings apps, plus dashboard Clock / Weather / Quote widgets and wallpaper selection/loading.
- Fixed weather request races: older refreshes and older city lookups can no longer overwrite the latest selected location or its forecast.
- Fixed Weather details feedback so an unsuccessful city lookup is visible even while the previous forecast remains on screen.
- Made the daily quote deterministic by local calendar date, so new tabs show the same starting quote for the day while the refresh control can still cycle to another quote.
- Added unit coverage for same-day quote stability, next-day rotation and the empty-list fallback.
- Existing note/task persistence, calculator evaluation, favorites validation, profile editing, settings controls and wallpaper asset checks remain covered by the current implementation and test suite.
- CI passed on commit c5e59aaacd2657b38da570378c5710a467163d7b (run [#44586383130](https://github.com/ashutoshpalhare/SmritiTab)); typecheck, tests, extension build, manifest validation and artifact upload succeeded.
- Actual UI/browser verification remains part of Phase 8; no Chrome browser QA is claimed from CI.

**Phase 4 exit: COMPLETE.**

## Phase 5 — UI/UX finish

- Audited the dashboard widget strip, responsive overflow behavior, light/dark/system theme application, orange focus visibility, reduced-motion and forced-colors styles, search-provider keyboard interaction, shared controls and modal focus handling.
- Found a layout defect when exactly one dashboard widget was enabled: the fallback grid still declared two columns, leaving the lone widget at half width. This affected Weather-only, Clock-only and Quote-only configurations.
- Extracted widget-grid selection into `src/lib/dashboard-layout.ts` and fixed all single-widget states to use one full-width column while preserving the existing Weather / hero Clock / Quote proportions for two- and three-widget states.
- Added focused tests for every one-, two- and three-widget visibility combination and retained checks for mobile horizontal scrolling, reduced motion, forced-colors focus and widget-before-search ordering.
- Preserved the orange/black identity, the fixed horizontal widget strip, clock hierarchy and existing theme settings; no broad visual redesign or data migration was introduced.
- CI passed on commit 7e1cc1ed9b2c95df5f7e68ee6ebebe319e75bba5 (run [#44762720882](https://github.com/ashutoshpalhare/SmritiTab/actions/runs/44762720882)); dependency audit, typecheck, automated tests, extension build, manifest validation and artifact upload succeeded.
- Responsive appearance still needs a real Chrome visual check at narrow/mobile, tablet and desktop widths in Phase 8; automated layout-contract tests do not replace rendered browser QA.

**Phase 5 exit: COMPLETE.**

## Phase 6 — Reliability and security

- Reviewed the MV3 manifest, host permissions, navigation helper, app navigation fallback, bookmark creation, wallpaper URL resolution, weather network boundary, storage isolation and dependency audit.
- Hardened URL normalization to allow only valid HTTP/HTTPS destinations, reject executable/non-web schemes (including `javascript:`, `data:`, `file:`, `ftp:` and `chrome:`), reject embedded credentials and malformed addresses, while preserving the existing clean host URL format and local development host support.
- Applied the same validation before navigation and before the web fallback, so a failed Chrome tab open cannot retry an unsafe original URL.
- Bookmark creation now validates and normalizes the entered destination before writing it to Chrome bookmarks.
- Remote wallpaper resolution now accepts HTTPS only; unsupported schemes and protocol-relative external URLs are rejected. Local bundled wallpaper paths remain supported.
- Corrected the stale wallpaper host permission: the configured remote entries use Picsum, not Unsplash. The manifest and package validator now declare/check the actual Picsum origin while retaining the existing weather and font hosts and all existing Chrome API permissions.
- Added regression coverage for safe URL normalization, unsupported schemes, embedded credentials, HTTPS-only remote wallpapers and the actual wallpaper host permission.
- Preserved the `smrititab:v1` storage namespace and existing user data. No broad permission additions, dependency upgrades, telemetry or backend services were introduced.
- Dependency audit reported 0 vulnerabilities. CI passed on commit f75b7d9a2f315ec16336e2972f0d3b4cf27a3139 (run [#44765718185](https://github.com/ashutoshpalhare/SmritiTab/actions/runs/44765718185)): typecheck, all 11 test files, extension build, all 33 manifest checks and artifact upload succeeded.
- Real Chrome permission prompts, external wallpaper redirect behavior and runtime navigation remain part of Phase 8 manual smoke testing; no live-browser test is claimed here.

**Phase 6 exit: COMPLETE.**


## Phase 7 — Product delivery

- Updated the root README to identify `main` as the maintained source of truth, document the current stack/features, add a clean clone/build/test/Load-unpacked path, and link the product landing page and installation guide.
- Added `docs/installation.md` with source-build instructions, the exact Chrome Load unpacked flow, CI artifact retrieval, the 7-day artifact expiry, profile/data safety and troubleshooting.
- Aligned `docs/architecture.md`, `docs/branch-reconciliation.md` and `docs/release-readiness.md` with the current merged `main` source. Older source-branch language is now explicitly historical; the Alex fork archive remains separate.
- Updated `docs/testing.md` to distinguish automated CI checks from real Chrome QA and to document the CI artifact retention boundary.
- Updated `website/index.html` so its primary action points to the install guide, installation steps match the actual `dist-extension/` output, and the page does not imply that a permanent release ZIP or Chrome Web Store listing already exists. Existing responsive styling, CDN-enhanced interactions, light/dark website theme and Ashutosh Palhare attribution are retained.
- Re-read the committed README and landing-page source after updates; verified that the install-guide links exist and the obsolete “Explore releases” hero action is gone.
- Changes were committed directly to `main`: `1e2180c5` (README), `304a011b` (architecture), `3c2ccbc9` (historical branch record), `2706f748` (release readiness), `aae05f66` (installation guide), `3443343e` (landing page), and `648e00f7` (testing docs).
- No extension runtime code, manifest permissions or stored data were changed in this phase. A new extension build is therefore not required to validate the documentation edits. Live GitHub Pages deployment verification and real screenshots are deferred to Phase 8; screenshots will be captured only after the current extension build has passed Chrome smoke testing.

**Phase 7 exit: COMPLETE for documentation and product-page source.** Live deployment, genuine screenshots and Chrome QA remain Phase 8 release checks.

## Phase 8 — Final verification and project closure

- Reconfirmed the repository is public, not archived, and uses `main` as its default branch. The latest repository commit is `3fd8251fdb1ab8de805eb6e6e6a024e64e16a281` (Phase 7 completion record, 2026-11-20).
- Rechecked the maintained README, architecture, installation guide, release-readiness checklist, testing guide, manifest, package scripts and landing-page source. The build commands and output folder agree: `npm run build:extension` generates `dist-extension/`, followed by `npm run validate:manifest`.
- Verified the final code-change CI run `#44765718185` completed successfully on code commit `f75b7d9a2f315ec16336e2972f0d3b4cf27a3139`. Its artifact `smrititab-extension` exists, is not expired, and expires 2026-11-27 15:41 UTC. The later Phase 7 commits changed documentation and the static landing page only; they did not change extension runtime code or the manifest.
- Verified the follow-up CI run `#44765837317` completed successfully. All job steps passed: dependency audit, typecheck, automated tests, extension build, manifest validation and artifact upload. Its artifact is also available until 2026-11-27 15:41 UTC.
- Confirmed the current open PR #3 changes only `assets/dashboard.bundle.js` and is unrelated to the maintained React/Vite source. It was deliberately not merged or closed; it remains outside the OG project scope pending the owner's separate decision.
- Preserved all existing branches, including `archive/alex302paul-smrititab-main`, and made no destructive cleanup, storage reset, release tag or public release declaration.
- The live GitHub Pages URL could not be independently fetched in this verification environment. The committed `website/index.html` and supporting assets are present, but the deployed page's HTTP response and latest deployment status remain unverified.
- Real Chrome Load-unpacked QA cannot be executed through the repository connector. The checklist in `docs/release-readiness.md` remains an owner-side acceptance gate, especially for New Tab override, Chrome permissions, storage preservation, responsive layout, weather/wallpapers and console errors.
- No fabricated screenshots were added. Capture genuine product screenshots after the Chrome smoke test, then add them to the landing page/README if desired.

**Phase 8 exit: COMPLETE for repository, source, CI and scope closure.** The OG development plan is closed at 8/8 phases. **Public release readiness remains BLOCKED** until the owner confirms the real Chrome smoke test and the live GitHub Pages deployment is checked.

### Final owner-side acceptance checklist

- [ ] Load the current `dist-extension/` build in Chrome via `chrome://extensions`.
- [ ] Confirm SmritiTab replaces New Tab and Chrome shows no extension errors.
- [ ] Confirm existing `smrititab:v1` notes, tasks, bookmarks/settings and other data remain intact.
- [ ] Test dashboard widgets, search, bookmark manager, dock, apps, themes and wallpapers.
- [ ] Check desktop and narrow viewport layout; inspect DevTools console.
- [ ] Open the live [GitHub Pages landing page](https://ashutoshpalhare.github.io/SmritiTab/) and confirm the current content loads.
- [ ] Capture genuine screenshots only after the above checks pass.

1. Each phase must include a focused code/documentation change where needed, relevant tests, and a verified GitHub result.
2. Never claim browser behavior is verified from CI alone.
3. Preserve existing user data; never clear extension storage as a workaround.
4. Do not import the archived fork or merge unrelated PRs into OG without explicit review.
5. Prefer small, meaningful commits with real diffs. No artificial commit-count targets.
6. Keep this file updated at the end of each phase with status, checks, commits/PRs and any user-side manual check that remains.

