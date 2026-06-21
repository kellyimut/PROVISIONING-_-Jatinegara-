import { useMemo, useState } from "react";
import { statusColor } from "../lib/statusColor";

const COLUMNS = [
  { key: "tanggalSetting",        label: "Tgl Setting" },
  { key: "tanggalOrderBima",      label: "Tgl Order BIMA" },
  { key: "workorderPsb",          label: "Workorder PSB" },
  { key: "serviceNo",             label: "Service No." },
  { key: "crmOrderType",          label: "Order Type" },
  { key: "statusBima",            label: "Status BIMA" },
  { key: "progress",              label: "Progress" },
  { key: "reguTeknisi",           label: "Regu/Teknisi" },
  { key: "statusQc2",             label: "Status QC2" },
];

export default function SettingTodayTable({ rows, compworkValues }) {
  const [query, setQuery] = useState("");

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
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `setting-hari-ini-${Date.now()}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // Hitung ringkasan status per teknisi untuk setting hari ini
  const byTeknisi = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const name = (r.reguTeknisi || "Belum Ditugaskan").trim() || "Belum Ditugaskan";
      if (!map.has(name)) map.set(name, { name, total: 0, compwork: 0 });
      const e = map.get(name);
      e.total++;
      if (compworkValues.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())) e.compwork++;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rows, compworkValues]);

  return (
    <div className="wrap">
      {/* Ringkasan per teknisi */}
      {byTeknisi.length > 0 && (
        <div className="summary">
          {byTeknisi.map((t) => (
            <div key={t.name} className="techChip">
              <span className="techName">{t.name}</span>
              <span className="techCount">{t.compwork}/{t.total}</span>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Cari service no, teknisi…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="meta">
          <span>{filtered.length} dari {rows.length} order setting hari ini</span>
          <button type="button" onClick={handleExport} className="exportBtn">
            ⬇ Ekspor CSV
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="tableScroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              {COLUMNS.map((c) => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="emptyCell">
                  {rows.length === 0
                    ? "Belum ada order yang dijadwalkan setting hari ini."
                    : "Tidak ada data yang cocok dengan pencarian."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r.id}>
                  <td className="num">{i + 1}</td>
                  {COLUMNS.map((c) => {
                    if (c.key === "statusBima" || c.key === "statusQc2") {
                      const color = statusColor(r[c.key], compworkValues);
                      return (
                        <td key={c.key}>
                          <span className="chip" style={{ color, borderColor: color }}>{r[c.key]}</span>
                        </td>
                      );
                    }
                    const mono = c.key.startsWith("workorder") || c.key === "serviceNo";
                    return <td key={c.key} className={mono ? "mono" : ""}>{r[c.key]}</td>;
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .wrap { display: flex; flex-direction: column; gap: 14px; }
        .summary {
          display: flex; flex-wrap: wrap; gap: 8px;
          padding: 10px 14px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 10px;
        }
        .techChip {
          display: flex; align-items: center; gap: 6px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 999px; padding: 4px 12px;
          font-size: 12px;
        }
        .techName { color: var(--text); font-weight: 600; }
        .techCount {
          color: var(--accent); font-weight: 700;
          font-family: var(--font-mono); font-size: 11px;
        }
        .toolbar {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px; flex-wrap: wrap;
        }
        .search {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 10px; padding: 8px 12px;
          color: var(--text-faint); flex: 1;
          min-width: 200px; max-width: 360px;
        }
        .search input {
          border: none; background: transparent; color: var(--text);
          font-size: 13px; outline: none; width: 100%;
          font-family: var(--font-body);
        }
        .meta {
          display: flex; align-items: center; gap: 12px;
          font-size: 12.5px; color: var(--text-dim);
        }
        .exportBtn {
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text); font-weight: 600; font-size: 12.5px;
          padding: 7px 12px; border-radius: 8px; cursor: pointer;
        }
        .exportBtn:hover { border-color: var(--accent); color: var(--accent); }
        .tableScroll {
          overflow-x: auto; border: 1px solid var(--border);
          border-radius: var(--radius-md); max-height: 480px; overflow-y: auto;
        }
        table {
          border-collapse: collapse; width: 100%;
          font-size: 12.5px; min-width: 900px;
        }
        thead th {
          position: sticky; top: 0; z-index: 1;
          background: var(--surface-2); text-align: left;
          padding: 10px 12px; font-size: 10.5px;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--text-faint); font-weight: 700;
          border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        tbody td {
          padding: 9px 12px; border-bottom: 1px solid var(--border);
          color: var(--text); white-space: nowrap;
        }
        tbody tr:nth-child(even) { background: rgba(127,127,127,0.035); }
        tbody tr:hover { background: var(--accent-soft); }
        .num { color: var(--text-faint); font-size: 11px; width: 36px; text-align: right; }
        .mono { font-family: var(--font-mono); font-size: 11.5px; }
        .chip {
          display: inline-block; padding: 2px 9px; border-radius: 999px;
          font-size: 11px; font-weight: 700; border: 1px solid;
          background: rgba(127,127,127,0.1); white-space: nowrap;
        }
        .emptyCell {
          text-align: center; color: var(--text-faint);
          padding: 28px 0 !important; white-space: normal;
        }
      `}</style>
    </div>
  );
}
