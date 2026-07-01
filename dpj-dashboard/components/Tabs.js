export default function Tabs({ options, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const customStyle = isActive && opt.color
          ? { background: opt.color, color: "#06141f", boxShadow: `0 4px 14px -4px ${opt.color}` }
          : undefined;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            className={isActive ? "active" : ""}
            style={customStyle}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        );
      })}
      <style jsx>{`
        .tabs {
          display: inline-flex;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
        }
        button {
          appearance: none;
          border: none;
          background: transparent;
          color: var(--text-dim);
          font-size: 13px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: var(--font-body);
        }
        button:hover {
          color: var(--text);
        }
        button.active {
          background: var(--accent);
          color: #06141f;
          box-shadow: 0 4px 14px -4px var(--accent-soft);
        }
      `}</style>
    </div>
  );
}
