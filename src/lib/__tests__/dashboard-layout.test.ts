import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("fixed dashboard header", () => {
  it("uses the weather / hero clock / quote desktop grid", () => {
    const widgets = read("src/components/Widgets.tsx");
    expect(widgets).toContain("grid-cols-[minmax(0,0.78fr)_minmax(0,2fr)_minmax(0,0.78fr)]");
    expect(widgets).toContain("widget-clock-panel");
    expect(widgets).toContain("{period}");
    expect(widgets).toContain("text-orange-500");
    expect(widgets).not.toMatch(/useDrag|position:\s*absolute/);
  });

  it("places widgets in the dashboard flow before search", () => {
    const app = read("src/App.tsx");
    const main = app.slice(app.indexOf("<main"), app.indexOf("</main>"));
    expect(main.indexOf("<WidgetLayer />")).toBeGreaterThanOrEqual(0);
    expect(main.indexOf("<WidgetLayer />")).toBeLessThan(main.indexOf("<SearchBar"));
  });
});
