// Normalisasi teks header agar pencocokan nama kolom tidak sensitif terhadap
// spasi ganda, huruf besar/kecil, titik, atau tanda baca kecil lainnya.
function normalizeHeader(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

module.exports = { normalizeHeader };
