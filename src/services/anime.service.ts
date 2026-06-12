import { scrapeAnimeList, scrapeAnimeDetail, scrapeFilters } from '../scrapers/anime.scraper';
import { getCache, setCache } from '../utils/cache';
import { config } from '../config/env';
import { AnimeCard, AnimeDetail, AnimeListQuery, PaginatedResponse, ApiResponse, FilterItem } from '../types';

export async function getAnimeList(
  query: AnimeListQuery
): Promise<PaginatedResponse<AnimeCard> & { cached: boolean }> {
  const cacheKey = `anime:list:${JSON.stringify(query)}`;
  const cached = await getCache<PaginatedResponse<AnimeCard>>(cacheKey);

  if (cached) {
    return { ...cached, cached: true };
  }

  const { items, pagination } = await scrapeAnimeList(query);

  const result: PaginatedResponse<AnimeCard> = {
    success: true,
    source: 'anoboy',
    cached: false,
    currentPage: pagination.currentPage,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
    nextPage: pagination.nextPage,
    prevPage: pagination.prevPage,
    resultsPerPage: pagination.resultsPerPage,
    totalResults: null,
    data: items,
  };

  await setCache(cacheKey, result, config.cache.animeList);
  return { ...result, cached: false };
}

export async function getAnimeDetail(
  animeId: string
): Promise<ApiResponse<AnimeDetail> & { cached: boolean }> {
  const cacheKey = `anime:detail:${animeId}`;
  const cached = await getCache<AnimeDetail>(cacheKey);

  if (cached) {
    return { success: true, source: 'anoboy', cached: true, data: cached };
  }

  const detail = await scrapeAnimeDetail(animeId);
  await setCache(cacheKey, detail, config.cache.animeDetail);

  return { success: true, source: 'anoboy', cached: false, data: detail };
}

export async function getGenres(): Promise<ApiResponse<FilterItem[]> & { cached: boolean }> {
  const cacheKey = 'filters:genres';
  const cached = await getCache<FilterItem[]>(cacheKey);

  if (cached) {
    return { success: true, source: 'anoboy', cached: true, data: cached };
  }

  const genres = await scrapeFilters('genre');
  await setCache(cacheKey, genres, config.cache.genres);

  return { success: true, source: 'anoboy', cached: false, data: genres };
}

export async function getStudios(): Promise<ApiResponse<FilterItem[]> & { cached: boolean }> {
  const cacheKey = 'filters:studios';
  const cached = await getCache<FilterItem[]>(cacheKey);

  if (cached) {
    return { success: true, source: 'anoboy', cached: true, data: cached };
  }

  const studios = await scrapeFilters('studio');
  await setCache(cacheKey, studios, config.cache.studios);

  return { success: true, source: 'anoboy', cached: false, data: studios };
}

export async function getSeasons(): Promise<ApiResponse<FilterItem[]> & { cached: boolean }> {
  const cacheKey = 'filters:seasons';
  const cached = await getCache<FilterItem[]>(cacheKey);

  if (cached) {
    return { success: true, source: 'anoboy', cached: true, data: cached };
  }

  const seasons = await scrapeFilters('season');
  await setCache(cacheKey, seasons, config.cache.seasons);

  return { success: true, source: 'anoboy', cached: false, data: seasons };
}

export async function getStatuses(): Promise<ApiResponse<FilterItem[]> & { cached: boolean }> {
  const cacheKey = 'filters:statuses';
  const cached = await getCache<FilterItem[]>(cacheKey);
  if (cached) return { success: true, source: 'anoboy', cached: true, data: cached };
  const data = await scrapeFilters('status');
  await setCache(cacheKey, data, config.cache.genres);
  return { success: true, source: 'anoboy', cached: false, data };
}

export async function getTypes(): Promise<ApiResponse<FilterItem[]> & { cached: boolean }> {
  const cacheKey = 'filters:types';
  const cached = await getCache<FilterItem[]>(cacheKey);
  if (cached) return { success: true, source: 'anoboy', cached: true, data: cached };
  const data = await scrapeFilters('type');
  await setCache(cacheKey, data, config.cache.genres);
  return { success: true, source: 'anoboy', cached: false, data };
}

export async function getSubs(): Promise<ApiResponse<FilterItem[]> & { cached: boolean }> {
  const cacheKey = 'filters:subs';
  const cached = await getCache<FilterItem[]>(cacheKey);
  if (cached) return { success: true, source: 'anoboy', cached: true, data: cached };
  const data = await scrapeFilters('sub');
  await setCache(cacheKey, data, config.cache.genres);
  return { success: true, source: 'anoboy', cached: false, data };
}

export async function getSortOptions(): Promise<ApiResponse<FilterItem[]> & { cached: boolean }> {
  const cacheKey = 'filters:sort';
  const cached = await getCache<FilterItem[]>(cacheKey);
  if (cached) return { success: true, source: 'anoboy', cached: true, data: cached };
  const data = await scrapeFilters('order');
  await setCache(cacheKey, data, config.cache.genres);
  return { success: true, source: 'anoboy', cached: false, data };
}
