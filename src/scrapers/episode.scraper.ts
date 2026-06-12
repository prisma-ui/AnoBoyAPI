import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { fetchPage } from '../utils/httpClient';
import { extractSlugFromUrl, extractEpisodeIdFromArticle, decodeBase64 } from '../utils/slugify';
import { EpisodeDetail, StreamingSource, Mirror, DownloadLink, EpisodeNav, RelatedEpisode, RecommendedSeries } from '../types';
import { config } from '../config/env';

export async function scrapeEpisodeDetail(episodeId: string): Promise<EpisodeDetail> {
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
  const articleId = $('article[id^="post-"]').attr('id') || '';
  const episodeId = extractEpisodeIdFromArticle(articleId) || fallbackId;

  // Title from h1.entry-title (not <title> tag)
  const title =
    $('h1.entry-title').text().trim() ||
    $('h1[itemprop="name"]').text().trim() ||
    $('h1').first().text().trim() ||
    '';

  // Episode number from itemprop or title regex
  const epNumMeta = $('[itemprop="episodeNumber"]').attr('content');
  const episodeNumber: number | string = epNumMeta
    ? Number(epNumMeta)
    : (() => {
        const m = title.match(/episode\s+(\d+)/i) || title.match(/ep\.?\s*(\d+)/i);
        return m ? Number(m[1]) : '';
      })();

  // Anime title from episode list heading or breadcrumb link
  const animeTitle =
    $('.year a[href*="/anime/"]').text().trim() ||
    $('.headlist .det h2 a').text().trim() ||
    $('.single-info h2[itemprop="partOfSeries"] a').text().trim() ||
    $('.infox h2[itemprop="partOfSeries"]').text().trim() ||
    '';

  // Thumbnail: prefer single-info section image (anime poster), fallback og:image
  const thumbnail =
    $('.single-info .thumb img').attr('src') ||
    $('.megavid .tb img').attr('src') ||
    $('meta[property="og:image"]').attr('content') ||
    '';

  // Posted by from meta itemprop or .year .fn
  const postedBy =
    $('meta[itemprop="author"]').attr('content') ||
    $('.year .fn').text().trim() ||
    $('.year .fn a').text().trim() ||
    '';

  // Posted date from meta itemprop
  const postedDate =
    $('meta[itemprop="datePublished"]').attr('content') ||
    $('time[itemprop="datePublished"]').attr('datetime') ||
    $('time[datetime]').first().attr('datetime') ||
    '';

  // Type from .epx (e.g. " TV Sub" — first text node before .lg span)
  const epxEl = $('span.epx').first();
  const typeMeta =
    epxEl
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .trim() || 'TV';

  // Subtitle from .lg inside .epx
  const subtitleMeta = epxEl.find('.lg').text().trim() || 'Sub';

  const streaming = parseStreaming($);
  const mirrors = parseMirrors($);
  const downloads = parseDownloads($);
  const { previousEpisode, nextEpisode } = parseNavigation($);
  const relatedEpisodes = parseRelatedEpisodes($);
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
  // Primary: #pembed iframe (main player)
  const iframe =
    $('#pembed iframe').attr('src') ||
    $('#pembed iframe').attr('data-src') ||
    $('#embed_holder iframe').attr('src') ||
    $('.player-embed iframe').attr('src') ||
    $('iframe[src*="blogger.com"], iframe[src*="drive.google"], iframe[src*="player"]').first().attr('src') ||
    '';

  const embed = ($('#pembed').html() || $('.player-embed').html() || '').trim();

  return { iframe, embed };
}

