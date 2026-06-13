import { Router } from "express";
import { fetchHtml, parseArchive } from "../lib/scraper";
import { BASE_URL } from "../lib/config";

const router = Router();

/**
 * @openapi
 * /api/az-list:
 *   get:
 *     summary: Get AZ-list anime (alphabetical browse)
 *     parameters:
 *       - in: query
 *         name: show
 *         schema:
 *           type: string
 *         description: "Letter filter: . | 0-9 | A-Z"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: AZ list results
 */
router.get("/", async (req, res) => {
  try {
    const show = req.query.show ? String(req.query.show) : null;
    const page = req.query.page ? Number(req.query.page) : 1;

    const basePath = page > 1 ? `${BASE_URL}/az-list/page/${page}/` : `${BASE_URL}/az-list/`;
    const url = show ? `${basePath}?show=${encodeURIComponent(show)}` : basePath;

    const html = await fetchHtml(url);
    const data = parseArchive(html);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
