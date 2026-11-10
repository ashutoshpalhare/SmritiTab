import { describe, expect, it } from "vitest";
import { describeWeather, formatTemperature } from "../weather";

describe("weather description", () => {
  it("maps clear skies to sun and moon", () => {
    expect(describeWeather(0, true).icon).toBe("sun");
    expect(describeWeather(0, false).icon).toBe("moon");
  });

  it("maps cloud codes", () => {
    expect(describeWeather(2).label).toBe("Partly cloudy");
    expect(describeWeather(3).label).toBe("Overcast");
    expect(describeWeather(45).label).toBe("Foggy");
  });

  it("maps precipitation", () => {
    expect(describeWeather(61).icon).toBe("rain");
    expect(describeWeather(71).icon).toBe("snow");
    expect(describeWeather(95).icon).toBe("storm");
  });

  it("falls back to a safe label for unknown codes", () => {
    expect(describeWeather(1234).label).toBe("Unknown");
  });
});

describe("temperature formatting", () => {
  it("formats celsius", () => {
    expect(formatTemperature(21.4, "c")).toBe("21°C");
  });

  it("converts to fahrenheit", () => {
    expect(formatTemperature(0, "f")).toBe("32°F");
    expect(formatTemperature(100, "f")).toBe("212°F");
  });
});