function parseMirrors($: cheerio.CheerioAPI): Mirror[] {
  const mirrors: Mirror[] = [];

  $('select.mirror option, select[name="mirror"] option').each((_, el) => {
    const name = $(el).text().trim();
    const encoded = $(el).attr('value') || '';
    // Skip placeholder option
    if (!encoded || name === 'Select Video Server' || name === '') return;

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

  // Each .soraddlx block contains a quality group
  $('.soraddlx').each((_, section) => {
    // Quality label from h3 inside .sorattlx, or from strong/b in .soraurlx
    const qualityHeader = $(section).find('.sorattlx h3').text().trim();
    const qualityInline = $(section).find('.soraurlx strong, .soraurlx b').first().text().trim();
    const quality = qualityHeader || qualityInline || '';

    $(section).find('.soraurlx a').each((_, link) => {
      const provider = $(link).text().trim();
      const url = $(link).attr('href') || '';
      if (url && provider) {
        downloads.push({ quality, provider, url });
      }
    });
  });

  // Fallback: icon download link in player nav
  if (downloads.length === 0) {
    $('.iconx a[href][aria-label="Download"]').each((_, link) => {
      const url = $(link).attr('href') || '';
      if (url) downloads.push({ quality: '', provider: 'Download', url });
    });
  }

  return downloads;
}

function parseNavigation($: cheerio.CheerioAPI): { previousEpisode: EpisodeNav | null; nextEpisode: EpisodeNav | null } {
  let previousEpisode: EpisodeNav | null = null;
  let nextEpisode: EpisodeNav | null = null;

  // .naveps.bignav contains .nvs divs with prev/next links
  const navBox = $('.naveps.bignav, .naveps, [class*="navep"]').first();

  const buildNav = (el: cheerio.Cheerio<Element>): EpisodeNav | null => {
    const url = el.attr('href') || '';
    if (!url || url === '#') return null;
    const title = el.attr('title') || el.find('.tex').text().trim() || el.text().trim() || '';
    const episodeId = extractSlugFromUrl(url);
    return { title, url, episodeId };
  };

  // rel="prev" / rel="next" attributes
  const prevLink = navBox.find('a[rel="prev"]').first();
  const nextLink = navBox.find('a[rel="next"]').first();

  if (prevLink.length > 0) {
    previousEpisode = buildNav(prevLink);
  }

  if (nextLink.length > 0) {
    nextEpisode = buildNav(nextLink);
  }

  // Fallback: first .nvs a = prev, last .nvs a = next (skip middle "All Episodes")
  if (!previousEpisode && !nextEpisode) {
    const nvsDivs = navBox.find('.nvs');
    if (nvsDivs.length >= 2) {
      const firstLink = nvsDivs.first().find('a').first();
      const lastLink = nvsDivs.last().find('a').first();
      if (firstLink.length && firstLink.attr('href') !== lastLink.attr('href')) {
        previousEpisode = buildNav(firstLink);
        nextEpisode = buildNav(lastLink);
      }
    }
  }

  return { previousEpisode, nextEpisode };
}

function parseRelatedEpisodes($: cheerio.CheerioAPI): RelatedEpisode[] {
  const related: RelatedEpisode[] = [];

  // Find bixbox section containing "Related Episodes" heading
  const section = $('.bixbox').filter((_, el) => {
    return $(el).find('h3').text().includes('Related Episodes');
  }).first();

  section.find('.bsx, article, li').each((_, el) => {
    const link = $(el).find('a').first();
    const url = link.attr('href') || '';
    if (!url) return;
    related.push({
      episodeId: extractSlugFromUrl(url),
      title: link.attr('title') || $(el).find('h2, h3, .title').text().trim() || link.text().trim(),
      url,
      thumbnail:
        $(el).find('img').attr('src') ||
        $(el).find('img').attr('data-src') ||
        '',
    });
  });

  return related;
}

function parseRecommended($: cheerio.CheerioAPI): RecommendedSeries[] {
  const recommended: RecommendedSeries[] = [];

  // Find bixbox section containing "Recommended" heading
  const section = $('.bixbox').filter((_, el) => {
    return $(el).find('h3').text().includes('Recommended');
  }).first();

  section.find('article.bs, .bsx').each((_, el) => {
    const link = $(el).find('a').first();
    const url = link.attr('href') || '';
    if (!url) return;

    const animeId = extractSlugFromUrl(url);
    const title =
      link.attr('title') ||
      $(el).find('.tt').clone().children('h2').remove().end().text().trim() ||
      $(el).find('h2').text().trim() ||
      link.text().trim();
    const thumbnail =
      $(el).find('img').attr('src') ||
      $(el).find('img').attr('data-src') ||
      '';
    const type = $(el).find('[class*="typez"]').text().trim() || '';
    const status = $(el).find('[class*="status"]').text().trim() || '';

    recommended.push({ animeId, title, url, thumbnail, type, status });
  });

  return recommended;
}
