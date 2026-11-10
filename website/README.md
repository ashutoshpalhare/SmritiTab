# SmritiTab website

This directory contains the standalone product landing page for SmritiTab. It is intentionally plain HTML/CSS/JS so the public website can deploy independently from the Chrome extension build and does not need the extension's npm dependencies.

## Local preview

Open `index.html` in a browser, or serve this folder with any static HTTP server.

## GitHub Pages deployment

The `.github/workflows/website-pages.yml` workflow uploads this directory as a Pages artifact and deploys it when changes reach `main`.

One-time repository setup:

1. Open **Settings → Pages** in the SmritiTab repository.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Merge the landing-page changes into `main`.
4. Check the **Deploy SmritiTab website** workflow and its deployment URL.

The project site URL will be:

`https://ashutoshpalhare.github.io/SmritiTab/`

## Content maintenance

Keep product and privacy claims aligned with the current extension implementation. In particular:

- Do not describe the extension as having a Chrome Web Store release unless one is actually published.
- Keep the local-first storage, external weather service, optional remote wallpaper and no-telemetry descriptions accurate.
- Update feature descriptions when the extension changes.
- Creator credit and profile links currently point to Ashutosh Palhare's public portfolio and GitHub profile.
