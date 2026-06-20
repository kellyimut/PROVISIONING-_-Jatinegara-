export default function MonthPicker({ months, value, onChange }) {
  return (
    <div className="picker">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 9.5H21" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3V6.5M16 3V6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {months.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
      <style jsx>{`
        .picker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 7px 12px;
          color: var(--text-dim);
        }
        select {
          appearance: none;
          background: transparent;
          border: none;
          color: var(--text);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        select:focus-visible {
          outline: 2px solid var(--accent);
          border-radius: 4px;
        }
        option {
          color: #111;
        }
      `}</style>
    </div>
  );
}
