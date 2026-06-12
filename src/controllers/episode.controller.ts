import { Request, Response, NextFunction } from 'express';
import { getEpisodeById, getEpisodeByUrl } from '../services/episode.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getEpisode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const url = req.query.url as string | undefined;

    if (url) {
      const result = await getEpisodeByUrl(url);
      sendSuccess(res, result.data, result.cached);
      return;
    }

    if (!id) {
      sendError(res, 'Episode ID or url query parameter is required', 400);
      return;
    }

    const result = await getEpisodeById(id);
    if (!result.data.title) {
      sendError(res, 'Episode not found', 404);
      return;
    }

    sendSuccess(res, result.data, result.cached);
  } catch (err) {
    next(err);
  }
}
