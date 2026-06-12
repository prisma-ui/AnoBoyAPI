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
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  },
});

axiosRetry(httpClient, {
  retries: config.scraper.retries,
  retryDelay: (retryCount) => retryCount * 1000,
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

export async function fetchPage(url: string, options?: AxiosRequestConfig): Promise<string> {
  return queue.add(async () => {
    logger.debug(`Fetching: ${url}`);
    const response = await httpClient.get<string>(url, {
      responseType: 'text',
      ...options,
    });
    return response.data;
  }) as Promise<string>;
}

export default httpClient;
