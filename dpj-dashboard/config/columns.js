// =============================================================================
// PEMETAAN KOLOM SPREADSHEET -> FIELD INTERNAL DASHBOARD
// -----------------------------------------------------------------------------
// Jika nama kolom (header) di spreadsheet Anda sedikit berbeda penulisannya,
// CUKUP tambahkan variasi penulisannya ke dalam array "aliases" di bawah ini.
// Tidak perlu mengubah kode lain.
// =============================================================================

const FIELDS = {
  tanggalSetting: {
    label: "Tanggal Setting",
    aliases: ["Tanggal Setting", "Tgl Setting"],
    type: "date",
  },
  tanggalOrderBima: {
    label: "Tanggal Order BIMA",
    aliases: ["Tanggal Order BIMA", "Tanggal Order Bima", "Tgl Order BIMA"],
    type: "date",
  },
  workorderPsb: {
    label: "Workorder PSB",
    aliases: ["Workorder PSB", "Work Order PSB", "WO PSB", "No Workorder PSB"],
    type: "text",
  },
  workorderOdpValidation: {
    label: "Workorder ODP Validation",
    aliases: [
      "Workorder ODP Validation",
      "Workorder Odp Validatioan",
      "Workorder Odp Validation",
      "WO ODP Validation",
      "Workorder Validasi ODP",
    ],
    type: "text",
  },
  serviceNo: {
    label: "Service No.",
    aliases: ["Service No.", "Service No", "Service Number", "No Internet", "No Service"],
    type: "text",
  },
  crmOrderType: {
    label: "CRM Order Type",
    aliases: ["CRM Order Type", "Order Type", "Tipe Order"],
    type: "text",
  },
  statusBima: {
    label: "Status BIMA",
    aliases: ["Status BIMA", "Status Bima"],
    type: "text",
  },
  tanggalManja: {
    label: "Tanggal Manja",
    aliases: ["Tanggal Manja", "Tgl Manja"],
    type: "date",
  },
  progress: {
    label: "Progress",
    aliases: ["Progress", "Progres"],
    type: "text",
  },
  reguTeknisi: {
    label: "Regu/Teknisi",
    aliases: ["Regu/Teknisi", "Regu / Teknisi", "Regu Teknisi", "Teknisi", "Regu"],
    type: "text",
  },
  statusQc2: {
    label: "Status QC2",
    aliases: ["Status QC2", "Status Qc2", "QC2", "Status Qc 2"],
    type: "text",
  },
};

// Nilai pada kolom "Status BIMA" yang dianggap sebagai pekerjaan SELESAI (COMPWORK)
// untuk perhitungan KPI RE/PS = total COMPWORK / total order.
const COMPWORK_VALUES = ["COMPWORK", "COMP WORK", "COMP-WORK", "COMPLETE WORK", "COMPLETED"];

// (Opsional) Jika spreadsheet Anda berisi banyak STO dan ingin dashboard ini
// hanya menampilkan STO Jatinegara, isi nama kolom STO di "aliases" dan isi
// "filterValue". Kosongkan filterValue ("") jika sheet sumber memang sudah
// khusus berisi data Jatinegara saja (tidak perlu difilter lagi).
const STO_FILTER = {
  aliases: ["STO", "Sto Setting", "Nama STO"],
  filterValue: "",
};

// Target KPI RE/PS (persen) — dipakai untuk pewarnaan status pencapaian.
// Catatan: variabel ini dipakai juga di kode sisi browser, sehingga WAJIB
// diawali "NEXT_PUBLIC_" agar ikut di-build oleh Next.js (lihat .env.example).
const REPS_TARGET_PERCENT = Number(process.env.NEXT_PUBLIC_REPS_TARGET_PERCENT || 85);

module.exports = { FIELDS, COMPWORK_VALUES, STO_FILTER, REPS_TARGET_PERCENT };
