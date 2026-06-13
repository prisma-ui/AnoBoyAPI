import axios from "axios";
import * as cheerio from "cheerio";
import { BASE_URL, HEADERS } from "./config";

export async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  return data;
}

export interface AnimeCard {
  title: string;
  url: string;
  slug: string;
  thumbnail: string;
  type: string | null;
  episode: string | null;
  sub: string | null;
  status: string | null;
}

function slugFromUrl(url: string): string {
  return url.replace(BASE_URL ?? "", "").replace(/^\/|\/$/g, "");
}

function parseCard($: cheerio.CheerioAPI, el: any): AnimeCard {
  const a = $(el).find(".bsx > a").first();
  const url = a.attr("href") || "";
  const img = a.find("img").first();
  return {
    title: a.find(".tt h2").text().trim(),
    url,
    slug: slugFromUrl(url),
    thumbnail: img.attr("src") || "",
    type: a.find(".limit .typez").text().trim() || null,
    episode: a.find(".bt .epx").text().trim() || null,
    sub: a.find(".bt .sb").text().trim() || null,
    status: a.find(".limit .status").text().trim() || null,
  };
}

function getNextPage($: cheerio.CheerioAPI): string | null {
  const href =
    $(".hpage a.r").attr("href") || $(".pagination a.next").attr("href") || null;
  return href ? slugFromUrl(href) : null;
}

export interface ArchiveResult {
  items: AnimeCard[];
  nextPage: string | null;
}

export function parseArchive(html: string): ArchiveResult {
  const $ = cheerio.load(html);
  const items: AnimeCard[] = [];
  $(".listupd > article.bs").each((_, el) => {
    items.push(parseCard($, el));
  });
  return { items, nextPage: getNextPage($) };
}

export function parseGenre(html: string): ArchiveResult {
  return parseArchive(html);
}
export interface EpisodeListItem {
  number: string;
  title: string;
  date: string;
  url: string;
  slug: string;
}

export interface AnimeDetail {
  title: string;
  altTitles: string | null;
  thumbnail: string;
  trailer: string | null;
  synopsis: string;
  genres: string[];
  info: Record<string, string>;
  firstEpisode: { title: string; url: string; slug: string } | null;
  latestEpisode: { title: string; url: string; slug: string } | null;
  episodes: EpisodeListItem[];
  recommendations: AnimeCard[];
}

export function parseAnimeDetail(html: string): AnimeDetail {
  const $ = cheerio.load(html);

  const title = $(".entry-title").first().text().trim();
  const altTitles = $(".alter").first().text().trim() || null;
  const thumbnail = $(".thumbook .thumb img").first().attr("src") || "";
  const trailer = $(".rt a.trailerbutton").attr("href") || null;
  const synopsis = $(".bixbox.synp .entry-content")
    .first()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  const genres: string[] = [];
  $(".genxed a").each((_, el) => {
    genres.push($(el).text().trim());
  });

  const info: Record<string, string> = {};
  $(".info-content .spe span").each((_, el) => {
    const label = $(el).find("b").first().text().trim().replace(/:$/, "");
    const clone = $(el).clone();
    clone.find("b").remove();
    const value = clone.text().trim();
    if (label) info[label] = value;
  });

  const lastend = $(".lastend .inepcx");
  const parseLastendItem = (el: any) => {
    const a = $(el).find("a");
    const href = a.attr("href") || "";
    if (!href || href === "#") return null;
    return {
      title: a.find(".epcur").text().trim(),
      url: href,
      slug: slugFromUrl(href),
    };
  };
  const firstEpisode = lastend.length > 0 ? parseLastendItem(lastend.get(0)) : null;
  const latestEpisode = lastend.length > 1 ? parseLastendItem(lastend.get(1)) : null;

  const episodes: EpisodeListItem[] = [];
  $(".eplister ul li a").each((_, el) => {
    const href = $(el).attr("href") || "";
    episodes.push({
      number: $(el).find(".epl-num").text().trim(),
      title: $(el).find(".epl-title").text().trim(),
      date: $(el).find(".epl-date").text().trim(),
      url: href,
      slug: slugFromUrl(href),
    });
  });

  const recommendations: AnimeCard[] = [];
  $(".bixbox")
    .filter((_, el) => $(el).find(".releases h3").text().includes("Recommended"))
    .find(".listupd article.bs")
    .each((_, el) => {
      recommendations.push(parseCard($, el));
    });

  return {
    title,
    altTitles,
    thumbnail,
    trailer,
    synopsis,
    genres,
    info,
    firstEpisode,
    latestEpisode,
    episodes,
    recommendations,
  };
}

export interface MirrorOption {
  label: string;
  embedUrl: string | null;
}

export interface DownloadLink {
  quality: string;
  provider: string;
  url: string;
}

export interface RelatedEpisode {
  title: string;
  url: string;
  slug: string;
  thumbnail: string;
}

