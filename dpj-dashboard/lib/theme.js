import { createContext, useContext } from "react";

export const THEMES = [
  { key: "fiber-night", label: "Dark", swatch: "#22d3ee" },
  { key: "daylight", label: "Light", swatch: "#0891a8" },
  { key: "signal-vivid", label: "Terang", swatch: "#facc15" },
  { key: "midnight-gold", label: "Gold", swatch: "#d4af37" },
];

export const ThemeContext = createContext({ theme: "fiber-night", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}
