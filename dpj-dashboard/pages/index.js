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
import BelumCompworkTable from "../components/BelumCompworkTable";
import IndibizDashboard from "../components/IndibizDashboard";

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
  // ---------------- Tab dashboard: TSEL / INDIBIZ ----------------
  const [activeTab, setActiveTab] = useState("tsel");

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

  const [modal, setModal] = useState(null);
  const openModal = (title, rows) => setModal({ title, rows });
  const closeModal = () => setModal(null);

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

  const settingMonths = useMemo(() => listAvailableSettingMonths(records), [records]);
  const orderMonths   = useMemo(() => listAvailableMonths(records), [records]);
  const monthLabel    = monthKeyLabel(selectedMonth);

  const orderBimaToday = useMemo(() => filterByDate(records, today), [records, today]);
  const kpiOrderBima   = useMemo(() => kpiRePs(orderBimaToday), [orderBimaToday]);
  const orderBimaMonth = useMemo(() => filterByMonth(records, selectedMonth), [records, selectedMonth]);
  const kpiOrderBimaMonth = useMemo(() => kpiRePs(orderBimaMonth), [orderBimaMonth]);
  const compworkOrderBimaMonth = useMemo(() =>
    orderBimaMonth.filter((r) => COMPWORK_VALUES.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())),
    [orderBimaMonth]);

  const settingToday    = useMemo(() => filterBySettingDate(records, today), [records, today]);
  const kpiSettingToday = useMemo(() => kpiRePs(settingToday), [settingToday]);
  const settingMonth    = useMemo(() => filterBySettingMonth(records, selectedMonth), [records, selectedMonth]);
  const kpiSettingMonth = useMemo(() => kpiRePs(settingMonth), [settingMonth]);

  const compworkSettingToday = useMemo(() =>
    settingToday.filter((r) => COMPWORK_VALUES.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())),
    [settingToday]);
  const compworkSettingMonth = useMemo(() =>
    settingMonth.filter((r) => COMPWORK_VALUES.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())),
    [settingMonth]);

  const summaryRecords   = summaryMode === "harian" ? settingToday : settingMonth;
  const summaryBreakdown = useMemo(() => statusBreakdown(summaryRecords), [summaryRecords]);

  const teknisiRecords = teknisiMode === "harian" ? settingToday : settingMonth;
  const teknisiData    = useMemo(() => technicianStats(teknisiRecords), [teknisiRecords]);

  const tableRecords = tableMode === "harian" ? orderBimaToday : orderBimaMonth;

  const topTeknisiToday = useMemo(() => technicianStats(settingToday)[0], [settingToday]);

  const produktivitasPerTeknisi = teknisiHadir.total > 0
    ? (compworkSettingToday.length / teknisiHadir.total).toFixed(1)
    : "-";

  // Hitung total belum compwork bulan berjalan untuk judul section
  const belumCompworkCount = useMemo(() => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const BULAN = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",Mei:"05",Jun:"06",Jul:"07",Agu:"08",Sep:"09",Okt:"10",Nov:"11",Des:"12" };
    const toMonthKey = (displayStr) => {
      if (!displayStr || displayStr === "-") return null;
      const m1 = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(displayStr);
      if (m1) return `${m1[3]}-${BULAN[m1[2]] || "00"}`;
      const m2 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(displayStr);
      if (m2) return `${m2[3]}-${m2[2].padStart(2,"0")}`;
      return null;
    };
    return records.filter((r) => {
      const bukanCompwork = !COMPWORK_VALUES.some((v) => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase());
      const bulanSetting = toMonthKey(r.tanggalSetting);
      return bukanCompwork && bulanSetting === currentMonthKey;
    }).length;
  }, [records]);

  return (
    <>
      <Head><title>DASHBOARD PROVISIONING - Jatinegara</title></Head>

      <div className="page">
        <Header
          status={status}
          lastUpdated={lastUpdated}
          onRefresh={load}
          isFetching={isFetching}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === "indibiz" ? (
          <IndibizDashboard />
        ) : (
          <>
            {status === "error" ? (
              <div className="errorBanner">
                <strong>Gagal mengambil data dari spreadsheet.</strong>
                <span>{errorMsg}</span>
                <button onClick={load} type="button">Coba lagi</button>
              </div>
            ) : null}

            {/* ---------------- KPI ROW (10 card) ---------------- */}
            <div className="kpiGrid">

              {/* CARD 1: Order hari ini dari Tanggal Order BIMA */}
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

              {/* CARD 3: COMPWORK hari ini dari Setting */}
              <KpiCard
                label="COMPWORK Hari Ini"
                value={kpiSettingToday.compwork}
                sub="Order Setting dengan Status BIMA: COMPWORK hari ini"
                onClick={() => openModal(
                  `COMPWORK Setting Hari Ini · ${todayLabel(today)} (${kpiSettingToday.compwork} order)`,
                  compworkSettingToday
                )}
              />

              {/* CARD 4: RE/PS hari ini dari Setting */}
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

              {/* CARD 5: Order bulan terpilih dari Tanggal Order BIMA */}
              <KpiCard
                label={`Order Bulan ${monthLabel}`}
                value={kpiOrderBimaMonth.total}
                sub="Total order bulan terpilih (Tgl Order BIMA)"
                badge="BIMA"
                onClick={() => openModal(
                  `Order Bulan ${monthLabel} — dari Tanggal Order BIMA (${kpiOrderBimaMonth.total} order)`,
                  orderBimaMonth
                )}
              />

              {/* CARD 6: COMPWORK bulan terpilih dari Tanggal Order BIMA */}
              <KpiCard
                label={`COMPWORK Bulan ${monthLabel}`}
                value={kpiOrderBimaMonth.compwork}
                sub="Order dengan Status BIMA: COMPWORK pada bulan terpilih (Tgl Order BIMA)"
                onClick={() => openModal(
                  `COMPWORK Bulan ${monthLabel} — dari Tanggal Order BIMA (${kpiOrderBimaMonth.compwork} order)`,
                  compworkOrderBimaMonth
                )}
              />

              {/* CARD 7: RE/PS bulanan dari Tanggal Order BIMA */}
              <KpiCard
                label={`RE/PS Bulan ${monthLabel}`}
                kind="percent"
                percent={kpiOrderBimaMonth.percent}
                achieved={kpiOrderBimaMonth.achieved}
                sub={`${kpiOrderBimaMonth.compwork} dari ${kpiOrderBimaMonth.total} COMPWORK · target ${kpiOrderBimaMonth.target}% (Tgl Order BIMA)`}
                onClick={() => openModal(
                  `COMPWORK Bulan ${monthLabel} — dari Tanggal Order BIMA (${kpiOrderBimaMonth.compwork} order)`,
                  compworkOrderBimaMonth
                )}
              />

              {/* CARD 8: Teknisi teraktif dari Setting */}
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

              {/* CARD 9: Teknisi Hadir Hari Ini */}
              <TeknisiHadirCard
                total={teknisiHadir.total}
                names={teknisiHadir.names}
                loading={teknisiHadir.loading}
                error={teknisiHadir.error}
              />

              {/* CARD 10: Produktivitas */}
              <KpiCard
                label="Produktivitas / Teknisi"
                value={produktivitasPerTeknisi}
                suffix={teknisiHadir.total > 0 ? " order" : ""}
                sub={
                  teknisiHadir.total > 0
                    ? `${compworkSettingToday.length} COMPWORK ÷ ${teknisiHadir.total} teknisi hadir`
                    : "Data teknisi hadir belum tersedia"
                }
                badge="PRODUKTIF"
                onClick={compworkSettingToday.length > 0 ? () => openModal(
                  `COMPWORK Setting Hari Ini · ${todayLabel(today)} (${compworkSettingToday.length} order)`,
                  compworkSettingToday
                ) : undefined}
              />
            </div>

            {/* ---------------- RINGKASAN STATUS BIMA ---------------- */}
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

            {/* ---------------- PRODUKTIVITAS TEKNISI ---------------- */}
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

            {/* ---------------- TABEL BELUM COMPWORK/PS ---------------- */}
            <SectionCard
              eyebrow="Monitoring"
              title={`Total Order Belum COMPWORK/PS (${belumCompworkCount} order)`}
            >
              <BelumCompworkTable rows={records} compworkValues={COMPWORK_VALUES} />
            </SectionCard>

            {/* ---------------- TABEL DETAIL — dari Tanggal Order BIMA ---------------- */}
            <SectionCard
              eyebrow="Detail Order"
              title="Tabel Order Provisioning (berdasarkan Tanggal Order BIMA)"
              right={
                <>
                  <Tabs value={tableMode} onChange={setTableMode}
                    options={[{ value: "harian", label: "Harian" }, { value: "bulanan", label: "Bulanan" }]}
                  />
                  {tableMode === "bulanan"
                    ? <MonthPicker months={orderMonths} value={selectedMonth} onChange={setSelectedMonth} />
                    : null}
                </>
              }
            >
              <OrdersTable rows={tableRecords} compworkValues={COMPWORK_VALUES} />
            </SectionCard>
          </>
        )}

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
          display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 14px;
        }
        @media (max-width:600px) { .kpiGrid { grid-template-columns: repeat(2,1fr); } }
        .footer {
          margin-top: 10px; text-align: center;
          font-size: 11.5px; color: var(--text-faint); font-family: var(--font-mono);
        }
      `}</style>
    </>
  );
}
