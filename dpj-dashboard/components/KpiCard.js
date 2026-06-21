function Ring({ percent, color }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform="rotate(-90 24 24)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export default function KpiCard({ label, value, suffix, sub, kind = "number", percent, achieved, icon, onClick, badge }) {
  const ringColor = achieved ? "var(--success)" : percent != null && percent < 50 ? "var(--danger)" : "var(--warning)";
  const clickable = !!onClick;

  return (
    <div className={`kpi${clickable ? " clickable" : ""}`} onClick={onClick} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      <div className="top">
        <span className="label">{label}</span>
        <div className="topRight">
          {badge && <span className={`badge badge-${badge.toLowerCase()}`}>{badge}</span>}
          {clickable && <span className="drillHint">↗</span>}
          {icon}
        </div>
      </div>

      {kind === "percent" ? (
        <div className="percentRow">
          <Ring percent={percent} color={ringColor} />
          <div>
            <div className="value num-mono" style={{ color: ringColor }}>
              {percent}<span className="suffix">%</span>
            </div>
            <div className={`tag ${achieved ? "ok" : "warn"}`}>{achieved ? "Tercapai" : "Perlu Perhatian"}</div>
          </div>
        </div>
      ) : (
        <div className="value num-mono">
          {value}
          {suffix ? <span className="suffix">{suffix}</span> : null}
        </div>
      )}

      {sub ? <div className="sub">{sub}</div> : null}

      <style jsx>{`
        .kpi {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px 18px;
          box-shadow: var(--shadow);
          display: flex; flex-direction: column; gap: 8px;
          min-width: 0;
        }
        .kpi.clickable {
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .kpi.clickable:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(139,92,246,0.18), var(--shadow);
          transform: translateY(-2px);
        }
        .kpi.clickable:active { transform: translateY(0); }
        .top {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 4px;
        }
        .topRight {
          display: flex; align-items: center; gap: 5px; flex-shrink: 0;
        }
        .label {
          font-size: 11.5px; font-weight: 600;
          color: var(--text-dim); letter-spacing: 0.01em;
          line-height: 1.3;
        }
        .badge {
          font-size: 9px; font-weight: 800; letter-spacing: 0.06em;
          padding: 2px 6px; border-radius: 999px; border: 1px solid;
          white-space: nowrap;
        }
        .badge-bima    { color: #f59e0b; border-color: #f59e0b; background: rgba(245,158,11,0.1); }
        .badge-setting { color: #60a5fa; border-color: #60a5fa; background: rgba(96,165,250,0.1); }
        .drillHint {
          font-size: 10px; font-weight: 700;
          color: var(--accent); opacity: 0.7;
        }
        .value {
          font-family: var(--font-display);
          font-size: 30px; font-weight: 700;
          color: var(--text); letter-spacing: -0.01em; line-height: 1.1;
        }
        .suffix {
          font-size: 15px; font-weight: 600;
          color: var(--text-dim); margin-left: 3px;
        }
        .sub { font-size: 11.5px; color: var(--text-faint); }
        .percentRow { display: flex; align-items: center; gap: 12px; }
        .tag {
          font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 999px;
          display: inline-block; margin-top: 2px;
        }
        .tag.ok  { color: var(--success); background: rgba(52,211,153,0.12); }
        .tag.warn { color: var(--warning); background: rgba(251,191,36,0.12); }
      `}</style>
    </div>
  );
}
