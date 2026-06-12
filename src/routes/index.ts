import { Router, Request, Response } from 'express';
import { animeRoutes, searchAnime, listGenres, listStudios, listSeasons } from './anime.routes';
import { episodeRoutes } from './episode.routes';

const router = Router();

router.use('/anime', animeRoutes);
router.use('/episode', episodeRoutes);

/**
 * @openapi
 * /api/search:
 *   get:
 *     tags: [Search]
 *     summary: Search anime by keyword
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         example: slime
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Paginated search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAnimeList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/search', searchAnime);

/**
 * @openapi
 * /api/genres:
 *   get:
 *     tags: [Filters]
 *     summary: Get all genres
 *     responses:
 *       200:
 *         description: Genre list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/genres', listGenres);

/**
 * @openapi
 * /api/studios:
 *   get:
 *     tags: [Filters]
 *     summary: Get all studios
 *     responses:
 *       200:
 *         description: Studio list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/studios', listStudios);

/**
 * @openapi
 * /api/seasons:
 *   get:
 *     tags: [Filters]
 *     summary: Get all seasons
 *     responses:
 *       200:
 *         description: Season list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/seasons', listSeasons);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export { router as apiRoutes };
