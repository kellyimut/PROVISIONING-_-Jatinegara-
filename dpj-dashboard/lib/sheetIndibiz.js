const { normalizeHeader } = require("./normalize");

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1OrlF3MSls5P9IPRcx3yHgFgWRVlAQPMzkgDSlvlMpEk";
// Nama tab/sheet yang menyimpan data INDIBIZ. Bisa dioverride lewat env var
// GOOGLE_SHEET_INDIBIZ_NAME kalau nama tabnya berbeda.
const INDIBIZ_SHEET_NAME = process.env.GOOGLE_SHEET_INDIBIZ_NAME || "INDIBIZ";

// ----- Pemetaan kolom sheet INDIBIZ -> field internal ---------------------
const FIELDS_INDIBIZ = {
  tgl:              { aliases: ["TGL", "TANGGAL"], type: "date" },
  paket:            { aliases: ["PAKET"], type: "text" },
  noOrder:          { aliases: ["NO ORDER", "NO. ORDER", "NOMOR ORDER", "NO  ORDER"], type: "text" },
  noInternetTelp:   { aliases: ["NO INTERNET/NO TELP", "NO INTERNET / NO TELP", "NO INTERNET /NO TELP", "NO INTERNET/ NO TELP", "NO INTERNET", "NO TELP", "NO. INTERNET / NO. TELP"], type: "text" },
  status:           { aliases: ["STATUS"], type: "text" },
  update:           { aliases: ["UPDATE"], type: "text" },
  detailKeterangan: { aliases: ["DETAIL KETERANGAN", "KETERANGAN"], type: "text" },
  bulan:            { aliases: ["BULAN"], type: "text" },
  teknisi:          { aliases: ["TEKNISI"], type: "text" },
};
const FIELD_KEYS = Object.keys(FIELDS_INDIBIZ);
const MIN_REQUIRED_FIELD_MATCHES = 5;

function gvizUrl() {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=0&sheet=${encodeURIComponent(INDIBIZ_SHEET_NAME)}`;
}

function cellText(cell) {
  if (!cell) return "";
  if (cell.v != null && cell.v !== "") return String(cell.v);
  if (cell.f != null && cell.f !== "") return cell.f;
  return "";
}

// ----- Parser tanggal (sama pola dengan lib/sheet.js) ----------------------
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
  if (m) return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
  m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/.exec(s);
  if (m) {
    let [, first, second, y] = m;
    if (y.length === 2) y = `20${y}`;
    const a = Number(first), b = Number(second);
    if (a >= 1 && a <= 31 && b >= 1 && b <= 12) return `${y}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    if (b >= 1 && b <= 31 && a >= 1 && a <= 12) return `${y}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
    return null;
  }
  return null;
}
function dateToDisplay(iso) {
  if (!iso) return "-";
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

// ----- Deteksi baris header (baris bisa row 1 atau row 2, auto-scan) ------
function countFieldMatches(cellTexts) {
  const normalizedSet = new Set(cellTexts.map(normalizeHeader).filter(Boolean));
  let count = 0;
  FIELD_KEYS.forEach((key) => {
    if (FIELDS_INDIBIZ[key].aliases.some((a) => normalizedSet.has(normalizeHeader(a)))) count += 1;
  });
  return count;
}

function buildFieldIndex(headerTexts) {
  const byNorm = {};
  headerTexts.forEach((label, idx) => {
    const norm = normalizeHeader(label);
    if (norm && !(norm in byNorm)) byNorm[norm] = idx;
  });
  // Fallback super-toleran: buang semua karakter selain huruf/angka, upper-case.
  // Ini mengantisipasi perbedaan spasi ganda, spasi di sekitar "/", dsb pada header sheet.
  const stripAlnum = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const byAlnum = {};
  headerTexts.forEach((label, idx) => {
    const alnum = stripAlnum(label);
    if (alnum && !(alnum in byAlnum)) byAlnum[alnum] = idx;
  });

  const fieldIndex = {};
  FIELD_KEYS.forEach((key) => {
    for (const alias of FIELDS_INDIBIZ[key].aliases) {
      const norm = normalizeHeader(alias);
      if (norm in byNorm) { fieldIndex[key] = byNorm[norm]; break; }
    }
    if (!(key in fieldIndex)) {
      for (const alias of FIELDS_INDIBIZ[key].aliases) {
        const alnum = stripAlnum(alias);
        if (alnum in byAlnum) { fieldIndex[key] = byAlnum[alnum]; break; }
      }
    }
  });
  return fieldIndex;
}

// ----- Fungsi utama ---------------------------------------------------------
async function fetchIndibizRecords() {
  const res = await fetch(gvizUrl(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal mengambil sheet INDIBIZ (status ${res.status}).`);

  const raw = await res.text();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("Format respons sheet INDIBIZ tidak dikenali.");

  let data;
  try { data = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)); } catch { throw new Error("Gagal mem-parsing data sheet INDIBIZ."); }
  if (data.status === "error") {
    const msg = (data.errors && data.errors[0] && data.errors[0].detailed_message) || `Sheet bernama "${INDIBIZ_SHEET_NAME}" tidak ditemukan.`;
    throw new Error(msg);
  }

  const allRows = (data.table && data.table.rows) || [];

  // Scan beberapa baris pertama untuk menemukan baris header (antisipasi row 1 kosong seperti sheet TSEL)
  const SCAN_LIMIT = Math.min(allRows.length, 10);
  let bestIdx = -1, bestScore = 0;
  for (let i = 0; i < SCAN_LIMIT; i++) {
    const texts = (allRows[i].c || []).map(cellText);
    const score = countFieldMatches(texts);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  if (bestIdx === -1 || bestScore < MIN_REQUIRED_FIELD_MATCHES) {
    throw new Error(`Header kolom sheet INDIBIZ tidak dikenali (cocok ${bestScore} dari ${FIELD_KEYS.length} kolom yang dibutuhkan). Pastikan nama kolom sesuai: TGL, PAKET, NO ORDER, NO INTERNET/NO TELP, STATUS, UPDATE, DETAIL KETERANGAN, BULAN, TEKNISI.`);
  }

  const headerTexts = (allRows[bestIdx].c || []).map(cellText);
  const fieldIndex = buildFieldIndex(headerTexts);
  const dataRows = allRows.slice(bestIdx + 1);

  const records = dataRows.map((row, i) => {
    const c = row.c || [];
    const get = (key) => {
      const idx = fieldIndex[key];
      if (idx == null) return "";
      return cellText(c[idx]);
    };
    const tglRaw = get("tgl");
    const tglISO = parseLooseDate(tglRaw);
    return {
      id: i,
      tgl: tglISO ? dateToDisplay(tglISO) : (tglRaw || "-"),
      tglISO,
      paket: get("paket") || "-",
      noOrder: get("noOrder") || "-",
      noInternetTelp: get("noInternetTelp") || "-",
      status: get("status") || "-",
      update: get("update") || "-",
      detailKeterangan: get("detailKeterangan") || "-",
      bulan: get("bulan") || (tglISO ? tglISO.slice(0, 7) : "-"),
      teknisi: get("teknisi") || "-",
    };
  }).filter((r) => r.noOrder !== "-" || r.tgl !== "-");

  return { records, missingFields: FIELD_KEYS.filter((k) => !(k in fieldIndex)) };
}

module.exports = { fetchIndibizRecords };
