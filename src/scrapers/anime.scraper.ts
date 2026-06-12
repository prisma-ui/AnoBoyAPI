import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { fetchPage } from '../utils/httpClient';
import { extractSlugFromUrl, normalizeFilterSlug } from '../utils/slugify';
import { AnimeCard, AnimeDetail, Episode, AnimeListQuery } from '../types';
import { config } from '../config/env';

interface PaginationInfo {
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  resultsPerPage: number;
}

interface AnimeListResult {
  items: AnimeCard[];
  pagination: PaginationInfo;
}

function buildAnimeListUrl(query: AnimeListQuery): string {
  const page = query.page ?? 1;
  const hasFilters =
    query.search || query.genre || query.status || query.type || query.studio || query.season || query.sort;

  const params = new URLSearchParams();

  if (query.search) params.set('s', query.search);
  if (query.genre) params.set('genre', query.genre);
  if (query.status) params.set('status', query.status);
  if (query.type) params.set('type', query.type.toLowerCase());
  if (query.studio) params.set('studio', query.studio);
  if (query.season) params.set('season', query.season);
  if (query.sort) params.set('order', query.sort);

  if (hasFilters) {
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return `${config.baseUrl}/${qs ? '?' + qs : ''}`;
  }

  // Plain listing uses /page/ path
  const qs = params.toString();
  if (page > 1) {
    return `${config.baseUrl}/anime/page/${page}/${qs ? '?' + qs : ''}`;
  }
  return `${config.baseUrl}/anime/${qs ? '?' + qs : ''}`;
}

function parsePagination($: cheerio.CheerioAPI, currentPage: number): PaginationInfo {
  let hasNextPage = false;
  let hasPrevPage = currentPage > 1;
  let nextPage: number | null = null;
  let prevPage: number | null = currentPage > 1 ? currentPage - 1 : null;

  // Try multiple pagination selectors
  const nextEl =
    $('a.next.page-numbers').first() ||
    $('a[class*="next"]').first() ||
    $('nav.pagination a[rel="next"]').first();

  const prevEl =
    $('a.prev.page-numbers').first() ||
    $('a[class*="prev"]').first() ||
    $('nav.pagination a[rel="prev"]').first();

  if ($('a.next.page-numbers').length > 0 || $('a[rel="next"]').length > 0) {
    hasNextPage = true;
    nextPage = currentPage + 1;
  }

  if ($('a.prev.page-numbers').length > 0 || $('a[rel="prev"]').length > 0) {
    hasPrevPage = true;
    prevPage = currentPage - 1;
  }

  // Count results
  const resultsPerPage = $('.listupd article').length || $('.bsx').length || 0;

  void nextEl;
  void prevEl;

  return {
    currentPage,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? nextPage ?? currentPage + 1 : null,
    prevPage: hasPrevPage ? prevPage : null,
    resultsPerPage,
  };
}

function parseAnimeCard($: cheerio.CheerioAPI, el: Element): AnimeCard {
  const item = $(el);

  const linkEl = item.find('a').first();
  const url = linkEl.attr('href') || '';
  const animeId = extractSlugFromUrl(url);

  const title =
    item.find('.tt').text().trim() ||
    item.find('h2').text().trim() ||
    item.find('.title').text().trim() ||
    item.find('a').attr('title') ||
    '';

  const thumbnail =
    item.find('img').attr('src') ||
    item.find('img').attr('data-src') ||
    item.find('img').attr('data-lazy-src') ||
    '';

  const statusEl = item.find('[class*="status"]').first();
  const status = statusEl.text().trim() || statusEl.attr('class')?.replace(/status\s*/i, '').trim() || '';

  const typeEl = item.find('[class*="typez"]').first();
  const type = typeEl.text().trim() || typeEl.attr('class')?.replace(/typez\s*/i, '').trim() || '';

  const episode =
    item.find('.epx').text().trim() ||
    item.find('[class*="ep"]').first().text().trim() ||
    '';

  const sub =
    item.find('.sb').text().trim() ||
    item.find('[class*="sub"]').first().text().trim() ||
    'Sub';

  return { animeId, title, url, thumbnail, status, type, episode, sub };
}

export async function scrapeAnimeList(query: AnimeListQuery): Promise<AnimeListResult> {
  const page = query.page ?? 1;
  const url = buildAnimeListUrl(query);
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const items: AnimeCard[] = [];

  // Try multiple container selectors
  const containers = [
    '.listupd article',
    '.bsx',
    '.animposx',
    'article.bs',
    '.movielist .bs',
  ];

  let found = false;
  for (const selector of containers) {
    const els = $(selector);
    if (els.length > 0) {
      els.each((_, el) => {
        const card = parseAnimeCard($, el as Element);
        if (card.title) items.push(card);
      });
      found = true;
      break;
    }
  }

  if (!found) {
    // Fallback: find any article elements
    $('article').each((_, el) => {
      const card = parseAnimeCard($, el as Element);
      if (card.title && card.animeId) items.push(card);
    });
  }

  const pagination = parsePagination($, page);
  if (items.length > 0) pagination.resultsPerPage = items.length;

  return { items, pagination };
}

