import { createContext, useContext, type ReactNode } from "react";
import { useWeather, type WeatherController } from "../hooks/useWeather";

const WeatherContext = createContext<WeatherController | null>(null);

/**
 * Shares a single weather controller across the rail and the widgets so the
 * dashboard never issues duplicate network requests.
 */
export function WeatherProvider({ children }: { children: ReactNode }) {
  const controller = useWeather();
  return (
    <WeatherContext.Provider value={controller}>{children}</WeatherContext.Provider>
  );
}

export function useWeatherController(): WeatherController {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeatherController must be used inside <WeatherProvider>");
  }
  return context;
}
