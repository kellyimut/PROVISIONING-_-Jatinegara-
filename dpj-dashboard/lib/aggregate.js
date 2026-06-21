const { COMPWORK_VALUES, REPS_TARGET_PERCENT } = require("../config/columns");

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// "Hari ini" selalu dihitung berdasarkan zona waktu WIB (Asia/Jakarta),
// terlepas dari lokasi orang yang membuka dashboard.
function getJakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = {};
  parts.forEach((p) => (map[p.type] = p.value));
  return `${map.year}-${map.month}-${map.day}`; // yyyy-mm-dd
}

function getJakartaMonthKey() {
  return getJakartaToday().slice(0, 7); // yyyy-mm
}

function monthKeyLabel(monthKey) {
  if (!monthKey) return "-";
  const [y, m] = monthKey.split("-").map(Number);
  return `${BULAN_PANJANG[m - 1]} ${y}`;
}

function todayLabel(dateISO) {
  if (!dateISO) return "-";
  const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const [y, m, d] = dateISO.split("-").map(Number);
  return `${d} ${BULAN_PENDEK[m - 1]} ${y}`;
}

// Daftar bulan unik yang tersedia di data (diurutkan dari terbaru), dipakai
// untuk mengisi opsi pada tombol/dropdown pilih bulan.
function listAvailableMonths(records) {
  const set = new Set();
  records.forEach((r) => {
    if (r.orderMonthKey) set.add(r.orderMonthKey);
  });
  set.add(getJakartaMonthKey()); // pastikan bulan berjalan selalu tersedia sebagai opsi
  return Array.from(set)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((key) => ({ key, label: monthKeyLabel(key) }));
}

function filterByDate(records, dateISO) {
  return records.filter((r) => r.orderDateISO === dateISO);
}

function filterBySettingDate(records, dateISO) {
  return records.filter((r) => r.settingDateISO === dateISO);
}

function filterByMonth(records, monthKey) {
  return records.filter((r) => r.orderMonthKey === monthKey);
}

function isCompwork(statusBima) {
  if (!statusBima) return false;
  const s = String(statusBima).trim().toUpperCase();
  return COMPWORK_VALUES.some((v) => v.toUpperCase() === s);
}

function statusBreakdown(records) {
  const groups = new Map();
  records.forEach((r) => {
    const key = (r.statusBima || "TANPA STATUS").trim() || "TANPA STATUS";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  });
  const total = records.length;
  return Array.from(groups.entries())
    .map(([status, rows]) => ({ status, count: rows.length, rows, percent: total ? Math.round((rows.length / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.count - a.count);
}

function kpiRePs(records) {
  const total = records.length;
  const compwork = records.filter((r) => isCompwork(r.statusBima)).length;
  const percent = total ? Math.round((compwork / total) * 1000) / 10 : 0;
  return { total, compwork, percent, target: REPS_TARGET_PERCENT, achieved: percent >= REPS_TARGET_PERCENT };
}

function technicianStats(records) {
  const map = new Map();
  records.forEach((r) => {
    const name = (r.reguTeknisi || "Belum Ditugaskan").trim() || "Belum Ditugaskan";
    if (!map.has(name)) map.set(name, { teknisi: name, total: 0, compwork: 0 });
    const entry = map.get(name);
    entry.total += 1;
    if (isCompwork(r.statusBima)) entry.compwork += 1;
  });
  return Array.from(map.values())
    .map((e) => ({ ...e, percent: e.total ? Math.round((e.compwork / e.total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.total - a.total);
}

module.exports = {
  getJakartaToday,
  getJakartaMonthKey,
  monthKeyLabel,
  todayLabel,
  listAvailableMonths,
  filterByDate,
  filterBySettingDate,
  filterByMonth,
  isCompwork,
  statusBreakdown,
  kpiRePs,
  technicianStats,
  REPS_TARGET_PERCENT,
};
