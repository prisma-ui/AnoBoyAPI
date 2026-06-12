import { scrapeEpisodeDetail, scrapeEpisodeByUrl } from '../scrapers/episode.scraper';
import { getCache, setCache } from '../utils/cache';
import { config } from '../config/env';
import { EpisodeDetail, ApiResponse } from '../types';

export async function getEpisodeById(
  episodeId: string
): Promise<ApiResponse<EpisodeDetail> & { cached: boolean }> {
  const cacheKey = `episode:${episodeId}`;
  const cached = await getCache<EpisodeDetail>(cacheKey);

  if (cached) {
    return { success: true, source: 'anoboy', cached: true, data: cached };
  }

  const detail = await scrapeEpisodeDetail(episodeId);
  await setCache(cacheKey, detail, config.cache.episodeDetail);

  return { success: true, source: 'anoboy', cached: false, data: detail };
}

export async function getEpisodeByUrl(
  url: string
): Promise<ApiResponse<EpisodeDetail> & { cached: boolean }> {
  const cacheKey = `episode:url:${Buffer.from(url).toString('base64')}`;
  const cached = await getCache<EpisodeDetail>(cacheKey);

  if (cached) {
    return { success: true, source: 'anoboy', cached: true, data: cached };
  }

  const detail = await scrapeEpisodeByUrl(url);
  await setCache(cacheKey, detail, config.cache.episodeDetail);

  return { success: true, source: 'anoboy', cached: false, data: detail };
}