export async function scrapeAnimeDetail(animeId: string): Promise<AnimeDetail> {
  const url = `${config.baseUrl}/anime/${animeId}/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  // animefull = outer wrapper; single-info = info sidebar on episode page
  const animefullBox = $('.bixbox.animefull, .infoanime').first();
  const infoBox = animefullBox.length ? animefullBox : $('.single-info').first();

  const title =
    infoBox.find('h1.entry-title, h1[itemprop="name"]').first().text().trim() ||
    $('h1.entry-title').text().trim() ||
    $('h1').first().text().trim();

  const alternativeTitle =
    infoBox.find('.alter').text().trim() ||
    infoBox.find('span:contains("Alt")').next().text().trim() ||
    '';

  const thumbnail =
    infoBox.find('.thumbook .thumb img, .thumb img').first().attr('src') ||
    infoBox.find('img').first().attr('src') ||
    infoBox.find('img').first().attr('data-src') ||
    $('meta[property="og:image"]').attr('content') ||
    '';

  // Parse metadata fields dynamically
  const meta: Record<string, string> = {};
  infoBox.find('.spe span, .info-content span, span').each((_, el) => {
    const text = $(el).text();
    const match = text.match(/^([^:]+):\s*(.+)$/s);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const value = $(el).find('a').first().text().trim() || match[2].trim();
      meta[key] = value;
    }
  });

  // Also scan b tags
  infoBox.find('b').each((_, el) => {
    const label = $(el).text().replace(':', '').trim().toLowerCase();
    const value = $(el).next('a').text().trim() || $(el).parent().text().replace($(el).text(), '').trim();
    if (label && value) meta[label] = value;
  });

  const status = meta['status'] || infoBox.find('[class*="status"]').text().trim() || '';
  const studio = meta['studio'] || meta['studios'] || '';
  const released = meta['released'] || meta['aired'] || meta['year'] || '';
  const season = meta['season'] || '';
  const type = meta['type'] || infoBox.find('[class*="typez"]').text().trim() || '';
  const director = meta['director'] || meta['directed by'] || '';

  const casts: string[] = [];
  // Casts are inside .spe span that contains "Casts:" label
  infoBox.find('.spe span').each((_, el) => {
    if ($(el).find('b').text().toLowerCase().includes('cast')) {
      $(el).find('a').each((__, a) => {
        const name = $(a).text().trim();
        if (name) casts.push(name);
      });
    }
  });

  const genres: string[] = [];
  const genreBox = infoBox.find('.genxed, .genres, [class*="genre"]').first();
  genreBox.find('a').each((_, el) => {
    const g = $(el).text().trim();
    if (g) genres.push(g);
  });

  const synopsis =
    $('.bixbox.synp .entry-content p').text().trim() ||
    $('.bixbox.synp [itemprop="description"] p').text().trim() ||
    infoBox.find('.desc p, .mindesc p').first().text().trim() ||
    $('[itemprop="description"] p').first().text().trim() ||
    '';

  const rating =
    $('.single-info .rating strong').first().text().trim() ||
    infoBox.find('.rating strong').first().text().trim() ||
    $('[itemprop="ratingValue"]').text().trim() ||
    '';

  // Episodes
  const episodes: Episode[] = [];
  $('#singlepisode li, .eplister li, [id*="episode"] li').each((_, el) => {
    const item = $(el);
    const link = item.find('a').first();
    const epUrl = link.attr('href') || '';
    const epTitle = link.find('.epl-title').text().trim() || link.text().trim() || '';
    const epNum =
      link.find('.epl-num').text().trim() ||
      item.find('[class*="num"]').text().trim() ||
      '';
    const epThumb =
      link.find('img').attr('src') ||
      link.find('img').attr('data-src') ||
      '';
    const epDate =
      link.find('.epl-date').text().trim() ||
      item.find('[class*="date"]').text().trim() ||
      '';

    if (epUrl) {
      episodes.push({
        episodeNumber: isNaN(Number(epNum)) ? epNum : Number(epNum),
        title: epTitle,
        url: epUrl,
        thumbnail: epThumb,
        releaseDate: epDate,
      });
    }
  });

  return {
    animeId,
    title,
    alternativeTitle,
    thumbnail,
    status,
    studio,
    released,
    season,
    type,
    director,
    casts,
    genres,
    synopsis,
    rating,
    episodes,
  };
}

export async function scrapeFilters(filterType: 'genre' | 'studio' | 'season'): Promise<Array<{ name: string; slug: string; url: string }>> {
  const html = await fetchPage(`${config.baseUrl}/anime/`);
  const $ = cheerio.load(html);

  const results: Array<{ name: string; slug: string; url: string }> = [];
  const seen = new Set<string>();

  // Look in filter/sidebar widgets
  const selectors: Record<string, string[]> = {
    genre: [
      '[class*="genre"] a',
      '.genre-list a',
      'select[name="genre"] option',
      '.filter a[href*="genre"]',
      'a[href*="genre="]',
    ],
    studio: [
      '[class*="studio"] a',
      '.studio-list a',
      'select[name="studio"] option',
      '.filter a[href*="studio"]',
      'a[href*="studio="]',
    ],
    season: [
      '[class*="season"] a',
      '.season-list a',
      'select[name="season"] option',
      '.filter a[href*="season"]',
      'a[href*="season="]',
    ],
  };

  for (const selector of selectors[filterType]) {
    $(selector).each((_, el) => {
      const name = $(el).text().trim();
      if (!name || name === 'All' || name === '-') return;
      const href = $(el).attr('href') || $(el).attr('value') || '';
      const slug = normalizeFilterSlug(name);
      const key = slug;
      if (!seen.has(key) && name) {
        seen.add(key);
        results.push({ name, slug, url: href });
      }
    });
    if (results.length > 0) break;
  }

  return results;
}
