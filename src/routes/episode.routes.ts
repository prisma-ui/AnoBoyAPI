import { Router } from 'express';
import { getEpisode } from '../controllers/episode.controller';

const router = Router();

/**
 * @openapi
 * /api/episode/{id}:
 *   get:
 *     tags: [Episode]
 *     summary: Get episode detail by ID
 *     operationId: getEpisodeById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: "15836"
 *       - in: query
 *         name: url
 *         schema: { type: string }
 *         description: Direct episode URL (alternative to id)
 *     responses:
 *       200:
 *         description: Episode detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EpisodeDetailResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', getEpisode);

/**
 * @openapi
 * /api/episode:
 *   get:
 *     tags: [Episode]
 *     summary: Get episode detail by URL
 *     operationId: getEpisodeByUrl
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema: { type: string }
 *         example: https://anoboy.be/some-episode-slug/
 *     responses:
 *       200:
 *         description: Episode detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EpisodeDetailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/', getEpisode);

export { router as episodeRoutes };
