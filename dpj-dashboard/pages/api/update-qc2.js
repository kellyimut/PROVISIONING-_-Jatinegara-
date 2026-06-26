// pages/api/update-qc2.js
// API route Next.js — menerima request update STATUS QC2 dari dashboard,
// lalu forward ke Google Apps Script Web App yang sudah dipasang di Spreadsheet.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { workorderPsb, statusQc2 } = req.body || {};

  if (!workorderPsb || statusQc2 === undefined) {
    return res.status(400).json({ ok: false, message: "workorderPsb dan statusQc2 wajib diisi." });
  }

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({ ok: false, message: "APPS_SCRIPT_URL belum dikonfigurasi di environment variable." });
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workorderPsb, statusQc2 }),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!response.ok || data.ok === false) {
      return res.status(500).json({ ok: false, message: data.message || "Gagal update ke spreadsheet." });
    }

    return res.status(200).json({ ok: true, message: "STATUS QC2 berhasil diperbarui.", ...data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || "Terjadi kesalahan saat menghubungi Apps Script." });
  }
}
