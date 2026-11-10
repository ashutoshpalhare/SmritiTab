# Build and package

The current source build uses Vite and emits a Chrome-loadable Manifest V3 package.

For the complete command sequence and Chrome installation steps, see [source build guide](source-build.md).

## Commands

```sh
npm ci
npm run typecheck
npm run test
npm run build:extension
npm run validate:manifest
```

The extension output is `dist-extension/`. Vite copies `public/manifest.json`, `public/background.js` and `public/icons/` into the package, while bundling the React dashboard into local JavaScript/CSS assets. The wallpaper script then creates the complete offline wallpaper catalogue.

The extension mode intentionally keeps the JavaScript external to HTML. Manifest V3's extension page CSP does not permit the inline script produced by the single-file web build.

## Web preview

```sh
npm run dev
npm run build:web
```

The web build is for preview only; the Chrome extension should be loaded from `dist-extension/`.

## Generated files

Both `dist/` and `dist-extension/` are generated outputs and are ignored by Git. Never hand-edit generated bundles or package output.
