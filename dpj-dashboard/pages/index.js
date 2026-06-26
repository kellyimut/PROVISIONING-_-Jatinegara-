// ================================================================
// PERUBAHAN index.js — tambah 2 baris ini
// ================================================================

// 1. Di bagian IMPORT (tambahkan setelah import SettingTodayTable):
import BelumCompworkTable from "../components/BelumCompworkTable";

// 2. Di bagian JSX — tambahkan SETELAH section "TABEL SETTING HARI INI":
// Cari blok ini di index.js:
//
//   {/* ---------------- TABEL SETTING HARI INI ---------------- */}
//   <SectionCard ...>
//     <SettingTodayTable rows={settingToday} compworkValues={COMPWORK_VALUES} />
//   </SectionCard>
//
// Tambahkan blok berikut TEPAT DI BAWAHNYA:

{/* ---------------- TABEL BELUM COMPWORK/PS ---------------- */}
<SectionCard
  eyebrow="Monitoring"
  title={`Total Order Belum COMPWORK/PS (${records.filter(r => !COMPWORK_VALUES.some(v => v.toUpperCase() === String(r.statusBima || "").trim().toUpperCase())).length} order)`}
>
  <BelumCompworkTable rows={records} compworkValues={COMPWORK_VALUES} />
</SectionCard>
