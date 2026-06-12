import { Router } from 'express';
import { listAnime, getAnime } from '../controllers/anime.controller';

const router = Router();

/**
 * @openapi
 * /api/anime:
 *   get:
 *     tags: [Anime]
 *     summary: Get anime list with optional filters
 *     operationId: listAnime
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         example: 1
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         example: slime
 *       - in: query
 *         name: genre
 *         schema: { type: string }
 *         example: isekai
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ongoing, completed]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [tv, movie, ova, ona]
 *       - in: query
 *         name: studio
 *         schema: { type: string }
 *         example: 8bit
 *       - in: query
 *         name: season
 *         schema: { type: string }
 *         example: spring-2026
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, oldest, title-asc, title-desc]
 *     responses:
 *       200:
 *         description: Paginated anime list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAnimeList'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', listAnime);

/**
 * @openapi
 * /api/anime/{animeId}:
 *   get:
 *     tags: [Anime]
 *     summary: Get anime detail by slug
 *     operationId: getAnimeDetail
 *     parameters:
 *       - in: path
 *         name: animeId
 *         required: true
 *         schema: { type: string }
 *         example: tensei-shitara-slime-datta-ken-4th-season
 *     responses:
 *       200:
 *         description: Anime detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnimeDetailResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:animeId([a-z0-9][a-z0-9-]*[a-z0-9])', getAnime);

export { router as animeRoutes };
