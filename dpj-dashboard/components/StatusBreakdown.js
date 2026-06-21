import { statusColor } from "../lib/statusColor";

export default function StatusBreakdown({ total, breakdown, compworkValues, totalLabel, onClickTotal, onClickStatus }) {
  return (
    <div className="wrap">
      <div
        className={`totalBlock${onClickTotal ? " clickable" : ""}`}
        onClick={onClickTotal}
        role={onClickTotal ? "button" : undefined}
        tabIndex={onClickTotal ? 0 : undefined}
      >
        <div className="totalValue num-mono">{total}</div>
        <div className="totalLabel">{totalLabel || "Total Order"}</div>
        {onClickTotal && <div className="hint">Klik detail ↗</div>}
      </div>

      <div className="bars">
        {breakdown.length === 0 ? (
          <div className="empty">Belum ada order pada periode ini.</div>
        ) : (
          breakdown.map((b) => {
            const color = statusColor(b.status, compworkValues);
            const hasClick = !!onClickStatus;
            return (
              <div
                className={`row${hasClick ? " rowClick" : ""}`}
                key={b.status}
                onClick={hasClick ? () => onClickStatus(b.status, b.rows || []) : undefined}
                role={hasClick ? "button" : undefined}
                tabIndex={hasClick ? 0 : undefined}
              >
                <div className="rowTop">
                  <span className="dot" style={{ background: color }} />
                  <span className="statusName">{b.status}</span>
                  <span className="count num-mono">{b.count}</span>
                  {hasClick && <span className="rowHint">↗</span>}
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${b.percent}%`, background: color }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .wrap {
          display: grid; grid-template-columns: 150px 1fr;
          gap: 22px; align-items: center;
        }
        .totalBlock {
          text-align: center; padding: 18px 10px;
          border-radius: var(--radius-md);
          background: var(--surface-2); border: 1px solid var(--border);
        }
        .totalBlock.clickable {
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .totalBlock.clickable:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(139,92,246,0.15);
        }
        .totalValue {
          font-family: var(--font-display);
          font-size: 42px; font-weight: 800;
          color: var(--accent); line-height: 1;
        }
        .totalLabel {
          margin-top: 6px; font-size: 11.5px;
          color: var(--text-dim); font-weight: 600;
        }
        .hint {
          margin-top: 6px; font-size: 10px;
          color: var(--accent); opacity: 0.7; font-weight: 600;
        }
        .bars { display: flex; flex-direction: column; gap: 12px; }
        .row { display: flex; flex-direction: column; gap: 5px; }
        .rowClick {
          cursor: pointer; border-radius: 6px; padding: 4px 6px; margin: -4px -6px;
          transition: background 0.12s;
        }
        .rowClick:hover { background: var(--accent-soft); }
        .rowTop {
          display: flex; align-items: center; gap: 8px; font-size: 12.5px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
        .statusName {
          color: var(--text); font-weight: 600; flex: 1;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .count { color: var(--text-dim); }
        .rowHint { font-size: 10px; color: var(--accent); opacity: 0; }
        .rowClick:hover .rowHint { opacity: 0.8; }
        .track {
          height: 6px; border-radius: 4px;
          background: var(--surface-2); overflow: hidden;
        }
        .fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .empty { color: var(--text-faint); font-size: 13px; padding: 20px 0; }
        @media (max-width:640px) { .wrap { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
