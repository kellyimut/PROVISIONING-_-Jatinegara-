import { statusColor } from "../lib/statusColor";

export default function StatusBreakdown({ total, breakdown, compworkValues, totalLabel }) {
  return (
    <div className="wrap">
      <div className="totalBlock">
        <div className="totalValue num-mono">{total}</div>
        <div className="totalLabel">{totalLabel || "Total Order"}</div>
      </div>

      <div className="bars">
        {breakdown.length === 0 ? (
          <div className="empty">Belum ada order pada periode ini.</div>
        ) : (
          breakdown.map((b) => {
            const color = statusColor(b.status, compworkValues);
            return (
              <div className="row" key={b.status}>
                <div className="rowTop">
                  <span className="dot" style={{ background: color }} />
                  <span className="statusName">{b.status}</span>
                  <span className="count num-mono">{b.count}</span>
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
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 22px;
          align-items: center;
        }
        .totalBlock {
          text-align: center;
          padding: 18px 10px;
          border-radius: var(--radius-md);
          background: var(--surface-2);
          border: 1px solid var(--border);
        }
        .totalValue {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 800;
          color: var(--accent);
          line-height: 1;
        }
        .totalLabel {
          margin-top: 6px;
          font-size: 11.5px;
          color: var(--text-dim);
          font-weight: 600;
        }
        .bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .row {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .rowTop {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex: none;
        }
        .statusName {
          color: var(--text);
          font-weight: 600;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .count {
          color: var(--text-dim);
        }
        .track {
          height: 6px;
          border-radius: 4px;
          background: var(--surface-2);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .empty {
          color: var(--text-faint);
          font-size: 13px;
          padding: 20px 0;
        }
        @media (max-width: 640px) {
          .wrap {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
