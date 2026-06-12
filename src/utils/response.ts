import { Response } from 'express';
import { PaginatedResponse, ApiResponse, ErrorResponse } from '../types';

export function sendPaginated<T>(
  res: Response,
  data: Omit<PaginatedResponse<T>, 'success' | 'source'> & { cached?: boolean }
): void {
  res.json({
    success: true,
    source: 'anoboy',
    cached: data.cached ?? false,
    currentPage: data.currentPage,
    hasNextPage: data.hasNextPage,
    hasPrevPage: data.hasPrevPage,
    nextPage: data.nextPage,
    prevPage: data.prevPage,
    resultsPerPage: data.resultsPerPage,
    totalResults: data.totalResults,
    data: data.data,
  } satisfies PaginatedResponse<T>);
}

export function sendSuccess<T>(res: Response, data: T, cached = false): void {
  res.json({
    success: true,
    source: 'anoboy',
    cached,
    data,
  } satisfies ApiResponse<T>);
}

export function sendError(res: Response, message: string, statusCode = 500): void {
  res.status(statusCode).json({
    success: false,
    message,
  } satisfies ErrorResponse);
}
