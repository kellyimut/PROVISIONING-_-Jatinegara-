const { FIELDS, STO_FILTER } = require("../config/columns");
const { normalizeHeader } = require("./normalize");

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1OrlF3MSls5P9IPRcx3yHgFgWRVlAQPMzkgDSlvlMpEk";
const SHEET_GID = process.env.GOOGLE_SHEET_GID || "0";

// headers=0 -> minta Google JANGAN menebak baris header sendiri. Beberapa
// spreadsheet (termasuk sumber dashboard ini) punya baris judul/section di
// ATAS baris header asli, jadi deteksi header dilakukan sendiri di bawah
// berdasarkan ISI sel, bukan berdasarkan posisi baris.
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=0&gid=${SHEET_GID}`;

const FIELD_KEYS = Object.keys(FIELDS);

// Minimal jumlah field wajib yang harus berhasil dipetakan sebelum dashboard
// dianggap "aman" untuk ditampilkan. Jika kurang dari ini, lebih baik gagal
// dengan pesan jelas daripada menampilkan dashboard kosong/salah secara diam-diam.
const MIN_REQUIRED_FIELD_MATCHES = 6;

// Parser untuk format tanggal khas Google Visualization API: "Date(2026,5,20)"
// Catatan: bulan pada format ini berbasis 0 (Januari = 0).
const GVIZ_DATE_RE = /^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/;

function parseGvizDate(raw) {
  if (raw == null) return null;
  const match = GVIZ_DATE_RE.exec(String(raw));
  if (!match) return null;
  const [, y, m, d] = match;
  const yyyy = Number(y);
  const mm = String(Number(m) + 1).padStart(2, "0");
  const dd = String(Number(d)).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // ISO yyyy-mm-dd, dipakai sebagai kunci filter
}

// Mencoba mem-parsing teks tanggal umum lain (dd/mm/yyyy, yyyy-mm-dd, dll)
// sebagai cadangan jika kolom tanggal tersimpan sebagai teks biasa di sheet
// (kasus ini TERKONFIRMASI terjadi di sheet sumber: kolom tanggal berisi
// campuran teks tanggal "29/04/2026 15:38:00" dan catatan bebas seperti
// "masuk jtn"). Asumsi format: hari/bulan/tahun (konvensi Indonesia).
function parseLooseDate(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();

  const gviz = parseGvizDate(s);
  if (gviz) return gviz;

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/.exec(s);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    const dd = Number(d);
    const mm = Number(mo);
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return null;
}

function dateToDisplay(iso) {
  if (!iso) return "-";
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

// ----- Helper pembacaan sel gviz ---------------------------------------
// PENTING: ada dua kebutuhan tampilan yang berbeda dan keduanya tidak boleh
// tertukar, karena pernah terbukti berisiko pada data nyata:
//  - Field identitas/teks (Service No., Workorder, Status, dst) HARUS pakai
//    nilai mentah "v" sebagai utama. Jika dipakai "f" (formatted) dan sel
//    tersebut bertipe angka, Google Sheets bisa menambahkan pemisah ribuan
//    (mis. "122,101,280,048") yang akan MERUSAK nomor Service No asli.
//  - Field tanggal HANYA memakai "v" mentah untuk tujuan PARSING (lihat
//    parseLooseDate). Untuk fallback TAMPILAN saat parsing gagal total,
//    field tanggal justru harus pakai "f" (format manusiawi), supaya tidak
//    pernah menampilkan teks mentah "Date(2026,4,1)" ke pengguna.

function rawCellValue(cell) {
  if (!cell) return "";
  if (cell.v == null) return "";
  return cell.v;
}

// Tampilan untuk field identitas/teks/angka: utamakan v mentah (dikonversi
// ke string apa adanya, tanpa pemisah ribuan), baru fallback ke f.
function textDisplay(cell) {
  if (!cell) return "";
  if (cell.v != null && cell.v !== "") return String(cell.v);
  if (cell.f != null && cell.f !== "") return cell.f;
  return "";
}

// Tampilan fallback untuk field tanggal SAJA: utamakan f (manusiawi), baru
// fallback ke v mentah.
function dateFallbackDisplay(cell) {
  if (!cell) return "";
  if (cell.f != null && cell.f !== "") return cell.f;
  if (cell.v != null && cell.v !== "") return String(cell.v);
  return "";
}

// ----- Deteksi baris header berdasarkan ISI, bukan posisi --------------

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

/**
 * Mencari baris header yang sesungguhnya dengan mencocokkan ISI selnya
 * terhadap daftar alias kolom yang kita butuhkan -- BUKAN dengan asumsi
 * "baris pertama = header". Ini menangani sheet yang punya baris
 * judul/section di atas baris header asli (terkonfirmasi terjadi pada
 * sheet sumber dashboard ini: baris 1 berisi label seperti "UPDATE MANUAL" /
 * "DATA AREA", baris 2 baru berisi header kolom sebenarnya).
 *
 * Memindai sampai 25 baris pertama dan memilih baris dengan jumlah
 * kecocokan field terbanyak.
 */
function detectHeaderRow(cols, rows) {
  // Jalur cepat: kalau gviz sendiri sudah berhasil menebak header dengan baik
  // (kasus sheet "normal" tanpa baris judul ekstra), pakai itu langsung.
  const colsLabelTexts = cols.map((c) => (c && c.label) || "");
  if (countFieldMatches(colsLabelTexts) >= MIN_REQUIRED_FIELD_MATCHES) {
    return { headerTexts: colsLabelTexts, dataRows: rows };
  }

  const SCAN_LIMIT = Math.min(rows.length, 25);
  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < SCAN_LIMIT; i++) {
    const texts = (rows[i].c || []).map((cell) => textDisplay(cell));
    const score = countFieldMatches(texts);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  if (bestIdx !== -1 && bestScore >= MIN_REQUIRED_FIELD_MATCHES) {
    const headerTexts = (rows[bestIdx].c || []).map((cell) => textDisplay(cell));
    return { headerTexts, dataRows: rows.slice(bestIdx + 1) };
  }

  // Tidak ketemu header yang cukup yakin -- kembalikan apa adanya. Pemanggil
  // akan melempar error yang jelas berdasarkan jumlah field yang berhasil
  // dipetakan (lihat fetchSheetRecords).
  return { headerTexts: colsLabelTexts, dataRows: rows, undetected: true };
}

function buildFieldIndex(headerTexts) {
  const byNormalizedLabel = {};
  headerTexts.forEach((label, idx) => {
    const norm = normalizeHeader(label);
    if (norm && !(norm in byNormalizedLabel)) byNormalizedLabel[norm] = idx;
  });

  const fieldIndex = {};
  FIELD_KEYS.forEach((key) => {
    const def = FIELDS[key];
    for (const alias of def.aliases) {
      const norm = normalizeHeader(alias);
      if (norm in byNormalizedLabel) {
        fieldIndex[key] = byNormalizedLabel[norm];
        break;
      }
    }
  });

  const stoIndex = findStoColumnFromTexts(headerTexts);

  return { fieldIndex, stoIndex };
}

async function fetchSheetRecords() {
  const res = await fetch(GVIZ_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Gagal mengambil data spreadsheet (HTTP ${res.status}). Pastikan sheet sudah dibagikan ke "Anyone with the link".`
    );
  }
  const raw = await res.text();

  // Respons gviz dibungkus seperti: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Format respons spreadsheet tidak dikenali. Pastikan link/GID sheet benar.");
  }
  const data = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

  if (data.status === "error") {
    const detail = (data.errors && data.errors[0] && data.errors[0].detailed_message) || "Akses ditolak.";
    throw new Error(`Google Sheets menolak permintaan: ${detail}`);
  }

  const cols = (data.table && data.table.cols) || [];
  const allRows = (data.table && data.table.rows) || [];

  const { headerTexts, dataRows, undetected } = detectHeaderRow(cols, allRows);
  const { fieldIndex, stoIndex } = buildFieldIndex(headerTexts);

  const matchedCount = Object.keys(fieldIndex).length;
  if (undetected || matchedCount < MIN_REQUIRED_FIELD_MATCHES) {
    const missing = FIELD_KEYS.filter((k) => !(k in fieldIndex)).map((k) => FIELDS[k].label);
    throw new Error(
      `Header kolom tidak terdeteksi dengan baik di spreadsheet (hanya ${matchedCount}/${FIELD_KEYS.length} kolom cocok). ` +
        `Kolom yang tidak ketemu: ${missing.join(", ")}. Periksa nama header di sheet atau sesuaikan alias di config/columns.js.`
    );
  }

  const missingFields = FIELD_KEYS.filter((k) => !(k in fieldIndex));

  let records = dataRows.map((row, i) => {
    const c = row.c || [];
    const get = (fieldKey) => {
      const idx = fieldIndex[fieldKey];
      if (idx == null) return { raw: "", display: "" };
      const cell = c[idx];
      const isDateField = FIELDS[fieldKey] && FIELDS[fieldKey].type === "date";
      return {
        raw: rawCellValue(cell),
        display: isDateField ? dateFallbackDisplay(cell) : textDisplay(cell),
      };
    };

    const tanggalOrderBima = get("tanggalOrderBima");
    const tanggalSetting = get("tanggalSetting");
    const tanggalManja = get("tanggalManja");

    const orderDateISO = parseLooseDate(tanggalOrderBima.raw) || parseLooseDate(tanggalOrderBima.display);
    const settingDateISO = parseLooseDate(tanggalSetting.raw) || parseLooseDate(tanggalSetting.display);
    const manjaDateISO = parseLooseDate(tanggalManja.raw) || parseLooseDate(tanggalManja.display);

    const record = {
      id: i,
      tanggalSetting: settingDateISO ? dateToDisplay(settingDateISO) : tanggalSetting.display || "-",
      tanggalOrderBima: orderDateISO ? dateToDisplay(orderDateISO) : tanggalOrderBima.display || "-",
      workorderPsb: get("workorderPsb").display || "-",
      workorderOdpValidation: get("workorderOdpValidation").display || "-",
      serviceNo: get("serviceNo").display || "-",
      crmOrderType: get("crmOrderType").display || "-",
      statusBima: get("statusBima").display || "-",
      tanggalManja: manjaDateISO ? dateToDisplay(manjaDateISO) : tanggalManja.display || "-",
      progress: get("progress").display || "-",
      reguTeknisi: get("reguTeknisi").display || "-",
      statusQc2: get("statusQc2").display || "-",
      orderDateISO,
      settingDateISO,
      orderMonthKey: orderDateISO ? orderDateISO.slice(0, 7) : null,
    };

    if (stoIndex != null) {
      record._sto = textDisplay(c[stoIndex]);
    }

    return record;
  });

  if (STO_FILTER.filterValue && stoIndex != null) {
    const target = normalizeHeader(STO_FILTER.filterValue);
    records = records.filter((r) => normalizeHeader(r._sto) === target);
  }

  // Buang baris yang sama sekali kosong (tidak punya tanggal order maupun service no) --
  // baris semacam ini biasanya hanya baris kosong sisa rentang data di sheet.
  records = records.filter((r) => r.orderDateISO || (r.serviceNo && r.serviceNo !== "-"));

  return { records, missingFields, totalColumns: cols.length };
}

module.exports = { fetchSheetRecords, parseLooseDate, dateToDisplay, detectHeaderRow, buildFieldIndex, countFieldMatches };
