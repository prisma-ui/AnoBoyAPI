export interface AnimeCard {
  animeId: string;
  title: string;
  url: string;
  thumbnail: string;
  status: string;
  type: string;
  episode: string;
  sub: string;
}

export interface Episode {
  episodeNumber: number | string;
  title: string;
  url: string;
  thumbnail: string;
  releaseDate: string;
}

export interface AnimeDetail {
  animeId: string;
  title: string;
  alternativeTitle: string;
  thumbnail: string;
  status: string;
  studio: string;
  released: string;
  season: string;
  type: string;
  director: string;
  casts: string[];
  genres: string[];
  synopsis: string;
  rating: string;
  episodes: Episode[];
}

export interface StreamingSource {
  iframe: string;
  embed: string;
}

export interface Mirror {
  name: string;
  iframe: string;
}

export interface DownloadLink {
  quality: string;
  provider: string;
  url: string;
}

export interface EpisodeNav {
  title: string;
  url: string;
  episodeId: string;
}

export interface RelatedEpisode {
  episodeId: string;
  title: string;
  url: string;
  thumbnail: string;
}

export interface RecommendedSeries {
  animeId: string;
  title: string;
  url: string;
  thumbnail: string;
  type: string;
  status: string;
}

export interface EpisodeDetail {
  episodeId: string | number;
  title: string;
  episodeNumber: string | number;
  animeTitle: string;
  thumbnail: string;
  postedBy: string;
  postedDate: string;
  type: string;
  subtitle: string;
  streaming: StreamingSource;
  mirrors: Mirror[];
  downloads: DownloadLink[];
  previousEpisode: EpisodeNav | null;
  nextEpisode: EpisodeNav | null;
  relatedEpisodes: RelatedEpisode[];
  recommended: RecommendedSeries[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  source: string;
  cached: boolean;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  resultsPerPage: number;
  totalResults: number | null;
  data: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  source: string;
  cached: boolean;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

export interface AnimeListQuery {
  page?: number;
  search?: string;
  genre?: string;
  status?: string;
  type?: string;
  studio?: string;
  season?: string;
  sort?: string;
}

export interface FilterItem {
  name: string;
  slug: string;
  url: string;
}
