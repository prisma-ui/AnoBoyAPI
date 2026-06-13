import { Router } from "express";
import { fetchHtml, parseGenre, parseGenreList } from "../lib/scraper";
import { BASE_URL } from "../lib/config";

const router = Router();

/**
 * @openapi
 * /api/genres:
 *   get:
 *     summary: Get all available genres
 *     responses:
 *       200:
 *         description: List of genres with name and slug
 */
router.get("/", async (_req, res) => {
  try {
    const html = await fetchHtml(`${BASE_URL}/anime/`);
    const data = parseGenreList(html);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @openapi
 * /api/genres/{slug}:
 *   get:
 *     summary: Get anime list by genre
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Anime list filtered by genre
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const page = req.query.page ? Number(req.query.page) : 1;
    const url =
      page > 1
        ? `${BASE_URL}/genres/${slug}/page/${page}/`
        : `${BASE_URL}/genres/${slug}/`;
    const html = await fetchHtml(url);
    const data = parseGenre(html);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
