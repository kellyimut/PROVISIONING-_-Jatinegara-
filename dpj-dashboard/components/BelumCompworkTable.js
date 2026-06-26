import { useMemo, useState, useCallback } from "react";
import { statusColor } from "../lib/statusColor";

// Kolom yang ditampilkan (dikurangi sesuai permintaan)
const COLUMNS = [
  { key: "tanggalSetting",   label: "Tgl Setting",     editable: "tgl" },
  { key: "tanggalOrderBima", label: "Tgl Order BIMA" },
  { key: "workorderPsb",     label: "Workorder PSB" },
  { key: "crmOrderType",     label: "Order Type" },
  { key: "statusBima",       label: "Status BIMA" },
  { key: "reguTeknisi",      label: "Regu/Teknisi",    editable: "text" },
  { key: "statusQc2",        label: "Status QC2",      editable: "text" },
];

// ── Generic inline text editor (untuk Regu/Teknisi & Status QC2) ────────────
function InlineTextCell({ row, fieldKey, apiField, compworkValues, onSaved, accentColor }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(row[fieldKey] && row[fieldKey] !== "-" ? row[fieldKey] : "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [saved, setSaved]     = useState(false);

  const color = fieldKey === "statusBima" || fieldKey === "statusQc2"
    ? statusColor(row[fieldKey], compworkValues) : null;

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true); setError("");
    try {
      const body = { workorderPsb: row.workorderPsb };
      body[apiField] = value.trim();
      const res = await fetch("/api/update-setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Gagal menyimpan.");
      setSaved(true); setEditing(false);
      if (onSaved) onSaved(row.workorderPsb, value.trim());
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }, [row.workorderPsb, value, saving, onSaved, apiField]);

  const handleCancel = () => {
    setValue(row[fieldKey] && row[fieldKey] !== "-" ? row[fieldKey] : "");
    setEditing(false); setError("");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <td className="editCell editing">
        <div className="editWrap">
          <input
            autoFocus value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Isi ${fieldKey}…`}
            disabled={saving} className="editInput"
          />
          <div className="editActions">
            <button type="button" onClick={handleSave} disabled={saving} className="btnSave" title="Simpan (Enter)">
              {saving ? "…" : "✓"}
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="btnCancel" title="Batal (Esc)">✕</button>
          </div>
        </div>
        {error && <div className="errMsg">{error}</div>}
        <style jsx>{`
          .editCell { min-width: 160px; }
          .editCell.editing { padding: 6px 8px !important; }
          .editWrap { display: flex; align-items: center; gap: 4px; }
          .editInput {
            flex: 1; background: var(--surface);
            border: 1px solid var(--accent); border-radius: 6px;
            color: var(--text); font-size: 12px; padding: 5px 8px;
            outline: none; font-family: var(--font-body); min-width: 0;
          }
          .editInput:disabled { opacity: 0.6; }
          .editActions { display: flex; gap: 3px; flex-shrink: 0; }
          .btnSave {
            background: var(--success, #34d399); color: #0a2e1f;
            border: none; border-radius: 5px; font-weight: 800;
            font-size: 12px; padding: 4px 8px; cursor: pointer; min-width: 28px;
          }
          .btnSave:disabled { opacity: 0.5; cursor: not-allowed; }
          .btnCancel {
            background: var(--surface-2); color: var(--text-dim);
            border: 1px solid var(--border); border-radius: 5px;
            font-size: 11px; padding: 4px 7px; cursor: pointer; min-width: 28px;
          }
          .btnCancel:hover { border-color: var(--danger); color: var(--danger); }
          .errMsg { font-size: 10.5px; color: var(--danger); margin-top: 4px; white-space: normal; }
        `}</style>
      </td>
    );
  }

  return (
    <td className="editCell">
      <div className="cellRow">
        {row[fieldKey] && row[fieldKey] !== "-" ? (
          color
            ? <span className="chip" style={{ color, borderColor: color }}>{row[fieldKey]}</span>
            : <span className="cellVal">{row[fieldKey]}</span>
        ) : (
          <span className="empty">—</span>
        )}
        {saved && <span className="savedBadge">✓</span>}
        <button type="button" className="editBtn"
          onClick={() => { setSaved(false); setValue(row[fieldKey] && row[fieldKey] !== "-" ? row[fieldKey] : ""); setEditing(true); }}
          title={`Edit ${fieldKey}`}>✏</button>
      </div>
      <style jsx>{`
        .editCell { min-width: 140px; }
        .cellRow { display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; }
        .cellVal { font-size: 12.5px; color: var(--text); }
        .chip {
          display: inline-block; padding: 2px 9px; border-radius: 999px;
          font-size: 11px; font-weight: 700; border: 1px solid;
          background: rgba(127,127,127,0.1); white-space: nowrap;
        }
        .empty { color: var(--text-faint); font-size: 12px; }
        .savedBadge { font-size: 10px; font-weight: 700; color: var(--success, #34d399); white-space: nowrap; }
        .editBtn {
          background: transparent; border: 1px solid transparent;
          color: var(--text-faint); font-size: 11px;
          border-radius: 5px; cursor: pointer; padding: 2px 5px;
          opacity: 0; transition: opacity 0.15s, border-color 0.15s, color 0.15s; flex-shrink: 0;
        }
        .cellRow:hover .editBtn { opacity: 1; border-color: var(--border); color: var(--accent); }
        .editBtn:hover { background: var(--accent-soft); border-color: var(--accent) !important; }
      `}</style>
    </td>
  );
}

// ── Inline editor untuk TANGGAL SETTING (type=date) ─────────────────────────
function TglSettingCell({ row, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [saved, setSaved]     = useState(false);

  const formatForSheet = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };

  const toInputDate = (displayStr) => {
    if (!displayStr || displayStr === "-") return "";
    const bulan = { Jan:0,Feb:1,Mar:2,Apr:3,Mei:4,Jun:5,Jul:6,Agu:7,Sep:8,Okt:9,Nov:10,Des:11 };
    const m1 = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(displayStr);
    if (m1) {
      const d = parseInt(m1[1]), mo = bulan[m1[2]] ?? 0, y = parseInt(m1[3]);
      return `${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    }
    const m2 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(displayStr);
    if (m2) return `${m2[3]}-${m2[2].padStart(2,"0")}-${m2[1].padStart(2,"0")}`;
    return "";
  };

  const handleEdit = () => { setValue(toInputDate(row.tanggalSetting)); setSaved(false); setEditing(true); };

  const handleSave = useCallback(async () => {
    if (saving || !value) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/update-setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workorderPsb: row.workorderPsb, tanggalSetting: formatForSheet(value) }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Gagal menyimpan.");
      setSaved(true); setEditing(false);
      const d = new Date(value);
      const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
      if (onSaved) onSaved(row.workorderPsb, `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }, [row.workorderPsb, value, saving, onSaved]);

  const handleCancel = () => { setEditing(false); setError(""); };
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); };

  if (editing) {
    return (
      <td className="tglCell editing">
        <div className="editWrap">
          <input type="date" autoFocus value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown} disabled={saving} className="tglInput" />
          <div className="editActions">
            <button type="button" onClick={handleSave} disabled={saving} className="btnSave" title="Simpan">
              {saving ? "…" : "✓"}
            </button>
            <button type="button" onClick={handleCancel} disabled={saving} className="btnCancel" title="Batal">✕</button>
          </div>
        </div>
        {error && <div className="errMsg">{error}</div>}
        <style jsx>{`
          .tglCell { min-width: 190px; }
          .tglCell.editing { padding: 6px 8px !important; }
          .editWrap { display: flex; align-items: center; gap: 4px; }
          .tglInput {
            flex: 1; background: var(--surface);
            border: 1px solid var(--accent); border-radius: 6px;
            color: var(--text); font-size: 12px; padding: 5px 8px;
            outline: none; font-family: var(--font-body); min-width: 0;
          }
          .tglInput:disabled { opacity: 0.6; }
          .editActions { display: flex; gap: 3px; flex-shrink: 0; }
          .btnSave {
            background: var(--success, #34d399); color: #0a2e1f;
            border: none; border-radius: 5px; font-weight: 800;
            font-size: 12px; padding: 4px 8px; cursor: pointer; min-width: 28px;
          }
          .btnSave:disabled { opacity: 0.5; cursor: not-allowed; }
          .btnCancel {
            background: var(--surface-2); color: var(--text-dim);
            border: 1px solid var(--border); border-radius: 5px;
            font-size: 11px; padding: 4px 7px; cursor: pointer; min-width: 28px;
          }
          .btnCancel:hover { border-color: var(--danger); color: var(--danger); }
          .errMsg { font-size: 10.5px; color: var(--danger); margin-top: 4px; white-space: normal; }
        `}</style>
      </td>
    );
  }

  return (
    <td className="tglCell">
      <div className="tglRow">
        <span className="tglVal">{row.tanggalSetting || "—"}</span>
        {saved && <span className="savedBadge">✓</span>}
        <button type="button" className="editBtn" onClick={handleEdit} title="Update Tgl Setting">✏</button>
      </div>
      <style jsx>{`
        .tglCell { min-width: 150px; }
        .tglRow { display: flex; align-items: center; gap: 6px; }
        .tglVal { font-size: 12.5px; color: var(--text); }
        .savedBadge { font-size: 10px; font-weight: 700; color: var(--success, #34d399); white-space: nowrap; }
        .editBtn {
          background: transparent; border: 1px solid transparent;
          color: var(--text-faint); font-size: 11px;
          border-radius: 5px; cursor: pointer; padding: 2px 5px;
          opacity: 0; transition: opacity 0.15s, border-color 0.15s, color 0.15s; flex-shrink: 0;
        }
        .tglRow:hover .editBtn { opacity: 1; border-color: var(--border); color: var(--warning, #f59e0b); }
        .editBtn:hover { background: rgba(245,158,11,0.1); border-color: var(--warning, #f59e0b) !important; }
      `}</style>
    </td>
  );
}

// ── Komponen utama ───────────────────────────────────────────────────────────
export default function BelumCompworkTable({ rows, compworkValues }) {
  const [query, setQuery] = useState("");
  const [localUpdates, setLocalUpdates] = useState({});

  const handleSaved = useCallback((workorderPsb, field, newValue) => {
    setLocalUpdates((prev) => ({
      ...prev,
      [workorderPsb]: { ...(prev[workorderPsb] || {}), [field]: newValue },
    }));
  }, []);

  const handleTglSaved   = useCallback((wo, val) => handleSaved(wo, "tanggalSetting", val), [handleSaved]);
  const handleReguSaved  = useCallback((wo, val) => handleSaved(wo, "reguTeknisi", val), [handleSaved]);
  const handleQc2Saved   = useCallback((wo, val) => handleSaved(wo, "statusQc2", val), [handleSaved]);

  // Bulan berjalan
  const currentMonthKey = useMemo(() => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const toMonthKey = (displayStr) => {
    if (!displayStr || displayStr === "-") return null;
    const BULAN = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",Mei:"05",Jun:"06",Jul:"07",Agu:"08",Sep:"09",Okt:"10",Nov:"11",Des:"12" };
    const m1 = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(displayStr);
    if (m1) return `${m1[3]}-${BULAN[m1[2]] || "00"}`;
    const m2 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(displayStr);
    if (m2) return `${m2[3]}-${m2[2].padStart(2,"0")}`;
    return null;
  };

  // Filter: bukan COMPWORK + bulan berjalan
  const belumCompwork = useMemo(() =>
    rows.filter((r) => {
      const bukanCompwork = !compworkValues.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase());
      return bukanCompwork && toMonthKey(r.tanggalSetting) === currentMonthKey;
    }),
    [rows, compworkValues, currentMonthKey]
  );

  // Gabungkan dengan update lokal
  const mergedRows = useMemo(() =>
    belumCompwork.map((r) =>
      localUpdates[r.workorderPsb]
        ? { ...r, ...localUpdates[r.workorderPsb] }
        : r
    ),
    [belumCompwork, localUpdates]
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
    a.href = url; a.download = `belum-compwork-${Date.now()}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // Ringkasan per status BIMA
  const byStatus = useMemo(() => {
    const map = new Map();
    belumCompwork.forEach((r) => {
      const st = (r.statusBima || "—").trim();
      map.set(st, (map.get(st) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [belumCompwork]);

  return (
    <div className="wrap">
      {/* Ringkasan per status */}
      {byStatus.length > 0 && (
        <div className="summary">
          {byStatus.map(([st, count]) => {
            const color = statusColor(st, compworkValues);
            return (
              <div key={st} className="statusChip">
                <span className="chip" style={{ color, borderColor: color }}>{st}</span>
                <span className="cnt">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input placeholder="Cari workorder, teknisi…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="meta">
          <span>{filtered.length} dari {belumCompwork.length} order belum COMPWORK</span>
          <button type="button" onClick={handleExport} className="exportBtn">⬇ Ekspor CSV</button>
        </div>
      </div>

      {/* Hint */}
      <div className="editHint">
        <span>✏ Kolom <strong>Tgl Setting</strong>, <strong>Regu/Teknisi</strong>, dan <strong>Status QC2</strong> bisa diedit langsung — hover baris lalu klik ikon pensil</span>
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
                  {c.editable && <span className="editableHint"> ✏</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="emptyCell">
                  {belumCompwork.length === 0 ? "🎉 Semua order bulan ini sudah COMPWORK!" : "Tidak ada data yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r.workorderPsb || r.id}>
                  <td className="num">{i + 1}</td>
                  {COLUMNS.map((c) => {
                    if (c.key === "tanggalSetting") {
                      return <TglSettingCell key="tanggalSetting" row={r} onSaved={handleTglSaved} />;
                    }
                    if (c.key === "reguTeknisi") {
                      return <InlineTextCell key="reguTeknisi" row={r} fieldKey="reguTeknisi" apiField="reguTeknisi" compworkValues={compworkValues} onSaved={handleReguSaved} />;
                    }
                    if (c.key === "statusQc2") {
                      return <InlineTextCell key="statusQc2" row={r} fieldKey="statusQc2" apiField="statusQc2" compworkValues={compworkValues} onSaved={handleQc2Saved} />;
                    }
                    if (c.key === "statusBima") {
                      const color = statusColor(r[c.key], compworkValues);
                      return (
                        <td key={c.key}>
                          {r[c.key] && r[c.key] !== "-"
                            ? <span className="chip" style={{ color, borderColor: color }}>{r[c.key]}</span>
                            : <span className="dim">—</span>}
                        </td>
                      );
                    }
                    const mono = c.key === "workorderPsb";
                    return <td key={c.key} className={mono ? "mono" : ""}>{r[c.key] || "—"}</td>;
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
          padding: 10px 14px; background: var(--surface-2);
          border: 1px solid var(--border); border-radius: 10px;
        }
        .statusChip { display: flex; align-items: center; gap: 6px; }
        .cnt { font-size: 11px; font-weight: 700; color: var(--text-dim); font-family: var(--font-mono); }
        .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .search {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 10px; padding: 8px 12px;
          color: var(--text-faint); flex: 1; min-width: 200px; max-width: 360px;
        }
        .search input {
          border: none; background: transparent; color: var(--text);
          font-size: 13px; outline: none; width: 100%; font-family: var(--font-body);
        }
        .meta { display: flex; align-items: center; gap: 12px; font-size: 12.5px; color: var(--text-dim); }
        .exportBtn {
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text); font-weight: 600; font-size: 12.5px;
          padding: 7px 12px; border-radius: 8px; cursor: pointer;
        }
        .exportBtn:hover { border-color: var(--accent); color: var(--accent); }
        .editHint {
          font-size: 11.5px; color: var(--text-faint);
          padding: 6px 10px; background: var(--surface-2);
          border: 1px solid var(--border); border-radius: 8px;
        }
        .editHint strong { color: var(--text-dim); }
        .tableScroll {
          overflow-x: auto; border: 1px solid var(--border);
          border-radius: var(--radius-md); max-height: 480px; overflow-y: auto;
        }
        table { border-collapse: collapse; width: 100%; font-size: 12.5px; min-width: 800px; }
        thead th {
          position: sticky; top: 0; z-index: 1;
          background: var(--surface-2); text-align: left;
          padding: 10px 12px; font-size: 10.5px;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--text-faint); font-weight: 700;
          border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        .editableHint { color: var(--accent); font-size: 10px; }
        tbody td { padding: 9px 12px; border-bottom: 1px solid var(--border); color: var(--text); white-space: nowrap; }
        tbody tr:nth-child(even) { background: rgba(127,127,127,0.035); }
        tbody tr:hover { background: var(--accent-soft); }
        .num { color: var(--text-faint); font-size: 11px; width: 36px; text-align: right; }
        .mono { font-family: var(--font-mono); font-size: 11.5px; }
        .chip {
          display: inline-block; padding: 2px 9px; border-radius: 999px;
          font-size: 11px; font-weight: 700; border: 1px solid;
          background: rgba(127,127,127,0.1); white-space: nowrap;
        }
        .dim { color: var(--text-faint); }
        .emptyCell { text-align: center; color: var(--text-faint); padding: 28px 0 !important; white-space: normal; }
      `}</style>
    </div>
  );
}
