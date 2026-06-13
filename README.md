---
title: Anoboy API
emoji: 🎬
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
---

# Anoboy Scraper API

Unofficial REST API for [anoboy.be](https://anoboy.be) — built with Express, TypeScript, Cheerio, and Swagger UI.

## Features

- Latest releases & recommendations (homepage)
- Anime archive with filters (genre, season, studio, status, type, sub, order)
- Anime detail (synopsis, info, characters, episode list, recommendations)
- Episode detail (stream player, mirrors, download links, navigation)
- Genre browsing
- Search
- AZ list (alphabetical browse)
- Interactive API docs via Swagger UI at `/docs`

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/home` | Latest releases + recommendations |
| GET | `/api/anime` | Browse/search anime with filters |
| GET | `/api/anime/:slug` | Anime detail + episode list |
| GET | `/api/episode/:slug` | Episode stream, mirrors, downloads |
| GET | `/api/genres/:slug` | Anime list by genre |
| GET | `/api/search?q=` | Search anime |
| GET | `/api/az-list?show=` | Alphabetical anime list |

## Local Development

```bash
npm install
npm run dev      # ts-node-dev with hot reload
```

Server runs on `http://localhost:3000`, docs at `/docs`.

## Build & Run (Production)

```bash
npm install
npm run build
npm start
```

## Deployment

### Render

Repo includes `render.yaml`. Connect the repo on [Render](https://render.com) — it auto-detects the build (`npm install && npm run build`) and start (`npm start`) commands.

### Vercel

Repo includes `vercel.json` and `api/index.ts`, which wrap the Express app as a serverless function.

```bash
vercel --prod
```

Or connect the repo via the Vercel dashboard.

### Hugging Face Spaces (Docker)

This repo includes a `Dockerfile` and Space config in this README's frontmatter (`sdk: docker`, `app_port: 7860`).

1. Create a new Space on [huggingface.co](https://huggingface.co/new-space) with **Docker** SDK.
2. Push this repo's contents to the Space repo.

#### Auto-deploy via GitHub Actions

A workflow at `.github/workflows/deploy-hf.yml` pushes to your HF Space on every push to `main`.

Add these secrets in your GitHub repo (**Settings → Secrets and variables → Actions**):

- `HF_TOKEN` — Hugging Face access token (write permission)
- `HF_USERNAME` — your HF username or org name
- `HF_SPACE_NAME` — the Space's repo name

## Disclaimer

This is an unofficial scraper for educational purposes. It is not affiliated with anoboy.be. Respect the source site's terms of service and rate limits.
