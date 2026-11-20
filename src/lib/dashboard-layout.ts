/** Returns a grid template matching only the widgets that are visible. */
export function getWidgetGridClass(showWeather: boolean, showClock: boolean, showQuote: boolean): string {
  const count = Number(showWeather) + Number(showClock) + Number(showQuote);
  if (count <= 1) return "grid-cols-1";
  if (showWeather && showClock && showQuote) {
    return "grid-cols-[minmax(0,0.78fr)_minmax(0,2fr)_minmax(0,0.78fr)]";
  }
  if (showWeather && showClock) {
    return "grid-cols-[minmax(0,0.78fr)_minmax(0,2fr)]";
  }
  if (showClock && showQuote) {
    return "grid-cols-[minmax(0,2fr)_minmax(0,0.78fr)]";
  }
  return "grid-cols-2";
}
