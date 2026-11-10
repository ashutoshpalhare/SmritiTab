import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Two build targets are produced from the same source:
 *
 *  - `vite build` (web) bundles everything into a single self contained
 *    `dist/index.html` so the dashboard can be served from anywhere.
 *  - `vite build --mode extension` emits `dist-extension/` with an *external*
 *    script bundle. MV3 forbids inline scripts (`script-src 'self'`), so the
 *    single file plugin must not be used for the extension package.
 */
export default defineConfig(({ mode }) => {
  const isExtension = mode === "extension";

  return {
    plugins: [react(), tailwindcss(), ...(isExtension ? [] : [viteSingleFile()])],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    base: isExtension ? "./" : "/",
    build: {
      outDir: isExtension ? "dist-extension" : "dist",
      emptyOutDir: true,
      assetsDir: "assets",
      target: "es2020",
      cssCodeSplit: false,
      sourcemap: false,
      chunkSizeWarningLimit: 900,
    },
  };
});
