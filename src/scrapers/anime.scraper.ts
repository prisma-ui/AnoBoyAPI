import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { fetchPage } from '../utils/httpClient';
import { extractSlugFromUrl, normalizeFilterSlug } from '../utils/slugify';
import { AnimeCard, AnimeDetail, Episode, CharacterVoice, AnimeListQuery } from '../types';
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
    query.search || query.genre || query.status || query.type ||
    query.studio || query.season || query.sort || query.sub;

  const params = new URLSearchParams();

  if (query.search) params.set('s', query.search);
  if (query.genre) params.set('genre[]', query.genre);
  if (query.status) params.set('status', query.status);
  if (query.type) params.set('type', query.type.toLowerCase());
  if (query.studio) params.set('studio[]', query.studio);
  if (query.season) params.set('season[]', query.season);
  if (query.sort) params.set('order', query.sort);
  if (query.sub) params.set('sub', query.sub);

  if (hasFilters) {
    // Filtered anime list uses /anime?param=value&page=N
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return `${config.baseUrl}/anime${qs ? '?' + qs : ''}`;
  }

  // Plain listing uses /anime/page/N/
  if (page > 1) {
    return `${config.baseUrl}/anime/page/${page}/`;
  }
  return `${config.baseUrl}/anime/`;
}

function parsePagination($: cheerio.CheerioAPI, currentPage: number): PaginationInfo {
  let hasNextPage = false;
  let hasPrevPage = currentPage > 1;
  let nextPage: number | null = null;
  let prevPage: number | null = currentPage > 1 ? currentPage - 1 : null;

  // Anoboy uses .hpage a.r (next) and .hpage a.l (prev)
  const nextEl = $('.hpage a.r, a.next.page-numbers, a[rel="next"]').first();
  const prevEl = $('.hpage a.l, a.prev.page-numbers, a[rel="prev"]').first();

  if (nextEl.length > 0) {
    hasNextPage = true;
    // Extract page number from href if available, fallback to currentPage+1
    const nextHref = nextEl.attr('href') || '';
    const nextMatch = nextHref.match(/[?&]page=(\d+)/) || nextHref.match(/\/page\/(\d+)/);
    nextPage = nextMatch ? Number(nextMatch[1]) : currentPage + 1;
  }

  if (prevEl.length > 0) {
    hasPrevPage = true;
    const prevHref = prevEl.attr('href') || '';
    const prevMatch = prevHref.match(/[?&]page=(\d+)/) || prevHref.match(/\/page\/(\d+)/);
    prevPage = prevMatch ? Number(prevMatch[1]) : currentPage - 1;
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

  // Characters & Voice Actors from .bixbox.charvoice .cvlist
  const characters: CharacterVoice[] = [];
  $('.bixbox.charvoice .cvlist .cvitem').each((_, el) => {
    const item = $(el);

    const charEl = item.find('.cvchar');
    const character = charEl.find('.charname').first().text().trim();
    const characterRole = charEl.find('.charrole').first().text().trim();
    const characterImage =
      charEl.find('img').attr('src') ||
      charEl.find('img').attr('data-src') ||
      '';

    const actorEl = item.find('.cvactor');
    const actor = actorEl.find('.charname').first().text().trim();
    const actorRole = actorEl.find('.charrole').first().text().trim();
    const actorImage =
      actorEl.find('img').attr('src') ||
      actorEl.find('img').attr('data-src') ||
      '';
    const actorUrl = actorEl.find('a').first().attr('href') || '';

    if (character) {
      characters.push({ character, characterRole, characterImage, actor, actorRole, actorImage, actorUrl });
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
    characters,
    episodes,
  };
}

// Filter type can be checkbox-based (genre, studio, season) or radio-based (status, type, sub)
const CHECKBOX_FILTER_MAP: Record<string, string> = {
  genre: 'genre[]',
  studio: 'studio[]',
  season: 'season[]',
};

const RADIO_FILTER_MAP: Record<string, string> = {
  status: 'status',
  type: 'type',
  sub: 'sub',
  order: 'order',
};

export async function scrapeFilters(
  filterType: 'genre' | 'studio' | 'season' | 'status' | 'type' | 'sub' | 'order',
): Promise<Array<{ name: string; slug: string; url: string }>> {
  const html = await fetchPage(`${config.baseUrl}/anime/`);
  const $ = cheerio.load(html);

  const results: Array<{ name: string; slug: string; url: string }> = [];
  const seen = new Set<string>();

  const isCheckbox = filterType in CHECKBOX_FILTER_MAP;
  const inputName = isCheckbox
    ? CHECKBOX_FILTER_MAP[filterType]
    : RADIO_FILTER_MAP[filterType] ?? filterType;

  const selector = `input[name="${inputName}"]`;

  $(selector).each((_, el) => {
    const value = $(el).attr('value') || '';
    // Skip empty/all values
    if (!value) return;
    const label = $(`label[for="${$(el).attr('id')}"], label[for="${$(el).attr('name')}-${value}"]`).text().trim()
      || value;
    if (!label || label === 'All' || label === '-') return;

    const slug = value; // Use the HTML value directly as slug (already normalized by site)
    if (!seen.has(slug)) {
      seen.add(slug);
      results.push({ name: label, slug, url: '' });
    }
  });

  return results;
}
