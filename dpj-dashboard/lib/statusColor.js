const FALLBACK_PALETTE = ["#60a5fa", "#c084fc", "#f472b6", "#fb923c", "#a3e635", "#2dd4bf"];

function statusColor(status, compworkValues) {
  const s = String(status || "").trim().toUpperCase();
  if (!s || s === "TANPA STATUS") return "var(--text-faint)";
  if (compworkValues.some((v) => v.toUpperCase() === s)) return "var(--success)";
  // CANCLWORK adalah singkatan nyata yang dipakai di Status BIMA (bukan "CANCEL").
  if (/(CANCEL|CANCL|BATAL|REJECT|GAGAL|FAIL)/.test(s)) return "var(--danger)";
  if (/(PENDING|TUNDA|HOLD|OPEN|NEW|BELUM|WAPPR|APPROV)/.test(s)) return "var(--warning)";
  if (/(PROGRESS|PROSES|ONPROCESS|ON PROGRESS|ASSIGN)/.test(s)) return "var(--accent)";
  // fallback berdasarkan hash sederhana agar konsisten untuk status yang sama
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

module.exports = { statusColor };
