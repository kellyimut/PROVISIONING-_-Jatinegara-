import { useEffect, useState } from "react";
import "../styles/globals.css";
import { THEMES, ThemeContext } from "../lib/theme";

const STORAGE_KEY = "dpj-theme";

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState("fiber-night");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.some((t) => t.key === saved)) setTheme(saved);
    } catch (e) {
      /* localStorage tidak tersedia, gunakan default */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (ready) {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        /* abaikan */
      }
    }
  }, [theme, ready]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Component {...pageProps} />
    </ThemeContext.Provider>
  );
}
