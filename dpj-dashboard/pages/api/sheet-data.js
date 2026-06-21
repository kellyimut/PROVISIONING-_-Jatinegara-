import { fetchSheetRecords } from "../../lib/sheet";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    const { records, missingFields, gidUsed } = await fetchSheetRecords();
    res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      count: records.length,
      gidUsed,
      missingFields,
      records,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err && err.message ? err.message : "Terjadi kesalahan saat mengambil data.",
    });
  }
}