export interface EpisodeDetail {
  title: string;
  series: { title: string; url: string; slug: string } | null;
  episodeNumber: string | null;
  streamUrl: string | null;
  mirrors: MirrorOption[];
  downloads: DownloadLink[];
  prevEpisode: string | null;
  nextEpisode: string | null;
  allEpisodesUrl: string | null;
  info: Record<string, string>;
  genres: string[];
  relatedEpisodes: RelatedEpisode[];
  recommendations: AnimeCard[];
}

function extractIframeSrc(html: string): string | null {
  const match = html.match(/<iframe[^>]*src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export function parseEpisodeDetail(html: string): EpisodeDetail {
  const $ = cheerio.load(html);

  const title = $(".entry-title").first().text().trim();

  const seriesLink = $(".year a").filter((_, el) => {
    const href = $(el).attr("href") || "";
    return href.includes("/anime/");
  });
  const series =
    seriesLink.length > 0
      ? {
          title: seriesLink.text().trim(),
          url: seriesLink.attr("href") || "",
          slug: slugFromUrl(seriesLink.attr("href") || ""),
        }
      : null;

  const episodeNumber = $('meta[itemprop="episodeNumber"]').attr("content") || null;

  const streamUrl = $("#embed_holder iframe").attr("src") || null;

  const mirrors: MirrorOption[] = [];
  $("select.mirror option").each((_, el) => {
    const value = $(el).attr("value") || "";
    const label = $(el).text().trim();
    if (!value) return;
    let embedUrl: string | null = null;
    try {
      const decoded = Buffer.from(value, "base64").toString("utf-8");
      embedUrl = extractIframeSrc(decoded);
    } catch {
      embedUrl = null;
    }
    mirrors.push({ label, embedUrl });
  });

  const downloads: DownloadLink[] = [];
  $(".soraddlx .soraurlx").each((_, el) => {
    const quality = $(el).find("strong").first().text().trim();
    $(el)
      .find("a")
      .each((_, a) => {
        downloads.push({
          quality,
          provider: $(a).text().trim(),
          url: $(a).attr("href") || "",
        });
      });
  });

  const prevHref = $('.naveps .nvs a[rel="prev"]').attr("href") || null;
  const nextHref = $('.naveps .nvs a[rel="next"]').attr("href") || null;
  const allEpisodesUrl = $(".naveps .nvsc a").attr("href") || null;

  const info: Record<string, string> = {};
  $(".single-info .info-content .spe span").each((_, el) => {
    const label = $(el).find("b").first().text().trim().replace(/:$/, "");
    const clone = $(el).clone();
    clone.find("b").remove();
    const value = clone.text().trim();
    if (label) info[label] = value;
  });

  const genres: string[] = [];
  $(".single-info .genxed a").each((_, el) => {
    genres.push($(el).text().trim());
  });

  const relatedEpisodes: RelatedEpisode[] = [];
  $(".bixbox")
    .filter((_, el) => $(el).find(".releases h3").text().includes("Related Episodes"))
    .find(".listupd .stylefiv")
    .each((_, el) => {
      const a = $(el).find(".thumb a").first();
      const href = a.attr("href") || "";
      relatedEpisodes.push({
        title: $(el).find(".inf h2 a").first().text().trim(),
        url: href,
        slug: slugFromUrl(href),
        thumbnail: $(el).find(".thumb img").attr("src") || "",
      });
    });

  const recommendations: AnimeCard[] = [];
  $(".bixbox")
    .filter((_, el) => $(el).find(".releases h3").text().includes("Recommended"))
    .find(".listupd article.bs")
    .each((_, el) => {
      recommendations.push(parseCard($, el));
    });

  return {
    title,
    series,
    episodeNumber,
    streamUrl,
    mirrors,
    downloads,
    prevEpisode: prevHref ? slugFromUrl(prevHref) : null,
    nextEpisode: nextHref ? slugFromUrl(nextHref) : null,
    allEpisodesUrl: allEpisodesUrl ? slugFromUrl(allEpisodesUrl) : null,
    info,
    genres,
    relatedEpisodes,
    recommendations,
  };
}

export interface HomeResult {
  latest: AnimeCard[];
  nextPage: string | null;
  recommendations: { genre: string; items: AnimeCard[] }[];
}

export function parseHome(html: string): HomeResult {
  const $ = cheerio.load(html);

  const latest: AnimeCard[] = [];
  $(".listupd.normal .excstf article.bs").each((_, el) => {
    latest.push(parseCard($, el));
  });

  const nextPage = getNextPage($);
  const recommendations: { genre: string; items: AnimeCard[] }[] = [];
  $(".series-gen .nav-tabs li a").each((_, tabEl) => {
    const genre = $(tabEl).text().trim();
    const target = $(tabEl).attr("href") || "";
    const paneId = target.replace("#", "");
    const items: AnimeCard[] = [];
    $(`#${paneId} article.bs`).each((_, el) => {
      items.push(parseCard($, el));
    });
    recommendations.push({ genre, items });
  });

  return { latest, nextPage, recommendations };
}
