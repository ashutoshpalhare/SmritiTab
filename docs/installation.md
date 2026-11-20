# Install SmritiTab for testing

SmritiTab is currently distributed as source and a GitHub Actions test artifact. This guide describes developer installation; it does not claim that a Chrome Web Store listing or permanent public release ZIP exists.

## Option A — Build from source

### Requirements

- Node.js 20 or newer
- npm
- Google Chrome or a compatible Chromium browser

### Build

```sh
git clone https://github.com/ashutoshpalhare/SmritiTab.git
cd SmritiTab
npm ci
npm run typecheck
npm test
npm run build:extension
npm run validate:manifest
```

The validated unpacked extension is written to `dist-extension/`.

### Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the repository's `dist-extension/` directory.
5. Open a new tab and check the extension Errors panel and DevTools console.

To update a locally loaded build, rebuild the project and use the extension card's **Reload** control. Do not delete browser storage as a routine update step.

## Option B — Download the CI test artifact

1. Open [SmritiTab Actions](https://github.com/ashutoshpalhare/SmritiTab/actions).
2. Open the latest successful **Extension CI** run for `main`.
3. In the run's Artifacts section, download `smrititab-extension`.
4. Extract the ZIP archive.
5. Locate the packaged `dist-extension/` folder in the extracted artifact.
6. In `chrome://extensions`, enable Developer mode and choose **Load unpacked**.
7. Select the extracted `dist-extension/` folder.

**Important:** CI artifacts currently expire after 7 days. If the artifact is missing or expired, use Option A. CI artifacts are test outputs, not signed or permanent release downloads.

## Data and profile safety

The extension uses the `smrititab:v1` storage namespace. Test upgrades in a profile that contains the data you intend to preserve. Never clear `chrome.storage.local` as a troubleshooting shortcut. If you want an isolated test, create a separate Chrome profile first.

## Troubleshooting

- **Manifest error:** rerun `npm run validate:manifest` and use the generated `dist-extension/`, not the repository root or `dist/`.
- **New Tab does not change:** confirm the extension is enabled and that no other new-tab extension is overriding it.
- **Extension error after reload:** open the extension's Errors panel and inspect the service worker and New Tab DevTools console.
- **Missing CI artifact:** artifacts expire after the workflow's retention window; build locally instead.

For full regression scope and the manual QA checklist, see [Testing and CI](testing.md) and [Release readiness](release-readiness.md).
