export default function TechnicianProductivity({ data, emptyLabel }) {
  const max = data.reduce((m, d) => Math.max(m, d.total), 0) || 1;

  return (
    <div className="wrap">
      {data.length === 0 ? (
        <div className="empty">{emptyLabel || "Belum ada data teknisi pada periode ini."}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="rank">#</th>
              <th>Regu / Teknisi</th>
              <th className="num">Order</th>
              <th className="num">COMPWORK</th>
              <th className="pct">RE/PS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.teknisi}>
                <td className="rank num-mono">{i + 1}</td>
                <td className="name">{d.teknisi}</td>
                <td className="num num-mono">{d.total}</td>
                <td className="num num-mono">{d.compwork}</td>
                <td className="pct">
                  <div className="pctRow">
                    <span className="num-mono">{d.percent}%</span>
                    <div className="track">
                      <div
                        className="fill"
                        style={{
                          width: `${(d.total / max) * 100}%`,
                          background: d.percent >= 85 ? "var(--success)" : d.percent >= 60 ? "var(--warning)" : "var(--danger)",
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 480px;
        }
        th {
          text-align: left;
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-faint);
          font-weight: 700;
          padding: 0 10px 10px;
          border-bottom: 1px solid var(--border);
        }
        td {
          padding: 9px 10px;
          border-bottom: 1px solid var(--border);
          color: var(--text);
        }
        tr:last-child td {
          border-bottom: none;
        }
        .rank {
          width: 30px;
          color: var(--text-faint);
        }
        .num,
        th.num {
          text-align: right;
          width: 80px;
        }
        .pct {
          width: 160px;
        }
        .pctRow {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
        }
        .track {
          width: 70px;
          height: 5px;
          border-radius: 4px;
          background: var(--surface-2);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          border-radius: 4px;
        }
        .name {
          font-weight: 600;
        }
        .empty {
          color: var(--text-faint);
          font-size: 13px;
          padding: 16px 0;
        }
      `}</style>
    </div>
  );
}
