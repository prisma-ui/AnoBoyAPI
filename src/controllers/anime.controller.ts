import { Request, Response, NextFunction } from 'express';
import { getAnimeList, getAnimeDetail, getGenres, getStudios, getSeasons, getStatuses, getTypes, getSubs, getSortOptions } from '../services/anime.service';
import { sendPaginated, sendSuccess, sendError } from '../utils/response';
import { AnimeListQuery } from '../types';

export async function listAnime(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query: AnimeListQuery = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      search: req.query.search as string | undefined,
      genre: req.query.genre as string | undefined,
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      studio: req.query.studio as string | undefined,
      season: req.query.season as string | undefined,
      sort: req.query.sort as string | undefined,
      sub: req.query.sub as string | undefined,
    };

    const result = await getAnimeList(query);
    sendPaginated(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getAnime(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { animeId } = req.params;
    if (!animeId) {
      sendError(res, 'animeId is required', 400);
      return;
    }

    const result = await getAnimeDetail(animeId);
    if (!result.data.title) {
      sendError(res, 'Anime not found', 404);
      return;
    }

    sendSuccess(res, result.data, result.cached);
  } catch (err) {
    next(err);
  }
}

export async function searchAnime(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query.q as string;
    if (!q) {
      sendError(res, 'q parameter is required', 400);
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const result = await getAnimeList({ search: q, page });
    sendPaginated(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listGenres(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getGenres();
    sendSuccess(res, result.data, result.cached);
  } catch (err) {
    next(err);
  }
}

export async function listStudios(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getStudios();
    sendSuccess(res, result.data, result.cached);
  } catch (err) {
    next(err);
  }
}

export async function listSeasons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getSeasons();
    sendSuccess(res, result.data, result.cached);
  } catch (err) {
    next(err);
  }
}

export async function listStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const r = await getStatuses(); sendSuccess(res, r.data, r.cached); } catch (err) { next(err); }
}

export async function listTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const r = await getTypes(); sendSuccess(res, r.data, r.cached); } catch (err) { next(err); }
}

export async function listSubs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const r = await getSubs(); sendSuccess(res, r.data, r.cached); } catch (err) { next(err); }
}

export async function listSortOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const r = await getSortOptions(); sendSuccess(res, r.data, r.cached); } catch (err) { next(err); }
}
