import { Router } from "express";
import { fetchHtml, parseEpisodeDetail } from "../lib/scraper";
import { BASE_URL } from "../lib/config";

const router = Router();

/**
 * @openapi
 * /api/episode/{slug}:
 *   get:
 *     summary: Get episode detail (stream sources, mirrors, downloads, navigation)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Episode detail
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const url = `${BASE_URL}/${slug}/`;
    const html = await fetchHtml(url);
    const data = parseEpisodeDetail(html);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
