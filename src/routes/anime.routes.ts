import { Router } from 'express';
import {
  listAnime, getAnime, searchAnime,
  listGenres, listStudios, listSeasons,
  listStatuses, listTypes, listSubs, listSortOptions,
} from '../controllers/anime.controller';

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
 *         schema: { type: string, enum: [ongoing, completed, upcoming, hiatus] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [tv, movie, ova, ona, special, bd, music] }
 *       - in: query
 *         name: studio
 *         schema: { type: string }
 *         example: 8bit
 *       - in: query
 *         name: season
 *         schema: { type: string }
 *         example: spring-2026
 *       - in: query
 *         name: sub
 *         schema: { type: string, enum: [sub, dub, raw] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [title, titlereverse, update, latest, popular, rating] }
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
 * /api/anime/search:
 *   get:
 *     tags: [Anime]
 *     summary: Search anime by keyword
 *     operationId: searchAnime
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
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/search', searchAnime);

/**
 * @openapi
 * /api/anime/filters/genres:
 *   get:
 *     tags: [Filters]
 *     summary: Get all available genres
 *     operationId: listGenres
 *     responses:
 *       200:
 *         description: List of genres
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/filters/genres', listGenres);

/**
 * @openapi
 * /api/anime/filters/studios:
 *   get:
 *     tags: [Filters]
 *     summary: Get all available studios
 *     operationId: listStudios
 *     responses:
 *       200:
 *         description: List of studios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/filters/studios', listStudios);

/**
 * @openapi
 * /api/anime/filters/seasons:
 *   get:
 *     tags: [Filters]
 *     summary: Get all available seasons
 *     operationId: listSeasons
 *     responses:
 *       200:
 *         description: List of seasons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/filters/seasons', listSeasons);

/**
 * @openapi
 * /api/anime/filters/statuses:
 *   get:
 *     tags: [Filters]
 *     summary: Get all available statuses
 *     operationId: listStatuses
 *     responses:
 *       200:
 *         description: List of statuses
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/filters/statuses', listStatuses);

/**
 * @openapi
 * /api/anime/filters/types:
 *   get:
 *     tags: [Filters]
 *     summary: Get all available types
 *     operationId: listTypes
 *     responses:
 *       200:
 *         description: List of types
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/filters/types', listTypes);

/**
 * @openapi
 * /api/anime/filters/subs:
 *   get:
 *     tags: [Filters]
 *     summary: Get all available subtitle types
 *     operationId: listSubs
 *     responses:
 *       200:
 *         description: List of sub types
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/filters/subs', listSubs);

/**
 * @openapi
 * /api/anime/filters/sort:
 *   get:
 *     tags: [Filters]
 *     summary: Get all available sort options
 *     operationId: listSortOptions
 *     responses:
 *       200:
 *         description: List of sort options
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterListResponse'
 */
router.get('/filters/sort', listSortOptions);

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
