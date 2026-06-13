import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import PQueue from 'p-queue';
import { config } from '../config/env';
import { logger } from './logger';

const queue = new PQueue({ concurrency: config.scraper.queueConcurrency });

const httpClient: AxiosInstance = axios.create({
  timeout: config.scraper.timeout,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'DNT': '1',
  },
  maxRedirects: 5,
});

axiosRetry(httpClient, {
  retries: config.scraper.retries,
  retryDelay: (retryCount) => retryCount * 1500,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkError(error) ||
      axiosRetry.isRetryableError(error) ||
      error.response?.status === 429 ||
      error.response?.status === 503
    );
  },
  onRetry: (retryCount, error) => {
    logger.warn(`Retry ${retryCount} for ${error.config?.url}`);
  },
});

// Detect Cloudflare/bot-protection challenge pages
function isChallengePage(html: string): boolean {
  return (
    html.includes('cf-browser-verification') ||
    html.includes('cf_chl_') ||
    html.includes('jschl-answer') ||
    html.includes('Ray ID') ||
    html.includes('DDoS protection by Cloudflare') ||
    html.includes('Enable JavaScript and cookies to continue') ||
    (html.includes('Checking your browser') && html.length < 15000)
  );
}

export async function fetchPage(url: string, options?: AxiosRequestConfig): Promise<string> {
  return queue.add(async () => {
    logger.debug(`Fetching: ${url}`);

    const response = await httpClient.get<string>(url, {
      responseType: 'text',
      headers: {
        Referer: new URL(url).origin + '/',
        ...options?.headers,
      },
      ...options,
    });

    const html = response.data as string;

    if (isChallengePage(html)) {
      logger.warn(`Challenge page detected for: ${url}`);
      throw new Error(`Cloudflare challenge detected for ${url} — cannot scrape`);
    }

    return html;
  }) as Promise<string>;
}

export default httpClient;
