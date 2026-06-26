import { useMemo, useState, useCallback } from "react";
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

// ── Inline editor untuk STATUS QC2 ──────────────────────────────────────────
function Qc2Cell({ row, compworkValues, onSaved }) {
  const [editing, setEditing]   = useState(false);
  const [value, setValue]       = useState(row.statusQc2 && row.statusQc2 !== "-" ? row.statusQc2 : "");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [saved, setSaved]       = useState(false);

  const color = statusColor(row.statusQc2, compworkValues);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/update-qc2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workorderPsb: row.workorderPsb, statusQc2: value.trim() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Gagal menyimpan.");
      setSaved(true);
      setEditing(false);
      if (onSaved) onSaved(row.workorderPsb, value.trim());
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }, [row.workorderPsb, value, saving, onSaved]);

  const handleCancel = () => {
    setValue(row.statusQc2 && row.statusQc2 !== "-" ? row.statusQc2 : "");
    setEditing(false);
    setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <td className="qc2Cell editing">
        <div className="editWrap">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Isi status QC2…"
            disabled={saving}
            className="qc2Input"
          />
          <div className="editActions">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btnSave"
              title="Simpan (Enter)"
            >
              {saving ? "…" : "✓"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btnCancel"
              title="Batal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
        {error && <div className="errMsg">{error}</div>}
        <style jsx>{`
          .qc2Cell { min-width: 200px; }
          .qc2Cell.editing { padding: 6px 8px !important; }
          .editWrap { display: flex; align-items: center; gap: 4px; }
          .qc2Input {
            flex: 1; background: var(--surface);
            border: 1px solid var(--accent); border-radius: 6px;
            color: var(--text); font-size: 12px; padding: 5px 8px;
            outline: none; font-family: var(--font-body);
            min-width: 0;
          }
          .qc2Input:disabled { opacity: 0.6; }
          .editActions { display: flex; gap: 3px; flex-shrink: 0; }
          .btnSave {
            background: var(--success, #34d399); color: #0a2e1f;
            border: none; border-radius: 5px; font-weight: 800;
            font-size: 12px; padding: 4px 8px; cursor: pointer;
            min-width: 28px;
          }
          .btnSave:disabled { opacity: 0.5; cursor: not-allowed; }
          .btnCancel {
            background: var(--surface-2); color: var(--text-dim);
            border: 1px solid var(--border); border-radius: 5px;
            font-size: 11px; padding: 4px 7px; cursor: pointer;
            min-width: 28px;
          }
          .btnCancel:hover { border-color: var(--danger); color: var(--danger); }
          .errMsg {
            font-size: 10.5px; color: var(--danger);
            margin-top: 4px; white-space: normal;
          }
        `}</style>
      </td>
    );
  }

  return (
    <td className="qc2Cell">
      <div className="qc2Row">
        {row.statusQc2 && row.statusQc2 !== "-" ? (
          <span className="chip" style={{ color, borderColor: color }}>{row.statusQc2}</span>
        ) : (
          <span className="empty">—</span>
        )}
        {saved && <span className="savedBadge">✓ Tersimpan</span>}
        <button
          type="button"
          className="editBtn"
          onClick={() => { setSaved(false); setEditing(true); }}
          title="Edit STATUS QC2"
        >
          ✏
        </button>
      </div>
      <style jsx>{`
        .qc2Cell { min-width: 190px; }
        .qc2Row {
          display: flex; align-items: center; gap: 6px;
          flex-wrap: nowrap;
        }
        .chip {
          display: inline-block; padding: 2px 9px; border-radius: 999px;
          font-size: 11px; font-weight: 700; border: 1px solid;
          background: rgba(127,127,127,0.1); white-space: nowrap;
        }
        .empty { color: var(--text-faint); font-size: 12px; }
        .savedBadge {
          font-size: 10px; font-weight: 700;
          color: var(--success, #34d399);
          white-space: nowrap;
        }
        .editBtn {
          background: transparent; border: 1px solid transparent;
          color: var(--text-faint); font-size: 11px;
          border-radius: 5px; cursor: pointer; padding: 2px 5px;
          opacity: 0; transition: opacity 0.15s, border-color 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .qc2Row:hover .editBtn {
          opacity: 1;
          border-color: var(--border);
          color: var(--accent);
        }
        .editBtn:hover {
          background: var(--accent-soft);
          border-color: var(--accent) !important;
        }
      `}</style>
    </td>
  );
}

// ── Komponen utama ───────────────────────────────────────────────────────────
export default function SettingTodayTable({ rows, compworkValues }) {
  const [query, setQuery] = useState("");
  // Simpan update lokal supaya tampilan langsung berubah tanpa nunggu refresh
  const [localUpdates, setLocalUpdates] = useState({});

  const handleSaved = useCallback((workorderPsb, newValue) => {
    setLocalUpdates((prev) => ({ ...prev, [workorderPsb]: newValue }));
  }, []);

  // Gabungkan data rows dengan update lokal
  const mergedRows = useMemo(() =>
    rows.map((r) =>
      r.workorderPsb in localUpdates
        ? { ...r, statusQc2: localUpdates[r.workorderPsb] }
        : r
    ),
    [rows, localUpdates]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return mergedRows;
    const q = query.trim().toLowerCase();
    return mergedRows.filter((r) => COLUMNS.some((c) => String(r[c.key] || "").toLowerCase().includes(q)));
  }, [mergedRows, query]);

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

      {/* Keterangan cara edit */}
      <div className="editHint">
        <span>✏ Klik ikon pensil pada kolom <strong>Status QC2</strong> untuk update langsung ke spreadsheet</span>
      </div>

      {/* Tabel */}
      <div className="tableScroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              {COLUMNS.map((c) => (
                <th key={c.key}>
                  {c.label}
                  {c.key === "statusQc2" && <span className="editableHint"> ✏</span>}
                </th>
              ))}
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
                <tr key={r.workorderPsb || r.id}>
                  <td className="num">{i + 1}</td>
                  {COLUMNS.map((c) => {
                    // Kolom STATUS QC2 — pakai Qc2Cell dengan tombol edit
                    if (c.key === "statusQc2") {
                      return (
                        <Qc2Cell
                          key="statusQc2"
                          row={r}
                          compworkValues={compworkValues}
                          onSaved={handleSaved}
                        />
                      );
                    }
                    // Kolom STATUS BIMA — chip warna seperti sebelumnya
                    if (c.key === "statusBima") {
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
        .editHint {
          font-size: 11.5px; color: var(--text-faint);
          padding: 6px 10px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .editHint strong { color: var(--text-dim); }
        .tableScroll {
          overflow-x: auto; border: 1px solid var(--border);
          border-radius: var(--radius-md); max-height: 480px; overflow-y: auto;
        }
        table {
          border-collapse: collapse; width: 100%;
          font-size: 12.5px; min-width: 960px;
        }
        thead th {
          position: sticky; top: 0; z-index: 1;
          background: var(--surface-2); text-align: left;
          padding: 10px 12px; font-size: 10.5px;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--text-faint); font-weight: 700;
          border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        .editableHint { color: var(--accent); font-size: 10px; }
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
