import { useCallback, useEffect, useMemo, useState } from "react";
import KpiCard from "./KpiCard";
import SectionCard from "./SectionCard";

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS || 30000);
const PAGE_SIZE = 20;

const STATUS_COLORS = {
  COMPLETE: "#34d399",
};
function colorForStatus(status) {
  const key = String(status || "").trim().toUpperCase();
  return STATUS_COLORS[key] || "#f87171";
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter((v) => v && v !== "-"))).sort((a, b) => a.localeCompare(b));
}

export default function IndibizDashboard() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const [filterTahun, setFilterTahun] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterTeknisi, setFilterTeknisi] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/indibiz-data");
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Gagal memuat data INDIBIZ.");
      setRecords(json.records);
      setStatus("ok");
      setErrorMsg("");
      setLastUpdated(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }).format(new Date()) + " WIB"
      );
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    setFilterTanggal("");
  }, [filterTahun, filterBulan]);

  // Tanggal hari ini (Asia/Jakarta), dipakai untuk tabel "ORDER HARI INI" — live,
  // tidak terpengaruh filter Tahun/Bulan/Tanggal di atas.
  const todayISO = useMemo(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date()),
    []
  );
  const todayLabelStr = useMemo(
    () => new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta", day: "2-digit", month: "long", year: "numeric",
    }).format(new Date()),
    []
  );
  const todayRecords = useMemo(
    () => records.filter((r) => r.tglISO === todayISO),
    [records, todayISO]
  );

  const tahunOptions = useMemo(() => {
    const years = records
      .map((r) => (r.tglISO ? r.tglISO.slice(0, 4) : null))
      .filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a)); // terbaru dulu
  }, [records]);
  const bulanOptions = useMemo(() => uniqueSorted(records.map((r) => r.bulan)), [records]);
  const tanggalOptions = useMemo(() => {
    // Opsi tanggal mengikuti Tahun & Bulan yang sedang dipilih (cascading)
    const scoped = records.filter((r) => {
      if (filterTahun && (!r.tglISO || r.tglISO.slice(0, 4) !== filterTahun)) return false;
      if (filterBulan && r.bulan !== filterBulan) return false;
      return true;
    });
    const map = new Map();
    scoped.forEach((r) => {
      if (r.tglISO) map.set(r.tglISO, r.tgl);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([iso, display]) => ({ iso, display }));
  }, [records, filterTahun, filterBulan]);
  const teknisiOptions = useMemo(() => uniqueSorted(records.map((r) => r.teknisi)), [records]);
  const statusOptions = useMemo(() => uniqueSorted(records.map((r) => r.status)), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterTahun && (!r.tglISO || r.tglISO.slice(0, 4) !== filterTahun)) return false;
      if (filterBulan && r.bulan !== filterBulan) return false;
      if (filterTanggal && r.tglISO !== filterTanggal) return false;
      if (filterTeknisi && r.teknisi !== filterTeknisi) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [records, filterTahun, filterBulan, filterTanggal, filterTeknisi, filterStatus]);

  const total = filtered.length;
  const completeCount = useMemo(
    () => filtered.filter((r) => String(r.status || "").trim().toUpperCase() === "COMPLETE").length,
    [filtered]
  );
  const belumCompleteCount = total - completeCount;
  const percent = total > 0 ? Math.round((completeCount / total) * 1000) / 10 : 0;

  const statusBreakdown = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.status && r.status !== "-" ? r.status : "Tanpa Status";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);
  const maxBreakdownCount = statusBreakdown.length > 0 ? Math.max(...statusBreakdown.map((s) => s.count)) : 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filtered, pageSafe]
  );

  const resetFilters = () => {
    setFilterTahun(""); setFilterBulan(""); setFilterTanggal(""); setFilterTeknisi(""); setFilterStatus(""); setPage(1);
  };

  return (
    <div className="indibizWrap">
      {status === "error" ? (
        <div className="errorBanner">
          <strong>Gagal mengambil data INDIBIZ dari spreadsheet.</strong>
          <span>{errorMsg}</span>
          <button onClick={load} type="button">Coba lagi</button>
        </div>
      ) : null}



      {/* ---------------- FILTER ---------------- */}
      <SectionCard eyebrow="Filter" title="Filter Data INDIBIZ">
        <div className="filterRow">
          <select value={filterTahun} onChange={(e) => { setFilterTahun(e.target.value); setPage(1); }}>
            <option value="">Semua Tahun</option>
            {tahunOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterBulan} onChange={(e) => { setFilterBulan(e.target.value); setPage(1); }}>
            <option value="">Semua Bulan</option>
            {bulanOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterTanggal} onChange={(e) => { setFilterTanggal(e.target.value); setPage(1); }}>
            <option value="">Semua Tanggal</option>
            {tanggalOptions.map((t) => <option key={t.iso} value={t.iso}>{t.display}</option>)}
          </select>
          <select value={filterTeknisi} onChange={(e) => { setFilterTeknisi(e.target.value); setPage(1); }}>
            <option value="">Semua Teknisi</option>
            {teknisiOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filterTahun || filterBulan || filterTanggal || filterTeknisi || filterStatus) && (
            <button type="button" className="resetBtn" onClick={resetFilters}>✕ Reset filter</button>
          )}
        </div>
      </SectionCard>

      {/* ---------------- KPI ROW ---------------- */}
      <div className="kpiGrid">
        <KpiCard
          label="Total Order INDIBIZ"
          value={total}
          sub="Sesuai filter yang aktif"
          badge="INDIBIZ"
        />
        <KpiCard
          label="COMPLETE"
          value={completeCount}
          sub="Order dengan status COMPLETE"
        />
        <KpiCard
          label="Belum Complete"
          value={belumCompleteCount}
          sub="Order dengan status selain COMPLETE"
        />
        <KpiCard
          label="Persentase Completion"
          kind="percent"
          percent={percent}
          achieved={percent >= 70}
          sub={`${completeCount} dari ${total} order COMPLETE`}
        />
      </div>

      {/* ---------------- ORDER HARI INI (LIVE) ---------------- */}
      <SectionCard
        eyebrow="Live"
        title={`Order Hari Ini · ${todayLabelStr} (${todayRecords.length} order)`}
      >
        <div className="tableScroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>TGL</th>
                <th>PAKET</th>
                <th>NO ORDER</th>
                <th>NO INTERNET/NO TELP</th>
                <th>STATUS</th>
                <th>UPDATE</th>
                <th>DETAIL KETERANGAN</th>
                <th>TEKNISI</th>
              </tr>
            </thead>
            <tbody>
              {todayRecords.length === 0 ? (
                <tr><td colSpan={9} className="emptyCell">Belum ada order INDIBIZ hari ini.</td></tr>
              ) : (
                todayRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="num">{i + 1}</td>
                    <td>{r.tgl}</td>
                    <td>{r.paket}</td>
                    <td className="mono">{r.noOrder}</td>
                    <td className="mono">{r.noInternetTelp}</td>
                    <td>
                      <span className="chip" style={{ color: colorForStatus(r.status), borderColor: colorForStatus(r.status) }}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.update}</td>
                    <td className="wrapCell">{r.detailKeterangan}</td>
                    <td>{r.teknisi}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ---------------- CHART BREAKDOWN STATUS ---------------- */}
      <SectionCard eyebrow="Grafik" title="Breakdown per Status">
        {statusBreakdown.length === 0 ? (
          <div className="emptyChart">Belum ada data untuk ditampilkan.</div>
        ) : (
          <div className="chartWrap">
            {statusBreakdown.map((s) => (
              <div key={s.label} className="chartRow">
                <span className="chartLabel">{s.label}</span>
                <div className="chartBarTrack">
                  <div
                    className="chartBarFill"
                    style={{
                      width: maxBreakdownCount > 0 ? `${(s.count / maxBreakdownCount) * 100}%` : "0%",
                      background: colorForStatus(s.label),
                    }}
                  />
                </div>
                <span className="chartCount">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ---------------- TABEL (READ-ONLY) ---------------- */}
      <SectionCard eyebrow="Data" title={`Tabel Order INDIBIZ (${filtered.length} order)`}>
        <div className="tableScroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>TGL</th>
                <th>PAKET</th>
                <th>NO ORDER</th>
                <th>NO INTERNET/NO TELP</th>
                <th>STATUS</th>
                <th>UPDATE</th>
                <th>DETAIL KETERANGAN</th>
                <th>BULAN</th>
                <th>TEKNISI</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={10} className="emptyCell">Tidak ada data yang cocok.</td></tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="num">{(pageSafe - 1) * PAGE_SIZE + i + 1}</td>
                    <td>{r.tgl}</td>
                    <td>{r.paket}</td>
                    <td className="mono">{r.noOrder}</td>
                    <td className="mono">{r.noInternetTelp}</td>
                    <td>
                      <span className="chip" style={{ color: colorForStatus(r.status), borderColor: colorForStatus(r.status) }}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.update}</td>
                    <td className="wrapCell">{r.detailKeterangan}</td>
                    <td>{r.bulan}</td>
                    <td>{r.teknisi}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button type="button" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>‹ Sebelumnya</button>
            <span>Halaman {pageSafe} dari {totalPages}</span>
            <button type="button" disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)}>Berikutnya ›</button>
          </div>
        )}
      </SectionCard>

      <style jsx>{`
        .indibizWrap { display: flex; flex-direction: column; gap: 22px; }
        .updatedRow { font-size: 11.5px; color: var(--text-faint); font-family: var(--font-mono); }
        .errorBanner {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          background: rgba(248,113,113,0.1); border: 1px solid var(--danger);
          color: var(--text); padding: 12px 16px; border-radius: var(--radius-md);
          font-size: 13px;
        }
        .errorBanner span { color: var(--text-dim); }
        .errorBanner button {
          margin-left: auto; background: var(--danger); color: #1a0508;
          border: none; font-weight: 700; padding: 6px 14px;
          border-radius: 8px; cursor: pointer;
        }
        .kpiGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 14px; }
        @media (max-width:600px) { .kpiGrid { grid-template-columns: repeat(2,1fr); } }

        .progressWrap { display: flex; flex-direction: column; gap: 8px; }
        .progressTrack {
          width: 100%; height: 16px; border-radius: 999px;
          background: var(--surface-2); border: 1px solid var(--border); overflow: hidden;
        }
        .progressFill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #34d399, #10b981);
          transition: width 0.4s ease;
        }
        .progressLabels { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); }

        .filterRow { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .filterRow select {
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text); font-size: 12.5px; padding: 8px 12px;
          border-radius: 8px; font-family: var(--font-body); cursor: pointer;
        }
        .resetBtn {
          background: transparent; border: 1px solid var(--border);
          color: var(--text-dim); font-size: 12px; padding: 8px 12px;
          border-radius: 8px; cursor: pointer;
        }
        .resetBtn:hover { border-color: var(--danger); color: var(--danger); }

        .emptyChart { color: var(--text-faint); font-size: 12.5px; padding: 10px 0; }
        .chartWrap { display: flex; flex-direction: column; gap: 10px; }
        .chartRow { display: grid; grid-template-columns: 140px 1fr 40px; align-items: center; gap: 10px; }
        .chartLabel { font-size: 12px; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chartBarTrack { height: 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
        .chartBarFill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
        .chartCount { font-size: 12px; color: var(--text); font-family: var(--font-mono); text-align: right; }

        .tableScroll {
          overflow-x: auto; border: 1px solid var(--border);
          border-radius: var(--radius-md); max-height: 480px; overflow-y: auto;
        }
        table { border-collapse: collapse; width: 100%; font-size: 12.5px; min-width: 960px; }
        thead th {
          position: sticky; top: 0; z-index: 1;
          background: var(--surface-2); text-align: left;
          padding: 10px 12px; font-size: 10.5px;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--text-faint); font-weight: 700;
          border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        tbody td { padding: 9px 12px; border-bottom: 1px solid var(--border); color: var(--text); white-space: nowrap; }
        tbody tr:nth-child(even) { background: rgba(127,127,127,0.035); }
        tbody tr:hover { background: var(--accent-soft); }
        .num { color: var(--text-faint); font-size: 11px; width: 36px; text-align: right; }
        .mono { font-family: var(--font-mono); font-size: 11.5px; }
        .wrapCell { white-space: normal; max-width: 240px; }
        .chip {
          display: inline-block; padding: 2px 9px; border-radius: 999px;
          font-size: 11px; font-weight: 700; border: 1px solid;
          background: rgba(127,127,127,0.1); white-space: nowrap;
        }
        .emptyCell { text-align: center; color: var(--text-faint); padding: 28px 0 !important; white-space: normal; }

        .pagination {
          display: flex; align-items: center; justify-content: center; gap: 14px;
          margin-top: 12px; font-size: 12.5px; color: var(--text-dim);
        }
        .pagination button {
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text); font-size: 12px; padding: 6px 12px;
          border-radius: 8px; cursor: pointer;
        }
        .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
        .pagination button:not(:disabled):hover { border-color: var(--accent); color: var(--accent); }
      `}</style>
    </div>
  );
}
