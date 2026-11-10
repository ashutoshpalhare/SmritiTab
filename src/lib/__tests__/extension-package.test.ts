import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../");

describe("Chrome MV3 package contract", () => {
  const manifest = JSON.parse(
    readFileSync(join(root, "public/manifest.json"), "utf8"),
  ) as {
    manifest_version: number;
    chrome_url_overrides?: { newtab?: string };
    background?: { service_worker?: string };
    permissions?: string[];
    icons?: Record<string, string>;
  };

  it("keeps the New Tab entry, hardened worker and existing API permissions", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.chrome_url_overrides?.newtab).toBe("index.html");
    expect(manifest.background?.service_worker).toBe("background.js");
    for (const permission of [
      "storage",
      "bookmarks",
      "history",
      "clipboardRead",
      "clipboardWrite",
      "contextMenus",
      "tabs",
      "tabGroups",
    ]) {
      expect(manifest.permissions).toContain(permission);
    }
  });

  it("ships valid PNG icons at every declared size", () => {
    for (const size of ["16", "32", "48", "128"]) {
      const file = manifest.icons?.[size];
      expect(file).toBeTruthy();
      const png = readFileSync(join(root, "public", file!));
      expect(png.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      expect(png.readUInt32BE(16)).toBe(Number(size));
      expect(png.readUInt32BE(20)).toBe(Number(size));
    }
  });

  it("preserves namespaced service-worker handoff keys", () => {
    const worker = readFileSync(join(root, "public/background.js"), "utf8");
    expect(worker).toContain('const NAMESPACE = "smrititab:v1"');
    expect(worker).toContain("${NAMESPACE}:pending-search");
    expect(worker).toContain("${NAMESPACE}:pending-action");
    expect(worker).toContain("chrome.runtime.onInstalled");
    expect(worker).toContain("chrome.runtime.onStartup");
  });
});
