// Mengambil daftar teknisi hadir dari sheet "TEKNISI HARI INI"
// Struktur sheet:
//   Baris 1: (kosong)
//   Baris 2: "TEKNISI HADIR HARI INI"
//   Baris 3: tanggal
//   Baris 4: (kosong)
//   Baris 5+: nama teknisi di kolom A (format "JTN | NAMA")

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1OrlF3MSls5P9IPRcx3yHgFgWRVlAQPMzkgDSlvlMpEk";

// GID sheet "TEKNISI HARI INI" — dikonfirmasi dari URL spreadsheet
// https://docs.google.com/spreadsheets/d/.../edit?gid=1786853045
const TEKNISI_GID = process.env.GOOGLE_TEKNISI_GID || "1786853045";

function parseCsvColA(text, maxRows = 60) {
  const lines = text.split(/\r?\n/).slice(0, maxRows);
  return lines.map((line) => {
    const raw = line.split(",")[0] || "";
    return raw.replace(/^"|"$/g, "").trim();
  });
}

async function fetchTeknisiHadir() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${TEKNISI_GID}`;
  
  let res;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (err) {
    return { names: [], total: 0, error: `Gagal koneksi ke spreadsheet: ${err.message}` };
  }

  if (!res.ok) {
    return { names: [], total: 0, error: `Gagal mengambil data teknisi (HTTP ${res.status}).` };
  }

  const text = await res.text();
  const colA = parseCsvColA(text, 60);

  // Ambil HANYA baris yang punya format "XXX | NAMA" — pola terkonfirmasi dari sheet
  const teknisiNames = colA.filter((v) => /[A-Z]{2,}\s*\|\s*[A-Z]{2,}/i.test(v));

  // Fallback: jika pola JTN|NAMA tidak ada, ambil semua baris non-kosong setelah baris 4
  const result = teknisiNames.length > 0
    ? teknisiNames
    : colA.slice(4).filter((v) => v.length > 2 && !/^\d/.test(v));

  return { names: result, total: result.length };
}

module.exports = { fetchTeknisiHadir };
