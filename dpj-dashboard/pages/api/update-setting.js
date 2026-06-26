// pages/api/update-setting.js
// API route untuk update Tanggal Setting (dan opsional QC2) per baris order

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { workorderPsb, tanggalSetting, statusQc2 } = req.body || {};

  if (!workorderPsb) {
    return res.status(400).json({ ok: false, message: "workorderPsb wajib diisi." });
  }

  if (tanggalSetting === undefined && statusQc2 === undefined) {
    return res.status(400).json({ ok: false, message: "tanggalSetting atau statusQc2 harus diisi minimal satu." });
  }

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({ ok: false, message: "APPS_SCRIPT_URL belum dikonfigurasi di environment variable." });
  }

  try {
    const payload = { workorderPsb };
    if (tanggalSetting !== undefined) payload.tanggalSetting = tanggalSetting;
    if (statusQc2 !== undefined) payload.statusQc2 = statusQc2;

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!response.ok || data.ok === false) {
      return res.status(500).json({ ok: false, message: data.message || "Gagal update ke spreadsheet." });
    }

    return res.status(200).json({ ok: true, message: "Data berhasil diperbarui.", ...data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || "Terjadi kesalahan." });
  }
}
