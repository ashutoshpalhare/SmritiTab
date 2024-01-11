# Official download badges

These 77 SVG files are unmodified official black download badges, retrieved on 2026-09-09. `sources.json` records their original source URLs and SHA-256 hashes. Artwork totals 743,413 bytes. The promotion asset checker verifies every file and its hash before Chrome, Firefox or AMO source packaging. No badge service, remote font or image request runs in the extension.

- Apple: [App Store marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/) and [App Store Marketing Tools](https://toolbox.marketingtools.apple.com/en-us/app-store). The files come from the official Marketing Tools badge API, using its regional language codes. Apple and the Apple logo are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc.
- Google: [Google Play badge guidelines and downloads](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/?folder=86718). The files come from the official digital SVG folder. The Japanese filename says `Print` even though Google supplies it in this digital folder. Google Play and the Google Play logo are trademarks of Google LLC.

Keep the supplied artwork, border, colors and proportions. Badges render at a nominal 48-pixel height, below the platform heading and instructions with 16 pixels of clear space. The entire badge is the download link, with keyboard focus and hover feedback; the dialog and Mobile apps Settings panel have no separate download-page text link. While store links are pending, the badge has no destination, is disabled for assistive technology while the localized platform heading and download guidance remain visible. It becomes a real download link only after that platform has a validated store URL.

## Language coverage

The App Store API supplied 34 of LumiList's 44 languages. The Google Play download folder supplied 43. The following locales intentionally retain the official English artwork because a matching file was unavailable from those official sources. A visible, authored translation of the download action is shown immediately below the badge, and its accessibility label is translated too. This is an explicit artwork exception, not an English fallback for UI copy; do not manufacture translated Apple badge artwork.

| Store | Locale-specific artwork exceptions |
| --- | --- |
| App Store | `am`, `az`, `fa`, `hi`, `kk`, `ne`, `si`, `sw`, `ur`, `uz`. |
| Google Play | `am`. |

All surrounding text and alternative text reuse existing `mobile.*` strings authored in all 44 extension locales. The platform names iPhone and Android remain proper names through the existing `data-no-localize` mechanism. Changing the extension language selects the appropriate bundled badges and fallback captions in both the dialog and Settings immediately.
