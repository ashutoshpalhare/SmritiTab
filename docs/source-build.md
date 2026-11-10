# React/Vite source build

## Requirements

- Node.js 20 or newer (CI uses Node 22)
- npm
- Chrome or Chromium for unpacked-extension testing

## Install and verify

```sh
npm ci
npm run typecheck
npm run test
npm run build:extension
npm run validate:manifest
```

The extension build uses Vite's `extension` mode. It intentionally does not use the single-file web plugin: Manifest V3 requires local external scripts under the extension page Content Security Policy.

The generated `dist-extension/` directory contains:

- `manifest.json`
- `index.html`
- bundled JavaScript and CSS under `assets/`
- `background.js`
- `icons/` (16, 32, 48 and 128 px PNG files)
- `wallpapers/` (two curated PNGs and generated local SVGs)

## Load unpacked

1. Run the commands above and wait for `validate:manifest` to pass.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Remove or disable an older SmritiTab build only after recording which profile/data it uses.
5. Select **Load unpacked** and choose `dist-extension/`.
6. Open a new tab and inspect the extension's Errors panel and DevTools console.

Do not clear `chrome.storage.local` to work around a problem. The source runtime uses the `smrititab:v1` namespace and the background worker passes pending search/action values through the existing namespaced keys.

## Wallpaper packaging

The two curated PNG source files live under `assets/`. `scripts/copy-wallpapers.mjs` copies them and generates the remaining local SVG gradient wallpapers into the build output. It resolves the project root from its own file location, so it does not depend on the shell's current working directory.

The optional Picsum entries are external and are not required for the default local wallpaper library to work.

## Build output

`dist-extension/` is generated and ignored by Git. Do not edit it directly. Make changes in `src/`, `public/`, `assets/`, `wallpapers.js` or `scripts/`, then rebuild.

The CI artifact is named `smrititab-extension` and contains the unpacked extension directory.
