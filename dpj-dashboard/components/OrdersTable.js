import { useMemo, useState } from "react";
import { statusColor } from "../lib/statusColor";

const COLUMNS = [
  { key: "tanggalSetting", label: "Tanggal Setting" },
  { key: "tanggalOrderBima", label: "Tanggal Order BIMA" },
  { key: "workorderPsb", label: "Workorder PSB" },
  { key: "workorderOdpValidation", label: "Workorder ODP Validation" },
  { key: "serviceNo", label: "Service No." },
  { key: "crmOrderType", label: "CRM Order Type" },
  { key: "statusBima", label: "Status BIMA" },
  { key: "tanggalManja", label: "Tanggal Manja" },
  { key: "progress", label: "Progress" },
  { key: "reguTeknisi", label: "Regu/Teknisi" },
  { key: "statusQc2", label: "Status QC2" },
];

const PAGE_SIZE = 50;

function toCsv(rows) {
  const header = COLUMNS.map((c) => `"${c.label}"`).join(",");
  const body = rows
    .map((r) => COLUMNS.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export default function OrdersTable({ rows, compworkValues }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      COLUMNS.some((c) => String(r[c.key] || "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExport() {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-jatinegara-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="wrap">
      <div className="toolbar">
        <div className="search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Cari service no, workorder, teknisi…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="meta">
          <span>{filtered.length} baris</span>
          <button type="button" onClick={handleExport} className="exportBtn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ekspor CSV
          </button>
        </div>
      </div>

      <div className="tableScroll">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="emptyCell">
                  Tidak ada data yang cocok.
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.id}>
                  {COLUMNS.map((c) => {
                    if (c.key === "statusBima" || c.key === "statusQc2") {
                      const color = statusColor(r[c.key], compworkValues);
                      return (
                        <td key={c.key}>
                          <span className="chip" style={{ color, background: "rgba(127,127,127,0.12)", borderColor: color }}>
                            {r[c.key]}
                          </span>
                        </td>
                      );
                    }
                    const mono = c.key.startsWith("workorder") || c.key === "serviceNo";
                    return (
                      <td key={c.key} className={mono ? "num-mono" : ""}>
                        {r[c.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Sebelumnya
          </button>
          <span>
            Halaman {page} / {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Berikutnya →
          </button>
        </div>
      ) : null}

      <style jsx>{`
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 12px;
          color: var(--text-faint);
          flex: 1;
          min-width: 220px;
          max-width: 360px;
        }
        .search input {
          border: none;
          background: transparent;
          color: var(--text);
          font-size: 13px;
          outline: none;
          width: 100%;
          font-family: var(--font-body);
        }
        .meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12.5px;
          color: var(--text-dim);
        }
        .exportBtn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text);
          font-weight: 600;
          font-size: 12.5px;
          padding: 7px 12px;
          border-radius: 8px;
          cursor: pointer;
        }
        .exportBtn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .tableScroll {
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          max-height: 560px;
          overflow-y: auto;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 12.5px;
          min-width: 1180px;
        }
        thead th {
          position: sticky;
          top: 0;
          background: var(--surface-2);
          text-align: left;
          padding: 10px 12px;
          font-size: 10.5px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-faint);
          font-weight: 700;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
          z-index: 1;
        }
        tbody td {
          padding: 9px 12px;
          border-bottom: 1px solid var(--border);
          color: var(--text);
          white-space: nowrap;
        }
        tbody tr:nth-child(even) {
          background: rgba(127, 127, 127, 0.035);
        }
        tbody tr:hover {
          background: var(--accent-soft);
        }
        .emptyCell {
          text-align: center;
          color: var(--text-faint);
          padding: 28px 0 !important;
          white-space: normal;
        }
        .chip {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          border: 1px solid;
          white-space: nowrap;
        }
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 14px;
          font-size: 12.5px;
          color: var(--text-dim);
        }
        .pagination button {
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .pagination button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
