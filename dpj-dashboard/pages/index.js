import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import KpiCard from "../components/KpiCard";
import SectionCard from "../components/SectionCard";
import Tabs from "../components/Tabs";
import MonthPicker from "../components/MonthPicker";
import StatusBreakdown from "../components/StatusBreakdown";
import TechnicianProductivity from "../components/TechnicianProductivity";
import OrdersTable from "../components/OrdersTable";
import DrillDownModal from "../components/DrillDownModal";
import SettingTodayTable from "../components/SettingTodayTable";
import TeknisiHadirCard from "../components/TeknisiHadirCard";

import {
  getJakartaToday,
  getJakartaMonthKey,
  todayLabel,
  monthKeyLabel,
  listAvailableMonths,
  listAvailableSettingMonths,
  filterByDate,
  filterBySettingDate,
  filterBySettingMonth,
  filterByMonth,
  statusBreakdown,
  kpiRePs,
  technicianStats,
} from "../lib/aggregate";
import { COMPWORK_VALUES } from "../config/columns";

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS || 30000);

export default function Home() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // Mode tab: summary & teknisi & tabel pakai Tanggal Setting
  const [summaryMode, setSummaryMode] = useState("harian");
  const [teknisiMode, setTeknisiMode] = useState("harian");
  const [tableMode, setTableMode] = useState("harian");

  const today = getJakartaToday();
  const currentMonthKey = getJakartaMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  // Modal drill-down
  const [modal, setModal] = useState(null);
  const openModal = (title, rows) => setModal({ title, rows });
  const closeModal = () => setModal(null);

  // Teknisi hadir dari sheet "TEKNISI HARI INI"
  const [teknisiHadir, setTeknisiHadir] = useState({ names: [], total: 0, loading: true, error: null });

  const load = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/sheet-data");
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Gagal memuat data.");
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

  const loadTeknisi = useCallback(async () => {
    try {
      const res = await fetch("/api/teknisi-hadir");
      const json = await res.json();
      setTeknisiHadir({ names: json.names || [], total: json.total || 0, loading: false, error: json.error || null });
    } catch (err) {
      setTeknisiHadir({ names: [], total: 0, loading: false, error: err.message });
    }
  }, []);

  useEffect(() => {
    load();
    loadTeknisi();
    const id = setInterval(load, REFRESH_MS);
    const id2 = setInterval(loadTeknisi, REFRESH_MS);
    return () => { clearInterval(id); clearInterval(id2); };
  }, [load, loadTeknisi]);

  // --- Bulan tersedia ---
  const settingMonths = useMemo(() => listAvailableSettingMonths(records), [records]);
  const orderMonths   = useMemo(() => listAvailableMonths(records), [records]);
  const monthLabel    = monthKeyLabel(selectedMonth);

  // ============================================================
  // CARD KIRI: Order hari ini dari TANGGAL ORDER BIMA
  // ============================================================
  const orderBimaToday = useMemo(() => filterByDate(records, today), [records, today]);
  const kpiOrderBima   = useMemo(() => kpiRePs(orderBimaToday), [orderBimaToday]);

  // ============================================================
  // SEMUA CARD & SECTION LAIN: dari TANGGAL SETTING
  // ============================================================

  // Setting hari ini
  const settingToday   = useMemo(() => filterBySettingDate(records, today), [records, today]);
  const kpiSettingToday = useMemo(() => kpiRePs(settingToday), [settingToday]);

  // Setting bulan terpilih
  const settingMonth   = useMemo(() => filterBySettingMonth(records, selectedMonth), [records, selectedMonth]);
  const kpiSettingMonth = useMemo(() => kpiRePs(settingMonth), [settingMonth]);

  // COMPWORK untuk drill-down RE/PS
  const compworkSettingToday = useMemo(() =>
    settingToday.filter((r) => COMPWORK_VALUES.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())),
    [settingToday]);
  const compworkSettingMonth = useMemo(() =>
    settingMonth.filter((r) => COMPWORK_VALUES.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())),
    [settingMonth]);

  // Summary section (Ringkasan Status BIMA) — pakai Setting
  const summaryRecords   = summaryMode === "harian" ? settingToday : settingMonth;
  const summaryBreakdown = useMemo(() => statusBreakdown(summaryRecords), [summaryRecords]);

  // Produktivitas — pakai Setting
  const teknisiRecords = teknisiMode === "harian" ? settingToday : settingMonth;
  const teknisiData    = useMemo(() => technicianStats(teknisiRecords), [teknisiRecords]);

  // Tabel detail — pakai Setting
  const tableRecords = tableMode === "harian" ? settingToday : settingMonth;

  // Teknisi teraktif hari ini — dari Setting
  const topTeknisiToday = useMemo(() => technicianStats(settingToday)[0], [settingToday]);

  return (
    <>
      <Head><title>DASHBOARD PROVISIONING - Jatinegara</title></Head>

      <div className="page">
        <Header status={status} lastUpdated={lastUpdated} onRefresh={load} isFetching={isFetching} />

        {status === "error" ? (
          <div className="errorBanner">
            <strong>Gagal mengambil data dari spreadsheet.</strong>
            <span>{errorMsg}</span>
            <button onClick={load} type="button">Coba lagi</button>
          </div>
        ) : null}

        {/* ---------------- KPI ROW (7 card) ---------------- */}
        <div className="kpiGrid">

          {/* CARD 1 — KIRI: Order hari ini dari Tanggal Order BIMA */}
          <KpiCard
            label={`Order Masuk · ${todayLabel(today)}`}
            value={kpiOrderBima.total}
            sub="Order masuk hari ini (Tgl Order BIMA)"
            badge="BIMA"
            onClick={() => openModal(
              `Order Masuk Hari Ini · ${todayLabel(today)} — dari Tanggal Order BIMA (${kpiOrderBima.total} order)`,
              orderBimaToday
            )}
          />

          {/* CARD 2: Total Setting hari ini */}
          <KpiCard
            label={`Total Setting · ${todayLabel(today)}`}
            value={kpiSettingToday.total}
            sub="Total order dijadwalkan setting hari ini"
            badge="SETTING"
            onClick={() => openModal(
              `Total Order Setting Hari Ini · ${todayLabel(today)} (${kpiSettingToday.total} order)`,
              settingToday
            )}
          />

          {/* CARD 3: RE/PS hari ini — dari Setting */}
          <KpiCard
            label="RE/PS Hari Ini"
            kind="percent"
            percent={kpiSettingToday.percent}
            achieved={kpiSettingToday.achieved}
            sub={`${kpiSettingToday.compwork} dari ${kpiSettingToday.total} COMPWORK · target ${kpiSettingToday.target}%`}
            onClick={() => openModal(
              `COMPWORK Setting Hari Ini · ${todayLabel(today)} (${kpiSettingToday.compwork} order)`,
              compworkSettingToday
            )}
          />

          {/* CARD 4: Setting bulan terpilih */}
          <KpiCard
            label={`Setting Bulan ${monthLabel}`}
            value={kpiSettingMonth.total}
            sub="Total order setting bulan terpilih"
            onClick={() => openModal(
              `Order Setting Bulan ${monthLabel} (${kpiSettingMonth.total} order)`,
              settingMonth
            )}
          />

          {/* CARD 5: RE/PS bulanan — dari Setting */}
          <KpiCard
            label={`RE/PS Bulan ${monthLabel}`}
            kind="percent"
            percent={kpiSettingMonth.percent}
            achieved={kpiSettingMonth.achieved}
            sub={`${kpiSettingMonth.compwork} dari ${kpiSettingMonth.total} COMPWORK · target ${kpiSettingMonth.target}%`}
            onClick={() => openModal(
              `COMPWORK Setting Bulan ${monthLabel} (${kpiSettingMonth.compwork} order)`,
              compworkSettingMonth
            )}
          />

          {/* CARD 6: Teknisi teraktif — dari Setting */}
          <KpiCard
            label="Teknisi Teraktif Hari Ini"
            value={topTeknisiToday ? topTeknisiToday.total : 0}
            suffix=" order"
            sub={topTeknisiToday ? topTeknisiToday.teknisi : "Belum ada setting hari ini"}
            onClick={topTeknisiToday ? () => openModal(
              `Order Setting ${topTeknisiToday.teknisi} Hari Ini (${topTeknisiToday.total} order)`,
              settingToday.filter((r) => (r.reguTeknisi || "Belum Ditugaskan").trim() === topTeknisiToday.teknisi)
            ) : undefined}
          />

          {/* CARD 7: Teknisi Hadir Hari Ini — dari sheet TEKNISI HARI INI */}
          <TeknisiHadirCard
            total={teknisiHadir.total}
            names={teknisiHadir.names}
            loading={teknisiHadir.loading}
            error={teknisiHadir.error}
          />

          {/* CARD 8: Produktivitas rata-rata = COMPWORK ÷ Teknisi Hadir */}
          <KpiCard
            label="Produktivitas / Teknisi"
            value={
              teknisiHadir.total > 0
                ? (kpiSettingToday.compwork / teknisiHadir.total).toFixed(1)
                : "-"
            }
            suffix={teknisiHadir.total > 0 ? " order" : ""}
            sub={
              teknisiHadir.total > 0
                ? `${kpiSettingToday.compwork} COMPWORK ÷ ${teknisiHadir.total} teknisi hadir`
                : "Data teknisi hadir belum tersedia"
            }
            badge="PRODUKTIF"
            onClick={kpiSettingToday.compwork > 0 ? () => openModal(
              `COMPWORK Setting Hari Ini · ${todayLabel(today)} (${kpiSettingToday.compwork} order)`,
              compworkSettingToday
            ) : undefined}
          />
        </div>

        {/* ---------------- RINGKASAN STATUS BIMA — dari Setting ---------------- */}
        <SectionCard
          eyebrow="Ringkasan Setting"
          title="Status BIMA — Order Setting"
          right={
            <>
              <Tabs value={summaryMode} onChange={setSummaryMode}
                options={[{ value: "harian", label: "Hari Ini" }, { value: "bulanan", label: "Bulanan" }]}
              />
              {summaryMode === "bulanan"
                ? <MonthPicker months={settingMonths} value={selectedMonth} onChange={setSelectedMonth} />
                : null}
            </>
          }
        >
          <StatusBreakdown
            total={summaryRecords.length}
            breakdown={summaryBreakdown}
            compworkValues={COMPWORK_VALUES}
            totalLabel={summaryMode === "harian" ? `Setting ${todayLabel(today)}` : `Setting ${monthLabel}`}
            onClickTotal={() => openModal(
              summaryMode === "harian"
                ? `Semua Order Setting Hari Ini · ${todayLabel(today)}`
                : `Semua Order Setting ${monthLabel}`,
              summaryRecords
            )}
            onClickStatus={(st, rows) => openModal(
              `Status ${st} · ${summaryMode === "harian" ? todayLabel(today) : monthLabel} (${rows.length} order)`,
              rows
            )}
          />
        </SectionCard>

        {/* ---------------- PRODUKTIVITAS TEKNISI — dari Setting ---------------- */}
        <SectionCard
          eyebrow="Produktivitas"
          title="Produktivitas Regu / Teknisi"
          right={
            <>
              <Tabs value={teknisiMode} onChange={setTeknisiMode}
                options={[{ value: "harian", label: "Live Hari Ini" }, { value: "bulanan", label: "Rekap Bulanan" }]}
              />
              {teknisiMode === "bulanan"
                ? <MonthPicker months={settingMonths} value={selectedMonth} onChange={setSelectedMonth} />
                : null}
            </>
          }
        >
          <TechnicianProductivity
            data={teknisiData}
            emptyLabel={teknisiMode === "harian"
              ? "Belum ada order setting hari ini."
              : "Belum ada data setting pada bulan ini."}
            sourceRecords={teknisiRecords}
            onClickTeknisi={(name, rows) => openModal(
              `Detail Setting ${name} · ${teknisiMode === "harian" ? "Hari Ini" : monthLabel} (${rows.length} order)`,
              rows
            )}
          />
        </SectionCard>

        {/* ---------------- TABEL SETTING HARI INI ---------------- */}
        <SectionCard
          eyebrow="Jadwal Setting"
          title={`Order Setting Hari Ini · ${todayLabel(today)} (${settingToday.length} order)`}
        >
          <SettingTodayTable rows={settingToday} compworkValues={COMPWORK_VALUES} />
        </SectionCard>

        {/* ---------------- TABEL DETAIL — dari Setting ---------------- */}
        <SectionCard
          eyebrow="Detail Order"
          title="Tabel Order Provisioning (berdasarkan Tanggal Setting)"
          right={
            <>
              <Tabs value={tableMode} onChange={setTableMode}
                options={[{ value: "harian", label: "Harian" }, { value: "bulanan", label: "Bulanan" }]}
              />
              {tableMode === "bulanan"
                ? <MonthPicker months={settingMonths} value={selectedMonth} onChange={setSelectedMonth} />
                : null}
            </>
          }
        >
          <OrdersTable rows={tableRecords} compworkValues={COMPWORK_VALUES} />
        </SectionCard>

        <footer className="footer">
          <div className="fiber-line" style={{ marginBottom: 14 }} />
          <span>DASHBOARD PROVISIONING — JATINEGARA · Data Google Spreadsheet · Auto-refresh {Math.round(REFRESH_MS / 1000)} detik</span>
        </footer>
      </div>

      {modal ? (
        <DrillDownModal
          title={modal.title}
          rows={modal.rows}
          compworkValues={COMPWORK_VALUES}
          onClose={closeModal}
        />
      ) : null}

      <style jsx>{`
        .page {
          max-width: 1280px; margin: 0 auto;
          padding: 28px 20px 60px;
          display: flex; flex-direction: column; gap: 22px;
        }
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
        .kpiGrid {
          display: grid; grid-template-columns: repeat(8,1fr); gap: 14px;
        }
        @media (max-width:1400px) { .kpiGrid { grid-template-columns: repeat(4,1fr); } }
        @media (max-width:900px)  { .kpiGrid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width:600px)  { .kpiGrid { grid-template-columns: repeat(2,1fr); } }
        .footer {
          margin-top: 10px; text-align: center;
          font-size: 11.5px; color: var(--text-faint); font-family: var(--font-mono);
        }
      `}</style>
    </>
  );
}
