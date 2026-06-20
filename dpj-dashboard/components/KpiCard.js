function Ring({ percent, color }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 24 24)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export default function KpiCard({ label, value, suffix, sub, kind = "number", percent, achieved, icon }) {
  const ringColor = achieved ? "var(--success)" : percent != null && percent < 50 ? "var(--danger)" : "var(--warning)";

  return (
    <div className="kpi">
      <div className="top">
        <span className="label">{label}</span>
        {icon}
      </div>

      {kind === "percent" ? (
        <div className="percentRow">
          <Ring percent={percent} color={ringColor} />
          <div>
            <div className="value num-mono" style={{ color: ringColor }}>
              {percent}
              <span className="suffix">%</span>
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
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-dim);
          letter-spacing: 0.01em;
        }
        .value {
          font-family: var(--font-display);
          font-size: 30px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
          line-height: 1.1;
        }
        .suffix {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-dim);
          margin-left: 3px;
        }
        .sub {
          font-size: 11.5px;
          color: var(--text-faint);
        }
        .percentRow {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tag {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          display: inline-block;
          margin-top: 2px;
        }
        .tag.ok {
          color: var(--success);
          background: rgba(52, 211, 153, 0.12);
        }
        .tag.warn {
          color: var(--warning);
          background: rgba(251, 191, 36, 0.12);
        }
      `}</style>
    </div>
  );
}
