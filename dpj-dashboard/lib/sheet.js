const { FIELDS, STO_FILTER } = require("../config/columns");
const { normalizeHeader } = require("./normalize");

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1OrlF3MSls5P9IPRcx3yHgFgWRVlAQPMzkgDSlvlMpEk";
// GOOGLE_SHEET_GID bisa dikosongkan ("") supaya dashboard otomatis scan semua
// tab sampai ketemu sheet yang berisi kolom provisioning yang dibutuhkan.
const SHEET_GID_ENV = process.env.GOOGLE_SHEET_GID;

const FIELD_KEYS = Object.keys(FIELDS);

// Minimal jumlah field wajib yang harus berhasil dipetakan sebelum dashboard
// dianggap "aman" untuk ditampilkan. Jika kurang dari ini, coba tab lain.
const MIN_REQUIRED_FIELD_MATCHES = 6;

// ----- URL builder -------------------------------------------------------
function gvizUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=0&gid=${gid}`;
}
function csvUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
}

// ----- Ambil daftar semua GID tab dari halaman HTML spreadsheet ----------
// Dipakai sebagai fallback jika GID yang dikonfigurasi tidak menghasilkan data.
async function fetchAllGids() {
  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const html = await res.text();
    // Pola: "gid":1234567890 atau #gid=1234567890 di dalam teks HTML
    const gids = new Set();
    const re1 = /"gid"\s*:\s*(\d+)/g;
    const re2 = /#gid=(\d+)/g;
    let m;
    while ((m = re1.exec(html)) !== null) gids.add(m[1]);
    while ((m = re2.exec(html)) !== null) gids.add(m[1]);
    // Pastikan GID 0 selalu dicoba pertama
    const arr = Array.from(gids).filter((g) => g !== "0");
    return ["0", ...arr];
  } catch {
    return ["0"];
  }
}

// ----- Parser CSV sederhana tapi benar ----------------------------------
function parseCsvRows(text, maxRows) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;
  while (i < len && rows.length < maxRows) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cur += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ",") { row.push(cur); cur = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; i++; continue; }
    cur += ch; i++;
  }
  if (rows.length < maxRows && (row.length || cur)) { row.push(cur); rows.push(row); }
  return rows;
}

// ----- Parser tanggal ---------------------------------------------------
const GVIZ_DATE_RE = /^Date\((\d+),(\d+),(\d+)(?:,\d+,\d+,\d+)?\)$/;

function parseGvizDate(raw) {
  if (raw == null) return null;
  const match = GVIZ_DATE_RE.exec(String(raw));
  if (!match) return null;
  const [, y, m, d] = match;
  return `${Number(y)}-${String(Number(m) + 1).padStart(2, "0")}-${String(Number(d)).padStart(2, "0")}`;
}

function parseLooseDate(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  const gviz = parseGvizDate(s);
  if (gviz) return gviz;

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;

  m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/.exec(s);
  if (m) {
    let [, first, second, y] = m;
    if (y.length === 2) y = `20${y}`;
    const a = Number(first), b = Number(second);
    // Coba dd/mm (Indonesia) dulu; jika b > 12 tidak mungkin bulan, coba mm/dd
    if (a >= 1 && a <= 31 && b >= 1 && b <= 12)
      return `${y}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
    if (b >= 1 && b <= 31 && a >= 1 && a <= 12)
      return `${y}-${String(a).padStart(2,"0")}-${String(b).padStart(2,"0")}`;
    return null;
  }
  return null;
}

