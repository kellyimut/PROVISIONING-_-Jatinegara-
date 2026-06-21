import { useEffect, useMemo, useState } from "react";
import { statusColor } from "../lib/statusColor";

const COLUMNS = [
  { key: "tanggalOrderBima", label: "Tgl Order BIMA" },
  { key: "workorderPsb",     label: "Workorder PSB" },
  { key: "serviceNo",        label: "Service No." },
  { key: "crmOrderType",     label: "Order Type" },
  { key: "statusBima",       label: "Status BIMA" },
  { key: "tanggalManja",     label: "Tgl Manja" },
  { key: "progress",         label: "Progress" },
  { key: "reguTeknisi",      label: "Regu/Teknisi" },
  { key: "statusQc2",        label: "Status QC2" },
];

export default function DrillDownModal({ title, rows, compworkValues, onClose }) {
  const [query, setQuery] = useState("");

  // Tutup dengan Esc
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Kunci scroll body saat modal terbuka
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => COLUMNS.some((c) => String(r[c.key] || "").toLowerCase().includes(q)));
  }, [rows, query]);

  function handleExport() {
    const header = COLUMNS.map((c) => `"${c.label}"`).join(",");
    const body = filtered.map((r) =>
      COLUMNS.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `detail-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {/* Header modal */}
        <div className="mhead">
          <div>
            <div className="mtitle">{title}</div>
            <div className="msub">{filtered.length} dari {rows.length} baris</div>
          </div>
          <div className="mactions">
            <div className="msearch">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                placeholder="Cari…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button type="button" className="exportBtn" onClick={handleExport}>⬇ CSV</button>
            <button type="button" className="closeBtn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Tabel */}
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                {COLUMNS.map((c) => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 1} className="empty">Tidak ada data.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id}>
                  <td className="num">{i + 1}</td>
                  {COLUMNS.map((c) => {
                    if (c.key === "statusBima" || c.key === "statusQc2") {
                      const color = statusColor(r[c.key], compworkValues);
                      return (
                        <td key={c.key}>
                          <span className="chip" style={{ color, borderColor: color }}>
                            {r[c.key]}
                          </span>
                        </td>
                      );
                    }
                    const mono = c.key.startsWith("workorder") || c.key === "serviceNo";
                    return <td key={c.key} className={mono ? "mono" : ""}>{r[c.key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          width: 100%; max-width: 1100px;
          max-height: 88vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          overflow: hidden;
        }
        .mhead {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .mtitle { font-size: 15px; font-weight: 700; color: var(--text); }
        .msub   { font-size: 12px; color: var(--text-faint); margin-top: 2px; }
        .mactions {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .msearch {
          display: flex; align-items: center; gap: 7px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 7px 11px;
          color: var(--text-faint);
        }
        .msearch input {
          border: none; background: transparent; color: var(--text);
          font-size: 13px; outline: none; width: 180px;
          font-family: var(--font-body);
        }
        .exportBtn {
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text); font-size: 12.5px; font-weight: 600;
          padding: 7px 12px; border-radius: 8px; cursor: pointer;
        }
        .exportBtn:hover { border-color: var(--accent); color: var(--accent); }
        .closeBtn {
          background: transparent; border: 1px solid var(--border);
          color: var(--text-dim); font-size: 14px;
          padding: 6px 11px; border-radius: 8px; cursor: pointer;
        }
        .closeBtn:hover { background: var(--surface-2); color: var(--text); }
        .tableWrap {
          overflow: auto; flex: 1;
        }
        table {
          border-collapse: collapse; width: 100%;
          font-size: 12.5px; min-width: 900px;
        }
        thead th {
          position: sticky; top: 0; z-index: 1;
          background: var(--surface-2);
          text-align: left; padding: 9px 11px;
          font-size: 10.5px; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-faint);
          font-weight: 700; border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        tbody td {
          padding: 8px 11px; border-bottom: 1px solid var(--border);
          color: var(--text); white-space: nowrap;
        }
        tbody tr:hover { background: var(--accent-soft); }
        .num  { color: var(--text-faint); font-size: 11px; width: 36px; text-align: right; }
        .mono { font-family: var(--font-mono); font-size: 11.5px; }
        .chip {
          display: inline-block; padding: 2px 8px; border-radius: 999px;
          font-size: 11px; font-weight: 700; border: 1px solid;
          background: rgba(127,127,127,0.1); white-space: nowrap;
        }
        .empty {
          text-align: center; color: var(--text-faint);
          padding: 32px 0 !important;
        }
      `}</style>
    </div>
  );
}
