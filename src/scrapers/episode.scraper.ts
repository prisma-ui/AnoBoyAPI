import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { fetchPage } from '../utils/httpClient';
import { extractSlugFromUrl, extractEpisodeIdFromArticle, decodeBase64 } from '../utils/slugify';
import { EpisodeDetail, StreamingSource, Mirror, DownloadLink, EpisodeNav, RelatedEpisode, RecommendedSeries } from '../types';
import { config } from '../config/env';

export async function scrapeEpisodeDetail(episodeId: string): Promise<EpisodeDetail> {
  // Try to find by post ID or by direct slug
  const url = `${config.baseUrl}/?p=${episodeId}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  return parseEpisodePage($, html, episodeId);
}

export async function scrapeEpisodeByUrl(episodeUrl: string): Promise<EpisodeDetail> {
  const html = await fetchPage(episodeUrl);
  const $ = cheerio.load(html);
  const articleId = $('article[id^="post-"]').attr('id') || '';
  const episodeId = extractEpisodeIdFromArticle(articleId) || extractSlugFromUrl(episodeUrl);
  return parseEpisodePage($, html, episodeId);
}

function parseEpisodePage($: cheerio.CheerioAPI, _html: string, fallbackId: string): EpisodeDetail {
  // Episode ID from article tag
  const articleId = $('article[id^="post-"]').attr('id') || '';
  const episodeId = extractEpisodeIdFromArticle(articleId) || fallbackId;

  const title =
    $('h1.entry-title').text().trim() ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    '';

  // Extract episode number from title
  const epNumMatch = title.match(/episode\s+(\d+)/i) || title.match(/ep\.?\s*(\d+)/i);
  const episodeNumber = epNumMatch ? Number(epNumMatch[1]) : '';

  // Anime title (usually the title without episode part)
  const animeTitle =
    title.replace(/episode\s+\d+/i, '').replace(/ep\.?\s*\d+/i, '').trim() ||
    $('.breadcrumb a').last().text().trim() ||
    '';

  const thumbnail =
    $('meta[property="og:image"]').attr('content') ||
    $('.thumb img').attr('src') ||
    $('.thumb img').attr('data-src') ||
    '';

  const postedBy =
    $('.posted-by a').text().trim() ||
    $('[class*="author"] a').text().trim() ||
    $('.author').text().trim() ||
    '';

  const postedDate =
    $('.posted-on time').attr('datetime') ||
    $('.posted-on').text().trim() ||
    $('time[datetime]').attr('datetime') ||
    $('time').first().text().trim() ||
    '';

  // Type and subtitle from meta or labels
  const typeMeta =
    $('[class*="typez"]').first().text().trim() ||
    $('meta[property="article:section"]').attr('content') ||
    'TV';

  const subtitleMeta =
    $('[class*=" sb"]').first().text().trim() ||
    $('[class*="sub"]').first().text().trim() ||
    'Sub';

  // Streaming
  const streaming = parseStreaming($);

  // Mirrors
  const mirrors = parseMirrors($);

  // Downloads
  const downloads = parseDownloads($);

  // Navigation
  const { previousEpisode, nextEpisode } = parseNavigation($);

  // Related episodes
  const relatedEpisodes = parseRelatedEpisodes($);

  // Recommended
  const recommended = parseRecommended($);

  return {
    episodeId,
    title,
    episodeNumber,
    animeTitle,
    thumbnail,
    postedBy,
    postedDate,
    type: typeMeta,
    subtitle: subtitleMeta,
    streaming,
    mirrors,
    downloads,
    previousEpisode,
    nextEpisode,
    relatedEpisodes,
    recommended,
  };
}

function parseStreaming($: cheerio.CheerioAPI): StreamingSource {
  const embedHolder = $('#embed_holder, .player-embed, .embed-responsive, [id*="embed"]').first();
  const iframe =
    embedHolder.find('iframe').attr('src') ||
    embedHolder.find('iframe').attr('data-src') ||
    $('iframe[src*="drive"], iframe[src*="gdrive"], iframe[src*="player"]').first().attr('src') ||
    '';

  const embed =
    embedHolder.html() ||
    $('.player-embed').html() ||
    '';

  return { iframe, embed: embed?.trim() || '' };
}

function parseMirrors($: cheerio.CheerioAPI): Mirror[] {
  const mirrors: Mirror[] = [];

  $('select.mirror option, select[name="mirror"] option, [class*="mirror"] option').each((_, el) => {
    const name = $(el).text().trim();
    const encoded = $(el).attr('value') || '';
    if (!encoded || encoded === '0' || encoded === '') return;

    const decoded = decodeBase64(encoded);
    const iframeMatch = decoded.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    const iframeSrc = iframeMatch ? iframeMatch[1] : decoded;

    if (name && iframeSrc) {
      mirrors.push({ name, iframe: iframeSrc });
    }
  });

  return mirrors;
}

function parseDownloads($: cheerio.CheerioAPI): DownloadLink[] {
  const downloads: DownloadLink[] = [];

  $('.soraurlx, [class*="download"], .dlbox').each((_, section) => {
    const qualityEl = $(section).find('strong, b, h3, .quality').first();
    const quality = qualityEl.text().trim();

    $(section).find('a').each((_, link) => {
      const provider = $(link).text().trim();
      const url = $(link).attr('href') || '';
      if (url && provider) {
        downloads.push({ quality, provider, url });
      }
    });
  });

  return downloads;
}

function parseNavigation($: cheerio.CheerioAPI): { previousEpisode: EpisodeNav | null; nextEpisode: EpisodeNav | null } {
  let previousEpisode: EpisodeNav | null = null;
  let nextEpisode: EpisodeNav | null = null;

  const navBox = $('.naveps, .eps-nav, [class*="navep"]').first();

  const prevLink = navBox.find('a[rel="prev"], .prev a, a:contains("prev"), a:contains("Prev")').first();
  const nextLink = navBox.find('a[rel="next"], .next a, a:contains("next"), a:contains("Next")').first();

  // Fallback: first and last nav links
  const allNavLinks = navBox.find('a');

  const buildNav = (el: cheerio.Cheerio<Element>): EpisodeNav | null => {
    const url = el.attr('href') || '';
    if (!url) return null;
    const title = el.attr('title') || el.text().trim() || '';
    const episodeId = extractSlugFromUrl(url);
    return { title, url, episodeId };
  };

  if (prevLink.length > 0) {
    previousEpisode = buildNav(prevLink);
  } else if (allNavLinks.length >= 2) {
    previousEpisode = buildNav(allNavLinks.first());
  }

  if (nextLink.length > 0) {
    nextEpisode = buildNav(nextLink);
  } else if (allNavLinks.length >= 1) {
    nextEpisode = buildNav(allNavLinks.last());
  }

  return { previousEpisode, nextEpisode };
}

function parseRelatedEpisodes($: cheerio.CheerioAPI): RelatedEpisode[] {
  const related: RelatedEpisode[] = [];

  const section = $('h3:contains("Related Episodes")').parent().find('article, li, .bs');
  if (!section.length) {
    // Try sibling/next
    $('h3:contains("Related")').nextAll().find('article, li, .bs').each((_, el) => {
      const link = $(el).find('a').first();
      const url = link.attr('href') || '';
      if (!url) return;
      related.push({
        episodeId: extractSlugFromUrl(url),
        title: link.attr('title') || $(el).find('.title, h2, h3').text().trim() || link.text().trim(),
        url,
        thumbnail: $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '',
      });
    });
    return related;
  }

  section.each((_, el) => {
    const link = $(el).find('a').first();
    const url = link.attr('href') || '';
    if (!url) return;
    related.push({
      episodeId: extractSlugFromUrl(url),
      title: link.attr('title') || $(el).find('.title, h2, h3').text().trim() || link.text().trim(),
      url,
      thumbnail: $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '',
    });
  });

  return related;
}

function parseRecommended($: cheerio.CheerioAPI): RecommendedSeries[] {
  const recommended: RecommendedSeries[] = [];

  const findSection = (): cheerio.Cheerio<Element> => {
    let result = $('h3:contains("Recommended Series")').parent().find('article, li, .bs');
    if (!result.length) {
      result = $('h3:contains("Recommended")').nextAll().find('article, li, .bs');
    }
    return result;
  };

  findSection().each((_, el) => {
    const link = $(el).find('a').first();
    const url = link.attr('href') || '';
    if (!url) return;

    const animeId = extractSlugFromUrl(url);
    const title = link.attr('title') || $(el).find('.tt, h2, h3, .title').text().trim() || link.text().trim();
    const thumbnail = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
    const type = $(el).find('[class*="typez"]').text().trim() || '';
    const status = $(el).find('[class*="status"]').text().trim() || '';

    recommended.push({ animeId, title, url, thumbnail, type, status });
  });

  return recommended;
}