function dateToDisplay(iso) {
  if (!iso) return "-";
  const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

// ----- Helpers pembacaan sel gviz ----------------------------------------
function rawCellValue(cell) {
  if (!cell || cell.v == null) return "";
  return cell.v;
}
function textDisplay(cell) {
  if (!cell) return "";
  if (cell.v != null && cell.v !== "") return String(cell.v);
  if (cell.f != null && cell.f !== "") return cell.f;
  return "";
}
function dateFallbackDisplay(cell) {
  if (!cell) return "";
  if (cell.f != null && cell.f !== "") return cell.f;
  if (cell.v != null && cell.v !== "") return String(cell.v);
  return "";
}

// ----- Deteksi header via CSV -------------------------------------------
function countFieldMatches(cellTexts) {
  const normalizedSet = new Set(cellTexts.map(normalizeHeader).filter(Boolean));
  let count = 0;
  FIELD_KEYS.forEach((key) => {
    const def = FIELDS[key];
    if (def.aliases.some((a) => normalizedSet.has(normalizeHeader(a)))) count += 1;
  });
  return count;
}

function findStoColumnFromTexts(cellTexts) {
  for (let i = 0; i < cellTexts.length; i++) {
    const norm = normalizeHeader(cellTexts[i]);
    if (STO_FILTER.aliases.some((a) => normalizeHeader(a) === norm)) return i;
  }
  return null;
}

function detectHeaderRowFromCsv(csvRows) {
  const SCAN_LIMIT = Math.min(csvRows.length, 25);
  let bestIdx = -1, bestScore = 0;
  for (let i = 0; i < SCAN_LIMIT; i++) {
    const score = countFieldMatches(csvRows[i] || []);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  if (bestIdx === -1 || bestScore < MIN_REQUIRED_FIELD_MATCHES)
    return { headerTexts: csvRows[0] || [], headerRowIndex: -1, undetected: true };
  return { headerTexts: csvRows[bestIdx], headerRowIndex: bestIdx, undetected: false };
}

function buildFieldIndex(headerTexts) {
  const byNorm = {};
  headerTexts.forEach((label, idx) => {
    const norm = normalizeHeader(label);
    if (norm && !(norm in byNorm)) byNorm[norm] = idx;
  });
  const fieldIndex = {};
  FIELD_KEYS.forEach((key) => {
    for (const alias of FIELDS[key].aliases) {
      const norm = normalizeHeader(alias);
      if (norm in byNorm) { fieldIndex[key] = byNorm[norm]; break; }
    }
  });
  return { fieldIndex, stoIndex: findStoColumnFromTexts(headerTexts) };
}

// ----- Proses satu GID: ambil CSV (header) + JSON (data) ----------------
async function tryFetchGid(gid) {
  const [csvRes, jsonRes] = await Promise.all([
    fetch(csvUrl(gid), { cache: "no-store" }),
    fetch(gvizUrl(gid), { cache: "no-store" }),
  ]);
  if (!csvRes.ok || !jsonRes.ok) return null; // tab tidak bisa diakses

  const csvText = await csvRes.text();
  const csvRows = parseCsvRows(csvText, 30);
  const { headerTexts, headerRowIndex, undetected } = detectHeaderRowFromCsv(csvRows);
  if (undetected) return null; // tab ini bukan sheet provisioning

  const { fieldIndex, stoIndex } = buildFieldIndex(headerTexts);
  const matchedCount = Object.keys(fieldIndex).length;
  if (matchedCount < MIN_REQUIRED_FIELD_MATCHES) return null;

  const raw = await jsonRes.text();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) return null;

  let data;
  try { data = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)); } catch { return null; }
  if (data.status === "error") return null;

  const cols = (data.table && data.table.cols) || [];
  const allRows = (data.table && data.table.rows) || [];
  const dataRows = allRows.slice(headerRowIndex + 1);

  const missingFields = FIELD_KEYS.filter((k) => !(k in fieldIndex));

  let records = dataRows.map((row, i) => {
    const c = row.c || [];
    const get = (fieldKey) => {
      const idx = fieldIndex[fieldKey];
      if (idx == null) return { raw: "", display: "" };
      const cell = c[idx];
      const isDate = FIELDS[fieldKey] && FIELDS[fieldKey].type === "date";
      return { raw: rawCellValue(cell), display: isDate ? dateFallbackDisplay(cell) : textDisplay(cell) };
    };

    const tob = get("tanggalOrderBima");
    const ts  = get("tanggalSetting");
    const tm  = get("tanggalManja");

    const orderDateISO   = parseLooseDate(tob.raw) || parseLooseDate(tob.display);
    const settingDateISO = parseLooseDate(ts.raw)  || parseLooseDate(ts.display);
    const manjaDateISO   = parseLooseDate(tm.raw)  || parseLooseDate(tm.display);

    const record = {
      id: i,
      tanggalSetting:        settingDateISO ? dateToDisplay(settingDateISO) : ts.display  || "-",
      tanggalOrderBima:      orderDateISO   ? dateToDisplay(orderDateISO)   : tob.display || "-",
      workorderPsb:          get("workorderPsb").display          || "-",
      workorderOdpValidation: get("workorderOdpValidation").display || "-",
      serviceNo:             get("serviceNo").display             || "-",
      crmOrderType:          get("crmOrderType").display          || "-",
      statusBima:            get("statusBima").display            || "-",
      tanggalManja:          manjaDateISO   ? dateToDisplay(manjaDateISO)   : tm.display  || "-",
      progress:              get("progress").display              || "-",
      reguTeknisi:           get("reguTeknisi").display           || "-",
      statusQc2:             get("statusQc2").display             || "-",
      orderDateISO,
      settingDateISO,
      orderMonthKey: orderDateISO ? orderDateISO.slice(0, 7) : null,
    };

    if (stoIndex != null) record._sto = textDisplay(c[stoIndex]);
    return record;
  });

  // Filter STO jika dikonfigurasi
  if (STO_FILTER.filterValue && stoIndex != null) {
    const target = normalizeHeader(STO_FILTER.filterValue);
    records = records.filter((r) => normalizeHeader(r._sto) === target);
  }

  // Buang baris kosong total
  records = records.filter((r) => r.orderDateISO || (r.serviceNo && r.serviceNo !== "-"));

  return { records, missingFields, totalColumns: cols.length, gidUsed: gid };
}

// ----- Fungsi utama ------------------------------------------------------
async function fetchSheetRecords() {
  // 1. Kalau ada env var GOOGLE_SHEET_GID, coba dulu GID itu.
  if (SHEET_GID_ENV && SHEET_GID_ENV.trim() !== "") {
    const result = await tryFetchGid(SHEET_GID_ENV.trim());
    if (result && result.records.length >= 0) return result;
    // Jika GID env var gagal, jatuh ke auto-scan di bawah
  }

  // 2. Auto-scan: coba GID=0 dulu, lalu semua GID lain dari metadata spreadsheet.
  const gidsToTry = ["0"];

  // Tambah GID lain dari metadata (best-effort, tidak apa-apa kalau gagal)
  try {
    const allGids = await fetchAllGids();
    allGids.forEach((g) => { if (!gidsToTry.includes(g)) gidsToTry.push(g); });
  } catch { /* abaikan */ }

  for (const gid of gidsToTry) {
    const result = await tryFetchGid(gid);
    if (result) return result;
  }

  throw new Error(
    `Tidak ada tab di spreadsheet yang berisi kolom provisioning yang dibutuhkan (minimal ${MIN_REQUIRED_FIELD_MATCHES} dari ${FIELD_KEYS.length} kolom). ` +
    `Pastikan sheet sudah dibagikan ke "Anyone with the link" dan nama kolomnya sesuai alias di config/columns.js.`
  );
}

module.exports = {
  fetchSheetRecords,
  parseLooseDate,
  dateToDisplay,
  detectHeaderRowFromCsv,
  buildFieldIndex,
  countFieldMatches,
  parseCsvRows,
};
