export default function TeknisiHadirCard({ total, names, loading, error }) {
  return (
    <div className="card">
      <div className="top">
        <span className="eyebrow">Teknisi Hadir Hari Ini</span>
        <span className="badge">ABSENSI</span>
      </div>

      {loading ? (
        <div className="loading">Memuat…</div>
      ) : error ? (
        <div className="errMsg">{error}</div>
      ) : (
        <>
          <div className="totalRow">
            <span className="totalNum num-mono">{total}</span>
            <span className="totalLabel">teknisi hadir</span>
          </div>
          <div className="nameList">
            {names.length === 0 ? (
              <span className="empty">Belum ada data</span>
            ) : (
              names.map((name, i) => {
                const parts = name.split("|");
                const prefix = parts.length > 1 ? parts[0].trim() : null;
                const nama   = parts.length > 1 ? parts.slice(1).join("|").trim() : name.trim();
                return (
                  <div key={i} className="nameChip">
                    {prefix && <span className="prefix">{prefix}</span>}
                    <span className="nama">{nama}</span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px 18px;
          box-shadow: var(--shadow);
          display: flex; flex-direction: column; gap: 10px;
          min-width: 0;
        }
        .top {
          display: flex; align-items: center;
          justify-content: space-between; gap: 6px;
        }
        .eyebrow {
          font-size: 11.5px; font-weight: 700;
          color: var(--text-dim); letter-spacing: 0.01em;
        }
        .badge {
          font-size: 9px; font-weight: 800; letter-spacing: 0.06em;
          padding: 2px 6px; border-radius: 999px;
          color: #34d399; border: 1px solid #34d399;
          background: rgba(52,211,153,0.1); white-space: nowrap;
        }
        .totalRow {
          display: flex; align-items: baseline; gap: 8px;
        }
        .totalNum {
          font-family: var(--font-display);
          font-size: 36px; font-weight: 800;
          color: var(--success); line-height: 1;
        }
        .totalLabel {
          font-size: 12px; color: var(--text-dim); font-weight: 600;
        }
        .nameList {
          display: flex; flex-wrap: wrap; gap: 5px;
        }
        .nameChip {
          display: flex; align-items: center; gap: 4px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 6px; padding: 3px 9px;
          font-size: 11.5px;
        }
        .prefix {
          color: var(--text-faint); font-size: 10px; font-weight: 700;
        }
        .nama {
          color: var(--text); font-weight: 600;
        }
        .loading, .empty { font-size: 12px; color: var(--text-faint); }
        .errMsg { font-size: 11px; color: var(--danger); }
      `}</style>
    </div>
  );
}
