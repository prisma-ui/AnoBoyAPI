import { Router } from "express";
import { fetchHtml, parseArchive } from "../lib/scraper";
import { BASE_URL } from "../lib/config";

const router = Router();

/**
 * @openapi
 * /api/anime:
 *   get:
 *     summary: Browse/search anime list with filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre slug (can repeat as genre[])
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *       - in: query
 *         name: studio
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: ongoing | completed | upcoming | hiatus
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: tv | ova | movie | special | bd | ona | music
 *       - in: query
 *         name: sub
 *         schema:
 *           type: string
 *         description: sub | dub | raw
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: title | titlereverse | update | latest | popular | rating
 *     responses:
 *       200:
 *         description: Anime list
 */
router.get("/", async (req, res) => {
  try {
    const { page, genre, season, studio, status, type, sub, order } = req.query;

    const params = new URLSearchParams();
    const appendMulti = (key: string, val: any) => {
      if (!val) return;
      const arr = Array.isArray(val) ? val : [val];
      arr.forEach((v) => params.append(`${key}[]`, String(v)));
    };
    appendMulti("genre", genre);
    appendMulti("season", season);
    appendMulti("studio", studio);
    if (status) params.append("status", String(status));
    if (type) params.append("type", String(type));
    if (sub) params.append("sub", String(sub));
    if (order) params.append("order", String(order));

    const pageNum = page ? Number(page) : 1;
    const basePath = pageNum > 1 ? `${BASE_URL}/anime/page/${pageNum}/` : `${BASE_URL}/anime/`;
    const qs = params.toString();
    const url = qs ? `${basePath}?${qs}` : basePath;

    const html = await fetchHtml(url);
    const data = parseArchive(html);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
