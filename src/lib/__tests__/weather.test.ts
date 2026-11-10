import { describe, expect, it, vi } from "vitest";
import { describeWeather, formatTemperature, getBrowserLocation } from "../weather";

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

describe("browser weather location", () => {
  it("uses browser coordinates instead of inferring a city from timezone", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 19.95, longitude: 75.16 },
      } as GeolocationPosition);
    });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    try {
      await expect(getBrowserLocation()).resolves.toMatchObject({
        name: "Your location",
        latitude: 19.95,
        longitude: 75.16,
      });
      expect(getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ maximumAge: 300000 }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("explains denied location permission and offers manual city selection", async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: "Permission denied" } as GeolocationPositionError);
      },
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    try {
      await expect(getBrowserLocation()).rejects.toThrow(
        "Location permission was denied. Choose a city in Weather details.",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
