import { THEMES, useTheme } from "../lib/theme";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="switcher" role="group" aria-label="Pilih tema tampilan">
      {THEMES.map((t) => (
        <button
          key={t.key}
          type="button"
          title={t.label}
          aria-label={`Tema ${t.label}`}
          aria-pressed={theme === t.key}
          className={theme === t.key ? "active" : ""}
          onClick={() => setTheme(t.key)}
        >
          <span className="dot" style={{ background: t.swatch }} />
        </button>
      ))}
      <style jsx>{`
        .switcher {
          display: inline-flex;
          gap: 6px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 5px;
        }
        button {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid transparent;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
        }
        button.active {
          border-color: var(--text-dim);
        }
        .dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
