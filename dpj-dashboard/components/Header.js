import { useEffect, useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher";
import Tabs from "./Tabs";

function useJakartaClock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () => {
      const s = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());
      setNow(s);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const DASHBOARD_TABS = [
  { value: "tsel", label: "TSEL", color: "#f87171" },
  { value: "indibiz", label: "INDIBIZ", color: "#34d399" },
];

export default function Header({ status, lastUpdated, onRefresh, isFetching, activeTab, onTabChange }) {
  const clock = useJakartaClock();

  return (
    <header className="header">
      <div className="left">
        <div className="brandRow">
          <div className="mark">JTN</div>
          <div>
            <h1>DASHBOARD PROVISIONING — JATINEGARA</h1>
            <p className="sub">Pengawasan order &amp; produktivitas provisioning FTTH STO Jatinegara, sumber data Google Spreadsheet</p>
          </div>
        </div>

        {activeTab && onTabChange ? (
          <div className="tabRow">
            <Tabs options={DASHBOARD_TABS} value={activeTab} onChange={onTabChange} />
          </div>
        ) : null}
      </div>

      <div className="right">
        <div className="liveBadge" title={status === "ok" ? "Data tersambung" : "Gangguan koneksi data"}>
          <span className={`pulse-dot ${status !== "ok" ? "dim" : ""}`} />
          <span className="liveText">{status === "ok" ? "LIVE" : "OFFLINE"}</span>
        </div>

        <div className="clock num-mono">{clock || "—"} WIB</div>

        <button className="refreshBtn" onClick={onRefresh} disabled={isFetching} type="button" aria-label="Segarkan data">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            className={isFetching ? "spin" : ""}
          >
            <path
              d="M4 4v6h6M20 20v-6h-6M5.5 9A7 7 0 0 1 19 11M18.5 15A7 7 0 0 1 5 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <ThemeSwitcher />
      </div>

      <div className="updatedRow">
        {lastUpdated ? <span>Diperbarui {lastUpdated}</span> : <span>Memuat data…</span>}
      </div>

      <style jsx>{`
        .header {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: flex-start;
          gap: 16px 20px;
          margin-bottom: 22px;
        }
        .left {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .brandRow {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .tabRow {
          display: flex;
        }
        .mark {
          flex: none;
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.03em;
          color: #06141f;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 10px 24px -10px var(--accent-soft);
        }
        h1 {
          font-family: var(--font-display);
          font-size: clamp(18px, 2.4vw, 25px);
          font-weight: 800;
          letter-spacing: -0.01em;
          margin: 0 0 4px;
          color: var(--text);
        }
        .sub {
          margin: 0;
          font-size: 12.5px;
          color: var(--text-dim);
          max-width: 56ch;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .liveBadge {
          display: flex;
          align-items: center;
          gap: 7px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text);
        }
        .pulse-dot.dim {
          background: var(--danger);
          animation: none;
          box-shadow: none;
        }
        .clock {
          font-size: 12.5px;
          color: var(--text-dim);
          background: var(--surface-2);
          border: 1px solid var(--border);
          padding: 7px 12px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .refreshBtn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .refreshBtn:disabled {
          opacity: 0.6;
          cursor: progress;
        }
        .spin {
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .updatedRow {
          grid-column: 1 / -1;
          font-size: 11.5px;
          color: var(--text-faint);
          font-family: var(--font-mono);
        }
        @media (max-width: 720px) {
          .header {
            grid-template-columns: 1fr;
          }
          .right {
            justify-content: flex-start;
          }
        }
      `}</style>
    </header>
  );
}
