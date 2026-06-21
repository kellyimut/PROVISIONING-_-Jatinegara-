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

import {
  getJakartaToday,
  getJakartaMonthKey,
  todayLabel,
  monthKeyLabel,
  listAvailableMonths,
  filterByDate,
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

  const [summaryMode, setSummaryMode] = useState("harian");
  const [teknisiMode, setTeknisiMode] = useState("harian");
  const [tableMode, setTableMode] = useState("harian");

  const today = getJakartaToday();
  const currentMonthKey = getJakartaMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  // Modal drill-down
  const [modal, setModal] = useState(null); // { title, rows }
  const openModal = (title, rows) => setModal({ title, rows });
  const closeModal = () => setModal(null);

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

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const months = useMemo(() => listAvailableMonths(records), [records]);
  const monthLabel = monthKeyLabel(selectedMonth);

  const todayRecords = useMemo(() => filterByDate(records, today), [records, today]);
  const monthRecords = useMemo(() => filterByMonth(records, selectedMonth), [records, selectedMonth]);

  const kpiToday = useMemo(() => kpiRePs(todayRecords), [todayRecords]);
  const kpiMonth = useMemo(() => kpiRePs(monthRecords), [monthRecords]);

  const summaryRecords = summaryMode === "harian" ? todayRecords : monthRecords;
  const summaryBreakdown = useMemo(() => statusBreakdown(summaryRecords), [summaryRecords]);

  const teknisiRecords = teknisiMode === "harian" ? todayRecords : monthRecords;
  const teknisiData = useMemo(() => technicianStats(teknisiRecords), [teknisiRecords]);

  const tableRecords = tableMode === "harian" ? todayRecords : monthRecords;

  const topTeknisiToday = useMemo(() => technicianStats(todayRecords)[0], [todayRecords]);

  // Baris COMPWORK untuk drill-down RE/PS
  const compworkToday  = useMemo(() => todayRecords.filter((r) => COMPWORK_VALUES.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())), [todayRecords]);
  const compworkMonth  = useMemo(() => monthRecords.filter((r) => COMPWORK_VALUES.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())), [monthRecords]);

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

        {/* ---------------- KPI ROW ---------------- */}
        <div className="kpiGrid">
          <KpiCard
            label={`Order Hari Ini · ${todayLabel(today)}`}
            value={kpiToday.total}
            sub="Total order masuk hari ini"
            onClick={() => openModal(`Detail Order Hari Ini · ${todayLabel(today)} (${kpiToday.total} order)`, todayRecords)}
          />
          <KpiCard
            label="RE/PS Hari Ini"
            kind="percent"
            percent={kpiToday.percent}
            achieved={kpiToday.achieved}
            sub={`${kpiToday.compwork} dari ${kpiToday.total} order COMPWORK · target ${kpiToday.target}%`}
            onClick={() => openModal(`Detail COMPWORK Hari Ini · ${todayLabel(today)} (${kpiToday.compwork} order)`, compworkToday)}
          />
          <KpiCard
            label={`Order Bulan ${monthLabel}`}
            value={kpiMonth.total}
            sub="Total order pada bulan terpilih"
            onClick={() => openModal(`Detail Order Bulan ${monthLabel} (${kpiMonth.total} order)`, monthRecords)}
          />
          <KpiCard
            label={`RE/PS Bulan ${monthLabel}`}
            kind="percent"
            percent={kpiMonth.percent}
            achieved={kpiMonth.achieved}
            sub={`${kpiMonth.compwork} dari ${kpiMonth.total} order COMPWORK · target ${kpiMonth.target}%`}
            onClick={() => openModal(`Detail COMPWORK Bulan ${monthLabel} (${kpiMonth.compwork} order)`, compworkMonth)}
          />
          <KpiCard
            label="Teknisi Teraktif Hari Ini"
            value={topTeknisiToday ? topTeknisiToday.total : 0}
            suffix=" order"
            sub={topTeknisiToday ? topTeknisiToday.teknisi : "Belum ada order hari ini"}
            onClick={topTeknisiToday ? () => openModal(`Order Teknisi ${topTeknisiToday.teknisi} Hari Ini`, todayRecords.filter((r) => r.reguTeknisi === topTeknisiToday.teknisi)) : undefined}
          />
        </div>

        {/* ---------------- ORDER SUMMARY ---------------- */}
        <SectionCard
          eyebrow="Order Masuk"
          title="Ringkasan Order &amp; Status BIMA"
          right={
            <>
              <Tabs value={summaryMode} onChange={setSummaryMode}
                options={[{ value: "harian", label: "Hari Ini" }, { value: "bulanan", label: "Bulanan" }]}
              />
              {summaryMode === "bulanan" ? <MonthPicker months={months} value={selectedMonth} onChange={setSelectedMonth} /> : null}
            </>
          }
        >
          <StatusBreakdown
            total={summaryRecords.length}
            breakdown={summaryBreakdown}
            compworkValues={COMPWORK_VALUES}
            totalLabel={summaryMode === "harian" ? `Order ${todayLabel(today)}` : `Order ${monthLabel}`}
            onClickTotal={() => openModal(
              summaryMode === "harian" ? `Semua Order Hari Ini · ${todayLabel(today)}` : `Semua Order ${monthLabel}`,
              summaryRecords
            )}
            onClickStatus={(status, rows) => openModal(
              `Order Status ${status} · ${summaryMode === "harian" ? todayLabel(today) : monthLabel} (${rows.length})`,
              rows
            )}
          />
        </SectionCard>

        {/* ---------------- TECHNICIAN PRODUCTIVITY ---------------- */}
        <SectionCard
          eyebrow="Produktivitas"
          title="Produktivitas Regu / Teknisi"
          right={
            <>
              <Tabs value={teknisiMode} onChange={setTeknisiMode}
                options={[{ value: "harian", label: "Live Hari Ini" }, { value: "bulanan", label: "Rekap Bulanan" }]}
              />
              {teknisiMode === "bulanan" ? <MonthPicker months={months} value={selectedMonth} onChange={setSelectedMonth} /> : null}
            </>
          }
        >
          <TechnicianProductivity
            data={teknisiData}
            emptyLabel={teknisiMode === "harian" ? "Belum ada order yang ditangani hari ini." : "Belum ada data pada bulan ini."}
            sourceRecords={teknisiRecords}
            onClickTeknisi={(teknisiName, rows) => openModal(
              `Detail Order ${teknisiName} · ${teknisiMode === "harian" ? "Hari Ini" : monthLabel} (${rows.length})`,
              rows
            )}
          />
        </SectionCard>

        {/* ---------------- DETAIL TABLE ---------------- */}
        <SectionCard
          eyebrow="Detail Order"
          title="Tabel Order Provisioning"
          right={
            <>
              <Tabs value={tableMode} onChange={setTableMode}
                options={[{ value: "harian", label: "Harian" }, { value: "bulanan", label: "Bulanan" }]}
              />
              {tableMode === "bulanan" ? <MonthPicker months={months} value={selectedMonth} onChange={setSelectedMonth} /> : null}
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

      {/* Modal drill-down */}
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
          display: grid; grid-template-columns: repeat(5,1fr); gap: 14px;
        }
        @media (max-width:1100px) { .kpiGrid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width:680px)  { .kpiGrid { grid-template-columns: repeat(2,1fr); } }
        .footer {
          margin-top: 10px; text-align: center;
          font-size: 11.5px; color: var(--text-faint); font-family: var(--font-mono);
        }
      `}</style>
    </>
  );
}
