#!/usr/bin/env node
/**
 * Creates the local wallpaper library in the build output.
 * The first two curated PNGs ship in assets/; the remaining entries are
 * generated as lightweight local SVG gradients so every picker entry works
 * without a network request or a Python/Pillow build dependency.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/copy-wallpapers.mjs <output-dir>");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = join(resolve(target), "wallpapers");
mkdirSync(destination, { recursive: true });

for (const [source, output] of [
  ["assets/wallpaper-aurora.png", "wallpaper-001.png"],
  ["assets/wallpaper-dune.png", "wallpaper-002.png"],
]) {
  const input = join(root, source);
  if (!existsSync(input)) {
    console.error(`✖ Required wallpaper source missing: ${input}`);
    process.exit(1);
  }
  copyFileSync(input, join(destination, output));
}

const palettes = [
  ["#111111", "#7c2d12", "#f97316"],
  ["#18181b", "#713f12", "#f59e0b"],
  ["#1c1917", "#9a3412", "#fb923c"],
  ["#171717", "#431407", "#ea580c"],
  ["#292524", "#78350f", "#fdba74"],
  ["#111111", "#7f1d1d", "#fb923c"],
  ["#18181b", "#9a3412", "#f97316"],
  ["#0c0a09", "#451a03", "#fb923c"],
];

for (let index = 3; index <= 100; index += 1) {
  const number = String(index).padStart(3, "0");
  const [base, middle, glow] = palettes[(index * 7) % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${base}"/>
      <stop offset=".58" stop-color="${middle}"/>
      <stop offset="1" stop-color="#09090b"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="${glow}" stop-opacity=".58"/>
      <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="75"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#base)"/>
  <ellipse cx="${360 + (index * 83) % 1000}" cy="${160 + (index * 47) % 600}" rx="520" ry="330" fill="url(#glow)" filter="url(#blur)"/>
  <path d="M0 720 Q420 ${500 + index % 180} 820 760 T1600 620 V900 H0Z" fill="#000" opacity=".14"/>
  <rect width="1600" height="900" fill="#050505" opacity=".12"/>
</svg>`;
  writeFileSync(join(destination, `wallpaper-${number}.svg`), svg);
}

console.log("✔ Prepared 100 local wallpapers (2 curated PNGs + 98 generated SVGs).");
