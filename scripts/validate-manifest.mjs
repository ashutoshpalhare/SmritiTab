#!/usr/bin/env node
/**
 * Validates the built Chrome extension package.
 *
 * Checks the Manifest V3 requirements that are easy to break silently:
 * manifest version, new tab override, icon files, background worker, CSP and
 * — importantly — that no inline script slipped into the packaged page
 * (MV3 blocks inline scripts via `script-src 'self'`).
 *
 * Usage: node scripts/validate-manifest.mjs [dist-extension]
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "dist-extension");
const failures = [];
const notes = [];

function check(condition, message) {
  if (condition) {
    notes.push(`  ok   ${message}`);
  } else {
    failures.push(message);
  }
}

const manifestPath = join(root, "manifest.json");
if (!existsSync(manifestPath)) {
  console.error(`✖ No manifest found at ${manifestPath}. Run "npm run build:extension" first.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

check(manifest.manifest_version === 3, "manifest_version is 3");
check(typeof manifest.name === "string" && manifest.name.length > 0, "name is set");
check(
  typeof manifest.version === "string" && /^\d+(\.\d+){0,3}$/.test(manifest.version),
  `version "${manifest.version}" is a valid version string`,
);
check(
  typeof manifest.description === "string" && manifest.description.length > 0,
  "description is set",
);
check(
  manifest.chrome_url_overrides?.newtab === "index.html",
  "chrome_url_overrides.newtab points at index.html",
);
check(existsSync(join(root, "index.html")), "index.html exists in the package");

for (const [size, file] of Object.entries(manifest.icons ?? {})) {
  const iconPath = join(root, file);
  const exists = existsSync(iconPath);
  check(exists, `icon ${size} (${file}) exists`);
  if (exists) {
    const bytes = statSync(iconPath).size;
    check(bytes > 0, `icon ${size} is not empty`);
  }
}

if (manifest.background?.service_worker) {
  const worker = join(root, manifest.background.service_worker);
  check(existsSync(worker), `background service worker (${manifest.background.service_worker}) exists`);
}

const csp = manifest.content_security_policy?.extension_pages;
check(
  typeof csp === "string" && csp.includes("script-src 'self'") && !csp.includes("unsafe-eval"),
  "extension page CSP restricts scripts to 'self' and forbids unsafe-eval",
);

const allowedPermissions = new Set([
  "storage",
  "bookmarks",
  "history",
  "clipboardRead",
  "clipboardWrite",
  "contextMenus",
]);
const unexpected = (manifest.permissions ?? []).filter((p) => !allowedPermissions.has(p));
check(unexpected.length === 0, `permissions are minimal (unexpected: ${unexpected.join(", ") || "none"})`);
const broadHosts = (manifest.host_permissions ?? []).filter(
  (host) => !/^https:\/\/[a-z0-9.-]+\/[^]*$/.test(host),
);
check(broadHosts.length === 0, "host permissions are limited to specific https origins");

/* The packaged page must not contain inline scripts (MV3 CSP). */
const html = readFileSync(join(root, "index.html"), "utf8");
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].filter(
  (match) => match[1].trim().length > 0,
);
check(inlineScripts.length === 0, "the packaged page contains no inline scripts");
check(
  /<script[^>]+src="\.\/assets\//.test(html) || /<script[^>]+src="[^"]*assets\//.test(html),
  "the packaged page loads its bundle from an external file",
);
check(!/https?:\/\/[^"']+\.js/.test(html), "no remote scripts are referenced");
check(!/unpkg|jsdelivr|cdn\./.test(html), "no CDN hosted scripts are referenced");

/* The local wallpaper library must ship with the package. */
const wallpaperDir = join(root, "wallpapers");
const wallpaperCount = existsSync(wallpaperDir)
  ? readdirSync(wallpaperDir).filter((file) => /\\.(?:jpg|png|svg)$/i.test(file)).length
  : 0;
check(
  wallpaperCount >= 100,
  `wallpapers/ contains the local wallpaper library (${wallpaperCount} images)`,
);

console.log(`Manifest validation for ${root}`);
for (const note of notes) console.log(note);
if (failures.length > 0) {
  console.error(`\n✖ ${failures.length} check(s) failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`\n✔ All ${notes.length} manifest checks passed.`);
