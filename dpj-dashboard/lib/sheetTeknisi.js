// Mengambil daftar teknisi hadir dari sheet "TEKNISI HARI INI"
// Struktur sheet:
//   Baris 1: (kosong atau judul)
//   Baris 2: "TEKNISI HADIR HARI INI"
//   Baris 3: tanggal
//   Baris 4: (kosong)
//   Baris 5+: nama teknisi satu per kolom A, sampai baris kosong

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1OrlF3MSls5P9IPRcx3yHgFgWRVlAQPMzkgDSlvlMpEk";

// Cari GID sheet berdasarkan nama tab dari HTML spreadsheet
async function findGidBySheetName(targetName) {
  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const html = await res.text();

    // Pola di HTML Google Sheets: nama sheet ada di dekat gid-nya
    // Format: "name":"TEKNISI HARI INI","index":...,"sheetId":12345
    const normTarget = targetName.trim().toLowerCase();

    // Cari semua blok sheet info
    const sheetBlocks = html.matchAll(/"sheetId"\s*:\s*(\d+)[^}]*?"title"\s*:\s*"([^"]+)"/g);
    for (const m of sheetBlocks) {
      if (m[2].trim().toLowerCase() === normTarget) return m[1];
    }

    // Fallback: cari pola lain "title":"...","index":...,"sheetId":...
    const re2 = /"title"\s*:\s*"([^"]+)"[^}]*?"sheetId"\s*:\s*(\d+)/g;
    let m2;
    while ((m2 = re2.exec(html)) !== null) {
      if (m2[1].trim().toLowerCase() === normTarget) return m2[2];
    }

    return null;
  } catch {
    return null;
  }
}

// Parser CSV sederhana — ambil kolom A saja
function parseCsvColA(text, maxRows = 50) {
  const lines = text.split(/\r?\n/).slice(0, maxRows);
  return lines.map((line) => {
    // Kolom A: ambil sampai koma pertama, hilangkan tanda kutip
    const raw = line.split(",")[0] || "";
    return raw.replace(/^"|"$/g, "").trim();
  });
}

async function fetchTeknisiHadir() {
  // 1. Cari GID sheet "TEKNISI HARI INI"
  const gid = await findGidBySheetName("TEKNISI HARI INI");
  if (!gid) {
    return { names: [], total: 0, error: "Sheet 'TEKNISI HARI INI' tidak ditemukan." };
  }

  // 2. Ambil via CSV (paling sederhana, semua teks)
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return { names: [], total: 0, error: `Gagal mengambil data teknisi (HTTP ${res.status}).` };
  }

  const text = await res.text();
  const colA = parseCsvColA(text, 60);

  // Ambil nama teknisi: baris yang mengandung " | " (pola "JTN | NAMA")
  // Abaikan baris judul, tanggal, kosong
  const names = colA.filter((v) => v.includes("|") || (v.length > 3 && !/^\d/.test(v) && !v.toUpperCase().includes("TEKNISI") && !v.toUpperCase().includes("MINGGU") && !v.toUpperCase().includes("SENIN") && !v.toUpperCase().includes("SELASA") && !v.toUpperCase().includes("RABU") && !v.toUpperCase().includes("KAMIS") && !v.toUpperCase().includes("JUMAT") && !v.toUpperCase().includes("SABTU") && !v.toUpperCase().includes("HADIR") && !v.toUpperCase().includes("HARI")));

  // Lebih aman: ambil HANYA baris yang punya format "XXX | NAMA" atau minimal ada huruf panjang
  const teknisiNames = colA.filter((v) => /[A-Z]{2,}\s*\|\s*[A-Z]{2,}/i.test(v));

  // Jika pola JTN|NAMA tidak ditemukan, fallback ke semua baris non-kosong
  // setelah melewati 4 baris pertama (judul, tanggal, kosong)
  const result = teknisiNames.length > 0
    ? teknisiNames
    : colA.slice(4).filter((v) => v.length > 2);

  return { names: result, total: result.length, gid };
}

module.exports = { fetchTeknisiHadir };
