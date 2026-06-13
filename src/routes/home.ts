import { Router } from "express";
import { fetchHtml, parseHome } from "../lib/scraper";
import { BASE_URL } from "../lib/config";

const router = Router();

/**
 * @openapi
 * /api/home:
 *   get:
 *     summary: Get homepage data (latest releases + recommendations)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for latest releases
 *     responses:
 *       200:
 *         description: Homepage data
 */
router.get("/", async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const url = page > 1 ? `${BASE_URL}/page/${page}/` : `${BASE_URL}/`;
    const html = await fetchHtml(url);
    const data = parseHome(html);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
