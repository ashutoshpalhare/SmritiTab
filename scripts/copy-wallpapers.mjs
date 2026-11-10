#!/usr/bin/env node
/**
 * Copies the local wallpaper library (assets/wallpapers/) into a build
 * output folder as `wallpapers/`, where wallpapers.js entries point.
 *
 * Usage: node scripts/copy-wallpapers.mjs <output-dir>
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/copy-wallpapers.mjs <output-dir>");
  process.exit(1);
}

const source = resolve("assets/wallpapers");
const destination = join(resolve(target), "wallpapers");

if (!existsSync(source)) {
  console.error(`✖ Wallpaper source directory not found: ${source}`);
  process.exit(1);
}

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
const count = readdirSync(destination).filter((file) => file.endsWith(".jpg")).length;
console.log(`✔ Copied ${count} wallpapers to ${destination}`);
