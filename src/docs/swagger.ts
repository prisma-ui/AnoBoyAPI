import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anoboy API',
      version: '1.0.0',
      description: 'Production-ready Anime Scraper REST API for Anoboy (anoboy.be)',
      contact: { name: 'Anoboy API' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    tags: [
      { name: 'Anime', description: 'Anime listing and detail endpoints' },
      { name: 'Episode', description: 'Episode detail, streaming, downloads' },
      { name: 'Search', description: 'Search anime' },
      { name: 'Filters', description: 'Genre, studio, season filters' },
      { name: 'Health', description: 'Health check' },
    ],
    components: {
      schemas: {
        AnimeCard: {
          type: 'object',
          properties: {
            animeId: { type: 'string', example: 'tensei-shitara-slime-datta-ken-4th-season' },
            title: { type: 'string', example: 'Tensei shitara Slime Datta Ken 4th Season' },
            url: { type: 'string', example: 'https://anoboy.be/anime/tensei-shitara-slime-datta-ken-4th-season/' },
            thumbnail: { type: 'string', example: 'https://anoboy.be/wp-content/uploads/...' },
            status: { type: 'string', example: 'Ongoing' },
            type: { type: 'string', example: 'TV' },
            episode: { type: 'string', example: 'Episode 9' },
            sub: { type: 'string', example: 'Sub' },
          },
        },
        PaginatedAnimeList: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            source: { type: 'string', example: 'anoboy' },
            cached: { type: 'boolean', example: false },
            currentPage: { type: 'integer', example: 1 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
            nextPage: { type: 'integer', nullable: true, example: 2 },
            prevPage: { type: 'integer', nullable: true, example: null },
            resultsPerPage: { type: 'integer', example: 24 },
            totalResults: { type: 'integer', nullable: true, example: null },
            data: { type: 'array', items: { $ref: '#/components/schemas/AnimeCard' } },
          },
        },
        Episode: {
          type: 'object',
          properties: {
            episodeNumber: { oneOf: [{ type: 'integer' }, { type: 'string' }], example: 9 },
            title: { type: 'string', example: 'Episode 9' },
            url: { type: 'string', example: 'https://anoboy.be/slime-s4-ep9/' },
            thumbnail: { type: 'string' },
            releaseDate: { type: 'string', example: '2026-05-01' },
          },
        },
        AnimeDetail: {
          type: 'object',
          properties: {
            animeId: { type: 'string' },
            title: { type: 'string' },
            alternativeTitle: { type: 'string' },
            thumbnail: { type: 'string' },
            status: { type: 'string' },
            studio: { type: 'string' },
            released: { type: 'string' },
            season: { type: 'string' },
            type: { type: 'string' },
            director: { type: 'string' },
            casts: { type: 'array', items: { type: 'string' } },
            genres: { type: 'array', items: { type: 'string' } },
            synopsis: { type: 'string' },
            rating: { type: 'string' },
            episodes: { type: 'array', items: { $ref: '#/components/schemas/Episode' } },
          },
        },
        AnimeDetailResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            source: { type: 'string' },
            cached: { type: 'boolean' },
            data: { $ref: '#/components/schemas/AnimeDetail' },
          },
        },
        StreamingSource: {
          type: 'object',
          properties: {
            iframe: { type: 'string' },
            embed: { type: 'string' },
          },
        },
        Mirror: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Video' },
            iframe: { type: 'string' },
          },
        },
        DownloadLink: {
          type: 'object',
          properties: {
            quality: { type: 'string', example: '720p' },
            provider: { type: 'string', example: 'gofile' },
            url: { type: 'string' },
          },
        },
        EpisodeNav: {
          type: 'object',
          nullable: true,
          properties: {
            title: { type: 'string' },
            url: { type: 'string' },
            episodeId: { type: 'string' },
          },
        },
        EpisodeDetail: {
          type: 'object',
          properties: {
            episodeId: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
            title: { type: 'string' },
            episodeNumber: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
            animeTitle: { type: 'string' },
            thumbnail: { type: 'string' },
            postedBy: { type: 'string' },
            postedDate: { type: 'string' },
            type: { type: 'string', example: 'TV' },
            subtitle: { type: 'string', example: 'Sub' },
            streaming: { $ref: '#/components/schemas/StreamingSource' },
            mirrors: { type: 'array', items: { $ref: '#/components/schemas/Mirror' } },
            downloads: { type: 'array', items: { $ref: '#/components/schemas/DownloadLink' } },
            previousEpisode: { $ref: '#/components/schemas/EpisodeNav' },
            nextEpisode: { $ref: '#/components/schemas/EpisodeNav' },
            relatedEpisodes: { type: 'array', items: { type: 'object' } },
            recommended: { type: 'array', items: { type: 'object' } },
          },
        },
        EpisodeDetailResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            source: { type: 'string' },
            cached: { type: 'boolean' },
            data: { $ref: '#/components/schemas/EpisodeDetail' },
          },
        },
        FilterItem: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Isekai' },
            slug: { type: 'string', example: 'isekai' },
            url: { type: 'string', example: 'https://anoboy.be/?genre=isekai' },
          },
        },
        FilterListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            source: { type: 'string' },
            cached: { type: 'boolean' },
            data: { type: 'array', items: { $ref: '#/components/schemas/FilterItem' } },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Anime not found' },
          },
        },
      },
      responses: {
        Error: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Anime not found' },
            },
          },
        },
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'q parameter is required' },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Too many requests, please try again later.' },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
