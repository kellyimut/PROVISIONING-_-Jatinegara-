// pages/api/update-setting.js
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  const { workorderPsb, tanggalSetting, statusQc2, reguTeknisi, statusBima, progress } = req.body || {};

  if (!workorderPsb) return res.status(400).json({ ok: false, message: "workorderPsb wajib diisi." });
  if (!tanggalSetting && !statusQc2 && !reguTeknisi && !statusBima && !progress)
    return res.status(400).json({ ok: false, message: "Minimal satu field harus diisi." });

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) return res.status(500).json({ ok: false, message: "APPS_SCRIPT_URL belum dikonfigurasi." });

  try {
    const payload = { workorderPsb };
    if (tanggalSetting !== undefined) payload.tanggalSetting = tanggalSetting;
    if (statusQc2      !== undefined) payload.statusQc2      = statusQc2;
    if (reguTeknisi    !== undefined) payload.reguTeknisi    = reguTeknisi;
    if (statusBima     !== undefined) payload.statusBima     = statusBima;
    if (progress       !== undefined) payload.progress       = progress;

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!response.ok || data.ok === false)
      return res.status(500).json({ ok: false, message: data.message || "Gagal update ke spreadsheet." });

    return res.status(200).json({ ok: true, message: "Data berhasil diperbarui.", ...data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || "Terjadi kesalahan." });
  }
}
