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
  const articleEl = $('article[id^="post-"]').first();
  const articleId = articleEl.attr('id') || '';
  const episodeId = extractEpisodeIdFromArticle(articleId) || fallbackId;

  // Scope all selectors to article to avoid sidebar contamination
  // $.root() returns Cheerio<Document> — use $('body') fallback to stay as Cheerio<Element>
  const art: cheerio.Cheerio<Element> = articleEl.length
    ? articleEl
    : $('body').first();

  // Title from h1.entry-title scoped to article
  const title =
    art.find('h1.entry-title').first().text().trim() ||
    art.find('h1[itemprop="name"]').first().text().trim() ||
    art.find('h1').first().text().trim() ||
    '';

  // Episode number from itemprop (meta tag inside article)
  const epNumMeta = art.find('[itemprop="episodeNumber"]').attr('content')
    || $('meta[itemprop="episodeNumber"]').attr('content');
  const episodeNumber: number | string = epNumMeta
    ? Number(epNumMeta)
    : (() => {
        const m = title.match(/episode\s+(\d+)/i) || title.match(/ep\.?\s*(\d+)/i);
        return m ? Number(m[1]) : '';
      })();

  // Anime title: .year span contains "series <a>AnimeTitle</a>"
  const animeTitle =
    art.find('.year a[href*="/anime/"]').first().text().trim() ||
    art.find('.headlist .det h2 a').first().text().trim() ||
    art.find('.single-info .infox h2').first().text().trim() ||
    '';

  // Thumbnail: single-info poster, then megavid thumb, then og:image
  const thumbnail =
    art.find('.single-info .thumb img').first().attr('src') ||
    art.find('.megavid .tb img').first().attr('src') ||
    $('meta[property="og:image"]').attr('content') ||
    '';

  // Posted by: meta itemprop (at end of article), then .year .fn
  const postedBy =
    art.find('meta[itemprop="author"]').attr('content') ||
    $('meta[itemprop="author"]').attr('content') ||
    art.find('.year .fn a').first().text().trim() ||
    art.find('.year .fn').first().text().trim() ||
    '';

  // Posted date: meta itemprop at end of article
  const postedDate =
    art.find('meta[itemprop="datePublished"]').attr('content') ||
    $('meta[itemprop="datePublished"]').attr('content') ||
    art.find('time[itemprop="datePublished"]').attr('datetime') ||
    '';

  // Type from .epx in .megavid (text node only, excludes .lg child)
  const epxEl = art.find('.megavid span.epx').first();
  const typeMeta =
    epxEl
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .trim() || 'TV';

  // Subtitle from .lg inside megavid .epx
  const subtitleMeta = art.find('.megavid span.epx .lg').first().text().trim() || 'Sub';

  const streaming = parseStreaming($, art);
  const mirrors = parseMirrors($, art);
  const downloads = parseDownloads($, art);
  const { previousEpisode, nextEpisode } = parseNavigation($, art);
  const relatedEpisodes = parseRelatedEpisodes($, art);
  const recommended = parseRecommended($, art);

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

function parseStreaming($: cheerio.CheerioAPI, art: cheerio.Cheerio<any>): StreamingSource {
  const iframe =
    art.find('#pembed iframe').first().attr('src') ||
    art.find('#pembed iframe').first().attr('data-src') ||
    art.find('#embed_holder iframe').first().attr('src') ||
    art.find('.player-embed iframe').first().attr('src') ||
    art.find('iframe[src*="blogger.com"]').first().attr('src') ||
    art.find('iframe[src*="drive.google"]').first().attr('src') ||
    art.find('iframe').first().attr('src') ||
    '';

  const embed = (art.find('#pembed').html() || art.find('.player-embed').html() || '').trim();

  return { iframe, embed };
}

function parseMirrors($: cheerio.CheerioAPI, art: cheerio.Cheerio<any>): Mirror[] {
  const mirrors: Mirror[] = [];

  art.find('select.mirror option, select[name="mirror"] option').each((_, el) => {
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

function parseDownloads($: cheerio.CheerioAPI, art: cheerio.Cheerio<any>): DownloadLink[] {
  const downloads: DownloadLink[] = [];

  // Each .soraddlx block contains a quality group
  art.find('.soraddlx').each((_, section) => {
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
    art.find('.iconx a[href][aria-label="Download"]').each((_, link) => {
      const url = $(link).attr('href') || '';
      if (url) downloads.push({ quality: '', provider: 'Download', url });
    });
  }

  return downloads;
}

function parseNavigation($: cheerio.CheerioAPI, art: cheerio.Cheerio<any>): { previousEpisode: EpisodeNav | null; nextEpisode: EpisodeNav | null } {
  let previousEpisode: EpisodeNav | null = null;
  let nextEpisode: EpisodeNav | null = null;

  // .naveps.bignav contains .nvs divs with prev/next links
  const navBox = art.find('.naveps.bignav, .naveps').first();

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

function parseRelatedEpisodes($: cheerio.CheerioAPI, art: cheerio.Cheerio<any>): RelatedEpisode[] {
  const related: RelatedEpisode[] = [];

  // Find bixbox section containing "Related Episodes" heading — scoped to article
  const section = art.find('.bixbox').filter((_, el) => {
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

function parseRecommended($: cheerio.CheerioAPI, art: cheerio.Cheerio<any>): RecommendedSeries[] {
  const recommended: RecommendedSeries[] = [];

  // Find bixbox section containing "Recommended" heading — scoped to article
  const section = art.find('.bixbox').filter((_, el) => {
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
