import { fetchTeknisiHadir } from "../../lib/sheetTeknisi";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    const data = await fetchTeknisiHadir();
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({
      ok: false,
      names: [],
      total: 0,
      error: err.message || "Gagal mengambil data teknisi.",
    });
  }
}
