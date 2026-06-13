import { Router } from "express";
import { fetchHtml, parseAnimeDetail } from "../lib/scraper";
import { BASE_URL } from "../lib/config";

const router = Router();

/**
 * @openapi
 * /api/anime/{slug}:
 *   get:
 *     summary: Get anime detail (info, synopsis, episode list)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Anime detail
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const url = `${BASE_URL}/anime/${slug}/`;
    const html = await fetchHtml(url);
    const data = parseAnimeDetail(html);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
