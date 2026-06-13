import { Router } from "express";
import { fetchHtml, parseArchive } from "../lib/scraper";
import { BASE_URL } from "../lib/config";

const router = Router();

async function animeByParams(params: URLSearchParams, page: number) {
  const pageNum = page > 1 ? page : 1;
  const basePath = pageNum > 1 ? `${BASE_URL}/anime/page/${pageNum}/` : `${BASE_URL}/anime/`;
  const qs = params.toString();
  const url = qs ? `${basePath}?${qs}` : basePath;
  return parseArchive(await fetchHtml(url));
}

/**
 * @openapi
 * /api/filter/genre/{slug}:
 *   get:
 *     summary: Anime by genre
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anime list
 */
router.get("/genre/:slug", async (req, res) => {
  try {
    const p = new URLSearchParams();
    p.append("genre[]", req.params.slug);
    res.json({ success: true, data: await animeByParams(p, Number(req.query.page) || 1) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * @openapi
 * /api/filter/latest:
 *   get:
 *     summary: Latest updated anime
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anime list
 */
router.get("/latest", async (req, res) => {
  try {
    const p = new URLSearchParams({ order: "update" });
    res.json({ success: true, data: await animeByParams(p, Number(req.query.page) || 1) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * @openapi
 * /api/filter/popular:
 *   get:
 *     summary: Popular anime
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anime list
 */
router.get("/popular", async (req, res) => {
  try {
    const p = new URLSearchParams({ order: "popular" });
    res.json({ success: true, data: await animeByParams(p, Number(req.query.page) || 1) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * @openapi
 * /api/filter/rating:
 *   get:
 *     summary: Top rated anime
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anime list
 */
router.get("/rating", async (req, res) => {
  try {
    const p = new URLSearchParams({ order: "rating" });
    res.json({ success: true, data: await animeByParams(p, Number(req.query.page) || 1) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * @openapi
 * /api/filter/ongoing:
 *   get:
 *     summary: Ongoing anime
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anime list
 */
router.get("/ongoing", async (req, res) => {
  try {
    const p = new URLSearchParams({ status: "ongoing" });
    res.json({ success: true, data: await animeByParams(p, Number(req.query.page) || 1) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * @openapi
 * /api/filter/completed:
 *   get:
 *     summary: Completed anime
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anime list
 */
router.get("/completed", async (req, res) => {
  try {
    const p = new URLSearchParams({ status: "completed" });
    res.json({ success: true, data: await animeByParams(p, Number(req.query.page) || 1) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

/**
 * @openapi
 * /api/filter/upcoming:
 *   get:
 *     summary: Upcoming anime
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Anime list
 */
router.get("/upcoming", async (req, res) => {
  try {
    const p = new URLSearchParams({ status: "upcoming" });
    res.json({ success: true, data: await animeByParams(p, Number(req.query.page) || 1) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
