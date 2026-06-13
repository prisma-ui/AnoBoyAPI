import { Router } from "express";
import { fetchHtml, parseArchive } from "../lib/scraper";
import { BASE_URL } from "../lib/config";

const router = Router();

/**
 * @openapi
 * /api/search:
 *   get:
 *     summary: Search anime
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "Query param 'q' is required" });
    }
    const page = req.query.page ? Number(req.query.page) : 1;
    const basePath = `${BASE_URL}/search/${encodeURIComponent(q)}/`;
    const url = page > 1 ? `${basePath}page/${page}/` : basePath;

    const html = await fetchHtml(url);
    const data = parseArchive(html);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
