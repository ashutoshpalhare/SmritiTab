# Accessibility and responsive UX

## Current source implementation

- Keyboard focus uses the orange product accent with a visible outline.
- Light, dark and system themes are supported.
- Reduced-motion preferences are respected by the global stylesheet.
- Windows High Contrast / forced-colors mode receives a system Highlight focus outline and visible widget borders.
- Widget header order is Weather → Clock → Quote, with the clock as the hero.
- The header remains one row on narrow screens and can scroll horizontally without forcing the cards into a vertical stack.
- Weather and quote panels use compact glass surfaces with a narrow orange leading accent; the clock uses a slightly stronger transparent glass treatment and a subtle orange top line.
- Clock AM/PM is a separate orange element and is omitted in 24-hour mode.

## Manual checks

Test the generated `dist-extension/` in Chrome at 320px, 375px, 640px, tablet and desktop widths:

1. Confirm the widget row is above search and does not overlap the top bar.
2. Confirm Weather, Clock and Quote remain in the requested order; scroll the row horizontally on mobile.
3. Confirm AM/PM is visually separate and orange; switch between 12-hour and 24-hour settings.
4. Toggle each widget independently and confirm remaining widgets use the available layout without blank columns.
5. Use Tab and Shift+Tab through search, widgets, dock, bookmark controls and dialogs.
6. Confirm light/dark themes retain readable glass surfaces and visible orange focus.
7. Enable reduced motion and confirm transitions are minimized.
8. Enable Windows High Contrast / forced-colors and confirm focus rings and panel boundaries remain visible.
8. Check extension errors and browser console after load.

Automated tests cover layout contracts and manifest assets, but only a real Chrome session can validate the final rendered appearance and browser integration.
